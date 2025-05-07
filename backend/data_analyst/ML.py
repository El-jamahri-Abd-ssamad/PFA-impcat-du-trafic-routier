import pandas as pd
import numpy as np
import ast
import joblib
import networkx as nx
from math import sqrt
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import r2_score, confusion_matrix, make_scorer

# --- Préparation des features temporelles

def extract_time_features(df):
    df['DateTime'] = pd.to_datetime(
        df['Date et heure de comptage'], format='%Y-%m-%d %H:%M:%S', errors='coerce'
    )
    df['Hour'] = df['DateTime'].dt.hour.ffill()
    df['Weekday'] = df['DateTime'].dt.weekday.ffill()
    df['Month'] = df['DateTime'].dt.month.ffill()
    df['sin_hour'] = np.sin(2 * np.pi * df['Hour'] / 24)
    df['cos_hour'] = np.cos(2 * np.pi * df['Hour'] / 24)
    df['sin_weekday'] = np.sin(2 * np.pi * df['Weekday'] / 7)
    df['cos_weekday'] = np.cos(2 * np.pi * df['Weekday'] / 7)
    df['sin_month'] = np.sin(2 * np.pi * df['Month'] / 12)
    df['cos_month'] = np.cos(2 * np.pi * df['Month'] / 12)
    return df

# --- Préparation des features spatiales

def extract_spatial_features(df):
    def _euclid(row):
        pts = ast.literal_eval(row['geo_shape'])
        p0, p1 = pts[0], pts[-1]
        return sqrt((p1[0] - p0[0])**2 + (p1[1] - p0[1])**2)
    df['euclid_dist'] = df.apply(_euclid, axis=1)
    df['start_lon'] = df['geo_shape'].apply(lambda s: ast.literal_eval(s)[0][0])
    df['start_lat'] = df['geo_shape'].apply(lambda s: ast.literal_eval(s)[0][1])
    df['end_lon'] = df['geo_shape'].apply(lambda s: ast.literal_eval(s)[-1][0])
    df['end_lat'] = df['geo_shape'].apply(lambda s: ast.literal_eval(s)[-1][1])
    return df

# --- Score de robustesse (<10% d'erreur relative)

def robust_score(y_true, y_pred):
    rel_err = np.abs(y_pred - y_true) / y_true
    return (rel_err < 0.10).mean()

# --- Entraînement et évaluation du modèle

def train_model():
    alpha, beta = 0.5, 0.5
    df = pd.read_csv(' F://pfa//pfaaaa//PFA-impcat-du-trafic-routier//backend//data_analyst//data_cleaned.csv', sep=';')
    df.columns = df.columns.str.strip()
    mapping = {'Fluide':1.0,'Pre_sature':1.5,'Ouvert':1.2,'Invalide':2.0}
    df['etat_factor'] = df['Etat trafic'].map(mapping)
    df.fillna(df.median(numeric_only=True), inplace=True)
    df = extract_time_features(df)
    df = extract_spatial_features(df)
    df['cost'] = (alpha * df['distance_arc'] + beta * df['Emission_CO2']) * df['etat_factor']

    weather = pd.read_csv(' F://pfa//pfaaaa//PFA-impcat-du-trafic-routier//backend//data_analyst//data_weather_cleaned.csv', sep=';')
    weather['Date'] = pd.to_datetime(weather['AAAAMMJJ'].astype(str), format='%Y%m%d').dt.date
    weather = weather[['Date','RR','TN','TX','TM','FF2M','FXI2','DXI2','HXI2']]
    weather.columns = ['Date','precip','temp_min','temp_max','temp_mean','wind_speed','wind_gust','gust_dir','humidex']
    df['Date'] = df['DateTime'].dt.date
    df = df.merge(weather, on='Date', how='left')
    df.fillna(method='ffill', inplace=True)

    features = ['Debit_Horaire', "Taux d'occupation", 'etat_factor', 'euclid_dist',
                'sin_hour','cos_hour','sin_weekday','cos_weekday','sin_month','cos_month',
                'precip','temp_min','temp_max','temp_mean','wind_speed','wind_gust','gust_dir','humidex']
    df['occ_x_hour'] = df["Taux d'occupation"] * df['sin_hour']
    df['occ_x_etat'] = df["Taux d'occupation"] * df['etat_factor']
    features += ['occ_x_hour','occ_x_etat','start_lon','start_lat','end_lon','end_lat']

    X = df[features]
    y = df['cost']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('model', XGBRegressor(objective='reg:squarederror', random_state=42))
    ])
    param_grid = {
        'model__n_estimators': [200, 500],
        'model__max_depth': [10, 15],
        'model__learning_rate': [0.05, 0.1]
    }
    grid = GridSearchCV(
        pipeline, param_grid, cv=5,
        scoring=make_scorer(robust_score), refit=True,
        n_jobs=-1, verbose=1
    )
    grid.fit(X_train, y_train)
    model = grid.best_estimator_

    y_train_pred = model.predict(X_train)
    y_test_pred = model.predict(X_test)
    print(f"R² train: {r2_score(y_train, y_train_pred):.4f}")
    print(f"R² test : {r2_score(y_test, y_test_pred):.4f}")
    print(f"Robustesse (<10%): {robust_score(y_test, y_test_pred)*100:.2f}%")

    median_cost = y_test.median()
    cm = confusion_matrix(
        (y_test > median_cost).astype(int),
        (y_test_pred > median_cost).astype(int)
    )
    print("Matrice de confusion (0=bas,1=haut):")
    print(cm)

    joblib.dump(model, 'best_model2.joblib')
    df[['Identifiant noeud amont','Identifiant noeud aval',
        'start_lon','start_lat','end_lon','end_lat']].to_csv('node_coords.csv', index=False)
    df[['Identifiant noeud amont','Identifiant noeud aval','cost']].to_csv('edge_costs.csv', index=False)
    return model

# --- Prédiction d'itinéraire optimal

def predict_route(start_coord, end_coord, model_file='best_model2.joblib'):
    edges = pd.read_csv('edge_costs.csv', dtype={'Identifiant noeud amont': int, 'Identifiant noeud aval': int})
    nodes = pd.read_csv('node_coords.csv', dtype={'Identifiant noeud amont': int, 'Identifiant noeud aval': int})

    G = nx.Graph()
    merged = edges.merge(nodes, on=['Identifiant noeud amont', 'Identifiant noeud aval'])
    for _, r in merged.iterrows():
        u, v = int(r['Identifiant noeud amont']), int(r['Identifiant noeud aval'])
        G.add_edge(u, v, weight=r['cost'])

    def closest_node(coord):
        dfn = nodes.assign(
            dist=lambda df: np.hypot(
                df['start_lat'] - coord[0], df['start_lon'] - coord[1]
            )
        )
        return int(dfn.loc[dfn['dist'].idxmin()]['Identifiant noeud amont'])

    src = closest_node(start_coord)
    tgt = closest_node(end_coord)

    if not nx.has_path(G, src, tgt):
        print(f"Aucun chemin possible entre {src} et {tgt}.")
        return []

    path_nodes = nx.dijkstra_path(G, src, tgt, weight='weight')
    route = []
    for n in path_nodes:
        rec = nodes[nodes['Identifiant noeud amont'] == n].iloc[0]
        route.append([float(rec['start_lat']), float(rec['start_lon'])])
    return route

if __name__ == '__main__':
    model = train_model()
    route = predict_route((48.8600, 2.3200), (48.8800, 2.3000))
    print("Itinéraire (liste de [lat, lon]):", route)
