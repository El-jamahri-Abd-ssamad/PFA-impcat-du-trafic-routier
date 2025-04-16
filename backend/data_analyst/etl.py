import pandas as pd
import re
import json
import math
import os
import multiprocessing as mp
from ast import literal_eval
from functools import partial
from io import StringIO  # Import pour utiliser une chaîne comme fichier

### PARTIE 1 : Chargement & Nettoyage ###
def load_and_clean_data(file_path, chunksize=50000):
    """
    Charge le fichier CSV en utilisant des morceaux (chunks) pour éviter les problèmes de mémoire.
    Supprime les doubles quotes dans le fichier, puis nettoie les données en supprimant les lignes contenant des colonnes vides.

    Args:
        file_path (str): Chemin du fichier d'entrée.
        chunksize (int): Taille des morceaux à charger.

    Returns:
        list: Liste des DataFrames nettoyés.
    """
    # Étape 1 : Vérifier si le fichier existe
    if not os.path.exists(file_path):
        print(f"Erreur : Le fichier {file_path} n'existe pas.")
        return None

    # Étape 2 : Supprimer les doubles quotes dans le contenu du fichier
    try:
        with open(file_path, 'r', encoding='utf-8') as fichier_entree:
            contenu = fichier_entree.read()
        
        # Supprimer toutes les doubles quotes
        contenu_modifie = contenu.replace('"', '')
        print("Les doubles quotes ont été supprimées.")

    except FileNotFoundError:
        print("Erreur : Fichier d'entrée non trouvé.")
        return None
    except Exception as e:
        print(f"Une erreur s'est produite lors de la suppression des doubles quotes : {str(e)}")
        return None

    # Étape 3 : Charger les données nettoyées en morceaux depuis la chaîne modifiée
    try:
        # Utilisation de StringIO pour simuler un fichier
        chaine_fichier = StringIO(contenu_modifie)
        chunks = pd.read_csv(chaine_fichier, delimiter=';', chunksize=chunksize)

        # Nettoyage des morceaux
        cleaned_chunks = []
        for chunk in chunks:
            # Supprime les lignes contenant au moins une colonne vide
            chunk = chunk.dropna(how='any')
            # Renommer la colonne "Débit horaire" en "Debit_Horaire"
            chunk.rename(columns={'Débit horaire': 'Debit_Horaire'}, inplace=True)

            # Modifier les valeurs de la colonne "Etat trafic"
            chunk['Etat trafic'] = chunk['Etat trafic'].replace({
                'Pré-saturé': 'Pre_sature',
                'Saturé': 'Sature',
                'Bloqué': 'Bloque'
            })

            # Conversion sécurisée de la colonne "Date et heure de comptage"
            chunk['Date et heure de comptage'] = pd.to_datetime(chunk['Date et heure de comptage'], errors='coerce', utc=True)

            # Vérification des erreurs de conversion
            if chunk['Date et heure de comptage'].isna().sum() > 0:
                print("Attention : certaines dates n'ont pas pu être converties.")

            # Reformater la date en format lisible (sans fuseau horaire)
            chunk['Date et heure de comptage'] = chunk['Date et heure de comptage'].dt.strftime('%Y-%m-%d %H:%M:%S')
            
            cleaned_chunks.append(chunk)

        return cleaned_chunks
    except Exception as e:
        print(f"Une erreur s'est produite lors du chargement des données : {str(e)}")
        return None


def clean_geo_shape(geo_str):
    """Nettoie et extrait les coordonnées et le type géométrique de la colonne 'geo_shape'."""
    if not isinstance(geo_str, str):  # Vérifie si la valeur est une chaîne
        return geo_str, None

    pattern = r"\{coordinates:\s*([\[\]\d\.,\s]+)\s*,\s*type:\s*([A-Za-z]+)\}"
    match = re.search(pattern, geo_str)
    if match:
        coords_str = match.group(1).strip()
        type_str = match.group(2).strip()
        try:
            coords = literal_eval(coords_str)
        except Exception:
            coords = coords_str
        return coords, type_str
    return geo_str, None

def process_geo_shape_column(df):
    """Applique la fonction de nettoyage sur la colonne 'geo_shape'."""
    if 'geo_shape' not in df.columns:
        print("Erreur : La colonne 'geo_shape' est absente du fichier.")
        return df

    # Remplace les valeurs manquantes par une chaîne vide et convertit en chaîne
    df['geo_shape'] = df['geo_shape'].fillna('').astype(str)

    # Applique la fonction de nettoyage
    df[['geo_shape', 'geo_type']] = df['geo_shape'].apply(lambda x: pd.Series(clean_geo_shape(x)))
    return df


### PARTIE 2 : Calcul des distances ###
def normalize_geo_shape(value):
    """Transforme 'geo_shape' en une liste de points [longitude, latitude]."""
    if isinstance(value, list):
        try:
            return [[float(point[0]), float(point[1])] for point in value]
        except Exception:
            return None

    if isinstance(value, str):
        try:
            points = json.loads(value)
            if isinstance(points, list):
                return [[float(point[0]), float(point[1])] for point in points]
        except Exception:
            numbers = re.findall(r"[-+]?\d*\.\d+|\d+", value)
            if len(numbers) % 2 != 0:
                return None
            return [[float(numbers[i]), float(numbers[i+1])] for i in range(0, len(numbers), 2)]
    
    # Retourne None si la valeur n'est ni une liste ni une chaîne
    return None

def haversine(lon1, lat1, lon2, lat2):
    """Calcule la distance entre deux points en km (formule de Haversine)."""
    R = 6371.0  # Rayon de la Terre en km
    lon1, lat1, lon2, lat2 = map(math.radians, [lon1, lat1, lon2, lat2])
    dlon, dlat = lon2 - lon1, lat2 - lat1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    return R * (2 * math.asin(math.sqrt(a)))

def calculer_distance_geo_shape(geo_shape_value):
    """Calcule la distance totale du trajet représenté par 'geo_shape'."""
    points = normalize_geo_shape(geo_shape_value)
    if not points:
        return None
    return sum(haversine(points[i][0], points[i][1], points[i+1][0], points[i+1][1]) for i in range(len(points) - 1))


### PARTIE 3 : Calcul des émissions de CO2 ###
emission_factors = {
    'Piéton/Vélo': 0,
    'Moto': 90,
    'Voiture essence': 180,
    'Voiture diesel': 160,
    'Voiture électrique': 0,
    'Bus': 1020,
    'Camion': 1200
}

def get_vehicle_type(debit_horaire):
    """Détermine le type de véhicule en fonction du débit horaire."""
    if debit_horaire <= 50:
        return 'Piéton/Vélo'
    elif 51 <= debit_horaire <= 200:
        return 'Moto'
    elif 201 <= debit_horaire <= 800:
        return 'Voiture essence'
    elif 801 <= debit_horaire <= 1500:
        return 'Voiture diesel'
    elif 1501 <= debit_horaire <= 2500:
        return 'Voiture électrique'
    elif 2501 <= debit_horaire <= 4000:
        return 'Bus'
    else:
        return 'Camion'

def calculate_co2_emissions(row):
    """Calcule les émissions de CO2 pour une ligne du DataFrame."""
    vehicle_type = get_vehicle_type(row['Debit_Horaire'])
    emission_factor = emission_factors.get(vehicle_type, 0)
    return emission_factor * row['distance_arc']


### PARTIE 4 : Traitement en parallèle ###
def process_chunk(chunk):
    """Nettoie et traite un morceau de DataFrame."""
    chunk = process_geo_shape_column(chunk)
    
    # Vérification des colonnes essentielles
    if 'geo_shape' not in chunk.columns or 'Debit_Horaire' not in chunk.columns:
        print("Erreur : Colonnes requises absentes du fichier.")
        return chunk
    
    chunk['distance_arc'] = chunk['geo_shape'].apply(calculer_distance_geo_shape)
    chunk['Emission_CO2'] = chunk.apply(calculate_co2_emissions, axis=1)
    return chunk


### PARTIE 5 : Exécution principale ###
def main():
    """Exécute le programme principal avec multiprocessing."""
    input_file = "data_frame.csv"
    output_file = "data_cleaned.csv"

    # Chargement du fichier en morceaux
    chunks = load_and_clean_data(input_file)
    if chunks is None:
        return

    num_cores = mp.cpu_count()  # Nombre de cœurs disponibles
    print(f"Utilisation de {num_cores} cœurs pour le traitement.")

    try:
        # Création du pool de workers
        with mp.Pool(num_cores) as pool:
            # Traitement en parallèle des morceaux (chunks)
            processed_chunks = pool.map(process_chunk, chunks)

        # Fusionner tous les morceaux et sauvegarder
        final_df = pd.concat(processed_chunks, ignore_index=True)
        final_df.to_csv(output_file, sep=";", index=False)

        print(f"Calcul terminé, fichier sauvegardé sous '{output_file}'")
    except Exception as e:
        print(f"Erreur lors du traitement : {e}")

if __name__ == "__main__":
    main()
