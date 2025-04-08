import pandas as pd
import numpy as np
import networkx as nx
import ast
import random
from math import sqrt
from sklearn.ensemble import RandomForestRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error

# === PARAMÈTRES ===
alpha = 0.5  # pondération pour la distance
beta = 0.5   # pondération pour les émissions CO2

# Dictionnaire de pondération pour l'Etat trafic
etat_trafic_mapping = {
    "Fluide": 1.0,
    "Pre_sature": 1.5,
    "Ouvert": 1.2,
    "Invalide": 2.0  # Par exemple, on pénalise fortement un état invalide
}

# === 1. CHARGEMENT DES DONNÉES ===
df = pd.read_csv('data_cleaned.csv', sep=';')

# === 2. ENTRAÎNEMENT DU MODÈLE ===
features = ['Debit_Horaire', "Taux d'occupation"]
X = df[features]
y = df[['distance_arc', 'Emission_CO2']]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = MultiOutputRegressor(RandomForestRegressor(n_estimators=100, random_state=42))
model.fit(X_train, y_train)

predictions = model.predict(X)
df['predicted_distance'] = predictions[:, 0]
df['predicted_emission'] = predictions[:, 1]

# Mapping de l'état du trafic pour obtenir un facteur multiplicateur
df['etat_factor'] = df['Etat trafic'].map(etat_trafic_mapping)

# Calcul du coût composite incluant l'état du trafic
df['cost'] = (alpha * df['predicted_distance'] + beta * df['predicted_emission']) * df['etat_factor']

# === 3. SAUVEGARDE DES COÛTS DANS UN FICHIER CSV ===
df[['Identifiant arc', 'Libelle', 'Identifiant noeud amont', 'Identifiant noeud aval', 'cost']].to_csv('couts_arcs.csv', index=False)
print("✅ Les coûts des arcs ont été enregistrés dans le fichier 'couts_arcs.csv'.")

# === 4. CONSTRUCTION DU GRAPHE ===
G = nx.Graph()  # Graphe non orienté pour éviter les problèmes de sens unique
node_coords = {}  # Dictionnaire pour stocker les coordonnées de chaque nœud

def parse_geo_shape(geo_shape_str):
    try:
        return ast.literal_eval(geo_shape_str)
    except Exception as e:
        print("Erreur lors du parsing de geo_shape:", e)
        return None

# Ajout des arcs au graphe et stockage des coordonnées
for _, row in df.iterrows():
    start = row['Identifiant noeud amont']
    end = row['Identifiant noeud aval']
    cost = row['cost']
    points = parse_geo_shape(row['geo_shape'])
    if not points or len(points) < 2:
        continue  # On ignore si on ne peut extraire les points
    # On considère le premier point comme coordonnée associée au nœud amont
    # et le dernier au nœud aval
    start_coord, end_coord = points[0], points[-1]
    
    # Ajout de l'arc avec le coût et les coordonnées associées dans des attributs
    G.add_edge(start, end, weight=cost, start_coord=start_coord, end_coord=end_coord)
    
    # Enregistrement des coordonnées (première occurrence)
    if start not in node_coords:
        node_coords[start] = start_coord
    if end not in node_coords:
        node_coords[end] = end_coord

# === 5. SÉLECTION DE DEUX NŒUDS CONNECTÉS ===
components = list(nx.connected_components(G))
connected_components = [c for c in components if len(c) > 1]
selected_component = random.choice(connected_components)
start_node, end_node = random.sample(list(selected_component), 2)

print(f"\n🔹 Nœud de départ : {start_node} -> {node_coords[start_node]}")
print(f"🔹 Nœud d'arrivée : {end_node} -> {node_coords[end_node]}")

# === 6. CALCUL DE L'ITINÉRAIRE OPTIMAL AVEC DIJKSTRA ===
try:
    path_nodes = nx.dijkstra_path(G, source=start_node, target=end_node, weight='weight')
    total_cost = nx.dijkstra_path_length(G, source=start_node, target=end_node, weight='weight')
    print("\n✅ Itinéraire optimal trouvé (liste des nœuds) :")
    print(path_nodes)
    print(f"\n💰 Coût total de l'itinéraire : {total_cost:.4f}")
    
    # === 7. EXTRACTION DES POINTS POUR CHAQUE ARC DE L'ITINÉRAIRE ===
    # Pour chaque paire de nœuds consécutifs, récupérer les coordonnées de l'arc
    route_points = []
    for i in range(len(path_nodes) - 1):
        u = path_nodes[i]
        v = path_nodes[i+1]
        edge_data = G.get_edge_data(u, v)
        if edge_data is not None:
            # Pour le premier arc, on ajoute le point de départ
            if i == 0:
                route_points.append(edge_data['start_coord'])
            route_points.append(edge_data['end_coord'])
    
    print("\n🔸 Points composant l'itinéraire optimal :")
    for pt in route_points:
        print(pt)
        
except nx.NetworkXNoPath:
    print("❌ Aucun chemin trouvé entre les nœuds sélectionnés.")
