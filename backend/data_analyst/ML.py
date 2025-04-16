import pandas as pd
import numpy as np
import networkx as nx
import ast
import random
import joblib

from math import sqrt
from multiprocessing import Pool, cpu_count
from datetime import datetime
from sklearn.ensemble import RandomForestRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score, confusion_matrix
from sklearn.preprocessing import StandardScaler
# Optionnel : pour essayer une alternative qui peut être plus performante
# from xgboost import XGBRegressor

def process_row(row):
    """
    Traitement d'une ligne pour extraire :
      - Identifiant noeud amont et aval
      - Coût de l'arc
      - Prédiction des émissions de CO2 pour cet arc
      - Coordonnées du premier et dernier point extrait de geo_shape
    Retourne un tuple :
       (start, end, cost, predicted_emission, start_coord, end_coord)
    ou None en cas d'échec.
    """
    try:
        geo_shape_str = row['geo_shape']
        points = ast.literal_eval(geo_shape_str)
        if not points or len(points) < 2:
            return None
        start = row['Identifiant noeud amont']
        end = row['Identifiant noeud aval']
        cost = row['cost']
        # Récupération de la prédiction des émissions sur cet arc
        predicted_emission = row['predicted_emission']
        start_coord, end_coord = points[0], points[-1]
        return (start, end, cost, predicted_emission, start_coord, end_coord)
    except Exception:
        return None

def extract_time_features(df):
    """Extrait des features temporelles à partir de la colonne 'Date et heure de comptage'."""
    # Conversion en datetime en précisant le format adéquat
    df['DateTime'] = pd.to_datetime(df['Date et heure de comptage'], format='%Y-%m-%d %H:%M:%S', errors='coerce')
    # Extraire l'heure, le jour de la semaine et le mois
    df['Hour'] = df['DateTime'].dt.hour
    df['Weekday'] = df['DateTime'].dt.weekday  # 0 = lundi, ..., 6 = dimanche
    df['Month'] = df['DateTime'].dt.month
    # Affectation directe pour éviter le chained assignment
    df['Hour'] = df['Hour'].fillna(df['Hour'].median())
    df['Weekday'] = df['Weekday'].fillna(df['Weekday'].median())
    df['Month'] = df['Month'].fillna(df['Month'].median())
    return df

def main():
    # === PARAMÈTRES ===
    alpha = 0.5   # pondération pour la distance
    beta = 0.5    # pondération pour les émissions CO2
    
    # Mapping pour l'état trafic
    etat_trafic_mapping = {
        "Fluide": 1.0,
        "Pre_sature": 1.5,
        "Ouvert": 1.2,
        "Invalide": 2.0
    }
    
    robust_threshold = 0.10  # erreur relative < 10%

    # === 1. CHARGEMENT ET PRÉTRAITEMENT DES DONNÉES ===
    df = pd.read_csv('data_cleaned.csv', sep=';')
    df.columns = df.columns.str.strip()
    print("Colonnes disponibles :", df.columns.tolist())
    
    # Appliquer le mapping sur l'état trafic
    df['etat_factor'] = df['Etat trafic'].map(etat_trafic_mapping)
    # Imputer les valeurs manquantes pour les colonnes numériques
    df.fillna(df.median(numeric_only=True), inplace=True)
    # Extraction de features temporelles
    df = extract_time_features(df)
    
    # === 2. PRÉPARATION DES FEATURES ET TARGET ===
    # Enrichissement avec les features temporelles
    features = ['Debit_Horaire', "Taux d'occupation", 'Hour', 'Weekday', 'Month']
    X = df[features]
    y = df[['distance_arc', 'Emission_CO2']]
    
    # Standardisation des features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    # Conserver les index en convertissant en DataFrame
    X_scaled_df = pd.DataFrame(X_scaled, index=X.index, columns=X.columns)
    
    # Division en ensembles train et test
    X_train, X_test, y_train, y_test = train_test_split(X_scaled_df, y, test_size=0.2, random_state=42)
    
    # === 3. RECHERCHE D'HYPERPARAMÈTRES AVEC GRIDSEARCH ===
    # Élaboration d'un espace de recherche étendu
    param_grid = {
        'estimator__n_estimators': [100, 200, 300],
        'estimator__max_depth': [None, 10, 20, 30],
        'estimator__min_samples_split': [2, 5, 10]
    }
    grid_search = GridSearchCV(
        MultiOutputRegressor(RandomForestRegressor(random_state=42)),  # Vous pouvez essayer : XGBRegressor(random_state=42)
        param_grid, cv=3, scoring='r2', n_jobs=-1
    )
    grid_search.fit(X_train, y_train)
    print("Meilleurs paramètres:", grid_search.best_params_)
    model = grid_search.best_estimator_
    
    # === PRÉDICTIONS ET CALCUL DU COÛT COMPOSITE ===
    predictions = model.predict(X_scaled_df)
    df['predicted_distance'] = predictions[:, 0]
    df['predicted_emission'] = predictions[:, 1]
    
    # Calcul du coût composite
    df['cost'] = (alpha * df['predicted_distance'] + beta * df['predicted_emission']) * df['etat_factor']
    df = df[df['cost'].notna()]
    
    # === 4. ÉVALUATION DU MODÈLE ===
    df_test = df.loc[X_test.index]
    pred_test = model.predict(X_test)
    true_cost = (alpha * y_test['distance_arc'] + beta * y_test['Emission_CO2']) * df_test['etat_factor']
    pred_cost = (alpha * pred_test[:, 0] + beta * pred_test[:, 1]) * df_test['etat_factor']
    
    mask = true_cost.notna() & pred_cost.notna()
    true_cost = true_cost[mask]
    pred_cost = pred_cost[mask]
    
    mse = mean_squared_error(true_cost, pred_cost)
    mae = mean_absolute_error(true_cost, pred_cost)
    r2 = r2_score(true_cost, pred_cost)
    
    print("===== Évaluation du modèle sur l'ensemble test =====")
    print(f"MSE: {mse:.4f}")
    print(f"MAE: {mae:.4f}")
    print(f"R²: {r2:.4f}")
    
    median_cost = true_cost.median()
    true_class = (true_cost > median_cost).astype(int)
    pred_class = (pred_cost > median_cost).astype(int)
    cm = confusion_matrix(true_class, pred_class)
    print("\nMatrice de confusion (0 = coût faible, 1 = coût élevé):")
    print(cm)
    
    relative_errors = abs(pred_cost - true_cost) / true_cost
    robust_accuracy = (relative_errors < robust_threshold).mean() * 100
    print(f"\nRobustesse (erreur relative < {robust_threshold * 100:.0f}%): {robust_accuracy:.2f}%")
    
    # ---
    # Pour améliorer la robustesse et viser ~60%, vous pourrez :
    #   - Enrichir davantage le set de features (par ex. inclure des indicateurs météorologiques, zones géographiques, etc.)
    #   - Essayer des modèles alternatifs comme XGBoost avec MultiOutputRegressor
    #   - Optimiser le prétraitement (imputation, normalisation avancée, sélection de features)
    # Ces pistes nécessitent des itérations et une validation sur vos données réelles.
    # ---
    
    # === 5. SAUVEGARDE DES COÛTS DES ARCS ===
    df[['Identifiant arc', 'Libelle', 'Identifiant noeud amont', 'Identifiant noeud aval', 'cost']].to_csv('couts_arcs.csv', index=False)
    print("\n Coûts des arcs enregistrés dans 'couts_arcs.csv'.")
    
    # === 6. CONSTRUCTION DU GRAPHE AVEC MULTIPROCESSING ===
    with Pool(cpu_count()) as pool:
        rows = [row for _, row in df.iterrows()]
        results = pool.map(process_row, rows)
        
    G = nx.Graph()
    node_coords = {}
    for res in results:
        if res is not None:
            start, end, cost_edge, predicted_emission, start_coord, end_coord = res
            G.add_edge(start, end, weight=cost_edge, predicted_emission=predicted_emission,
                       start_coord=start_coord, end_coord=end_coord)
            if start not in node_coords:
                node_coords[start] = start_coord
            if end not in node_coords:
                node_coords[end] = end_coord

    # === 7. SÉLECTION DE 2 NŒUDS CONNECTÉS ALÉATOIREMENT ===
    components = list(nx.connected_components(G))
    connected_components = [c for c in components if len(c) > 1]
    if not connected_components:
        print("Aucun composant connecté de taille suffisante n'a été trouvé.")
        return
    
    selected_component = random.choice(connected_components)
    start_node, end_node = random.sample(list(selected_component), 2)
    print(f"\n Nœud de départ: {start_node} -> {node_coords[start_node]}")
    print(f" Nœud d'arrivée: {end_node} -> {node_coords[end_node]}")
    
    # === 8. CALCUL DE L'ITINÉRAIRE OPTIMAL AVEC DIJKSTRA ===
    try:
        path_nodes = nx.dijkstra_path(G, source=start_node, target=end_node, weight='weight')
        total_cost_path = nx.dijkstra_path_length(G, source=start_node, target=end_node, weight='weight')
        print("\n Itinéraire optimal (nœuds):", path_nodes)
        print(f"\n Coût total de l'itinéraire: {total_cost_path:.4f}")
        
        # Calcul de la quantité totale de CO₂ estimée le long de l’itinéraire
        total_CO2 = 0.0
        route_points = []
        for i in range(len(path_nodes) - 1):
            u = path_nodes[i]
            v = path_nodes[i + 1]
            edge_data = G.get_edge_data(u, v)
            if edge_data is not None:
                # Ajouter la prédiction de CO₂ de cet arc
                total_CO2 += edge_data.get('predicted_emission', 0)
                if i == 0:
                    route_points.append(edge_data['start_coord'])
                route_points.append(edge_data['end_coord'])
        print(f"\n Quantité totale estimée de CO₂ le long de l'itinéraire: {total_CO2:.4f}")
        print("\n Points composant l'itinéraire:")
        for pt in route_points:
            print(pt)
    except nx.NetworkXNoPath:
        print(" Aucun chemin trouvé entre les nœuds sélectionnés.")
        
    # Après avoir entraîné votre modèle, sauvegardez-le ainsi :
    joblib.dump(model, 'modele_trafic.joblib')
    joblib.dump(scaler, 'scaler_trafic.joblib')


if __name__ == '__main__':
    main()
