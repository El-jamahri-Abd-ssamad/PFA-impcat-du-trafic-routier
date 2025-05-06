# app.py (ou test_route.py)
from ML import predict_route

if __name__ == "__main__":
    # Coordonnées de départ et d’arrivée au format (latitude, longitude)
    depart = (48.8600, 2.3200)
    arrivee = (48.8800, 2.3000)

    # Appel de la fonction
    route = predict_route(depart, arrivee, model_file='best_model2.joblib')

    # Affichage du résultat : liste de sous-listes [lat, lon]
    print("Route retournée :", route)
