import pandas as pd
import re
from ast import literal_eval

# 1. Chargement du fichier CSV avec le séparateur ';'
df = pd.read_csv('data_frame.csv', delimiter=';')

# 2. Suppression des lignes vides et celles contenant au moins une valeur manquante
df = df.dropna(how='all').dropna()

def clean_geo_shape(geo_str):
    """
    Cette fonction reçoit une chaîne du type :
    {coordinates: [[coord1, coord2], [coord3, coord4], ...], type: LineString}
    
    Elle extrait :
      - La sous-chaîne correspondant à la liste des coordonnées
      - Le type (ici "LineString")
    
    La fonction retourne un tuple : (liste_de_coordonnées, type)
    """
    # Expression régulière pour capturer la liste des coordonnées et le type
    pattern = r"\{coordinates:\s*([\[\]\d\.,\s]+)\s*,\s*type:\s*([A-Za-z]+)\}"
    match = re.search(pattern, geo_str)
    if match:
        coords_str = match.group(1).strip()
        type_str = match.group(2).strip()
        try:
            # Convertir la chaîne des coordonnées en une liste Python
            coords = literal_eval(coords_str)
        except Exception as e:
            coords = coords_str  # En cas d'erreur, on garde la chaîne brute
        return coords, type_str
    else:
        # Si le pattern n'est pas trouvé, retourner la chaîne originale et None pour le type
        return geo_str, None

# 3. Appliquer le nettoyage sur la colonne geo_shape et créer une nouvelle colonne geo_type
# On remplace le contenu de geo_shape par la liste nettoyée
df[['geo_shape', 'geo_type']] = df['geo_shape'].apply(lambda x: pd.Series(clean_geo_shape(x)))

# 4. Sauvegarde du DataFrame nettoyé dans un nouveau fichier CSV
df.to_csv('cleaned_data.csv', index=False, sep=';')
print("Nettoyage terminé et fichier 'cleaned_data.csv' généré.")


df.info()
df.describe()
