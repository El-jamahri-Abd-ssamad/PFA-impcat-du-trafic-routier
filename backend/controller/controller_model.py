# controller.py
from flask import Blueprint, request, jsonify
import joblib
import pandas as pd
import networkx as nx
import ast

# Création du Blueprint pour les prédictions
prediction_bp = Blueprint('prediction', __name__)

# Chargement du modèle et du scaler sauvegardés
model = joblib.load('modele_trafic.joblib')
scaler = joblib.load('scaler_trafic.joblib')

def build_graph_from_csv():
    """
    Construit un graphe à partir d'un fichier CSV contenant les arcs.
    Le fichier CSV 'couts_arcs.csv' doit comporter au moins les colonnes :
      - 'Identifiant noeud amont'
      - 'Identifiant noeud aval'
      - 'cost'
    Pour cet exemple, nous supposons que les coordonnées ne sont pas renseignées et nous
    utilisons des valeurs fictives.
    """
    df_arcs = pd.read_csv('couts_arcs.csv', sep=';')
    G = nx.Graph()
    node_coords = {}
    for idx, row in df_arcs.iterrows():
        start = row['Identifiant noeud amont']
        end = row['Identifiant noeud aval']
        cost = row['cost']
        # Pour cet exemple, nous attribuons des coordonnées fictives (à remplacer par vos données)
        if start not in node_coords:
            node_coords[start] = [0.0, 0.0]
        if end not in node_coords:
            node_coords[end] = [0.0, 0.0]
        G.add_edge(start, end, weight=cost)
    return G, node_coords

@prediction_bp.route('/predict', methods=['POST'])
def predict():
    """
    Endpoint de prédiction et routage.
    Exigences d'entrée (JSON) :
    {
      "Debit_Horaire": <float>,
      "Taux d'occupation": <float>,
      "Hour": <int>,
      "Weekday": <int>,
      "Month": <int>,
      "start_node": <str>,    // Identifiant du nœud de départ
      "end_node": <str>       // Identifiant du nœud d'arrivée
    }
    
    La réponse renvoie :
    {
      "predicted_distance": <float>,
      "predicted_emission": <float>,
      "routing_start_node": <str>,
      "routing_end_node": <str>,
      "optimized_path": [<list of node identifiers>],
      "total_estimated_CO2": <float>
    }
    """
    data = request.get_json(force=True)
    
    # Vérifier la présence des clés essentielles pour la prédiction et le routage
    required_keys = ["Debit_Horaire", "Taux d'occupation", "Hour", "Weekday", "Month", "start_node", "end_node"]
    missing_keys = [k for k in required_keys if k not in data]
    if missing_keys:
        return jsonify({"error": f"Missing keys in input: {missing_keys}"}), 400

    # Préparation des données pour la prédiction
    feature_keys = ["Debit_Horaire", "Taux d'occupation", "Hour", "Weekday", "Month"]
    input_data = {key: data[key] for key in feature_keys}
    df_input = pd.DataFrame([input_data])
    # Standardisation (le scaler doit avoir été entraîné avec exactement ces colonnes et dans ce même ordre)
    df_scaled = scaler.transform(df_input)
    prediction = model.predict(df_scaled)
    predicted_distance = prediction[0][0]
    predicted_emission = prediction[0][1]
    
    # Récupération des identifiants pour le routage
    routing_start = data["start_node"]
    routing_end = data["end_node"]
    
    response = {
        "predicted_distance": predicted_distance,
        "predicted_emission": predicted_emission,
        "routing_start_node": routing_start,
        "routing_end_node": routing_end
    }
    
    # Construire le graphe à partir du CSV des arcs
    G, node_coords = build_graph_from_csv()
    
    try:
        # Calcul de l'itinéraire optimisé par Dijkstra
        path = nx.dijkstra_path(G, source=routing_start, target=routing_end, weight='weight')
        total_route_cost = nx.dijkstra_path_length(G, source=routing_start, target=routing_end, weight='weight')
        # Ici, pour l'estimation du CO2 le long du chemin, nous considérons
        # que la prédiction "predicted_emission" s'applique par segment (ou par arc)
        estimated_total_CO2 = predicted_emission * (len(path) - 1)
        
        response["optimized_path"] = path
        response["total_estimated_CO2"] = estimated_total_CO2
    except nx.NetworkXNoPath:
        response["optimized_path"] = []
        response["total_estimated_CO2"] = None
        response["route_error"] = "No path found between the provided nodes."
    
    return jsonify(response)
