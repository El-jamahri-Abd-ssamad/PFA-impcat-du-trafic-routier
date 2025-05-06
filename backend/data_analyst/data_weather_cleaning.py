import pandas as pd

# Charger le fichier contenant les données (remplacer 'fichier_entrée.csv' par le nom de ton fichier)
input_file = 'data_weather.csv'
output_file = 'data_weather_cleaned.csv'

# Lire les données dans un DataFrame
df = pd.read_csv(input_file, sep=";")

# Liste des colonnes à supprimer
columns_to_drop = [
    "DG", "QDG", "FFM", "QFFM", "FXY", "QFXY", "DXY", "QDXY", 
    "HXY", "QHXY", "FXI", "QFXI", "DXI", "QDXI", "HXI", "QHXI", 
    "FXI3S", "QFXI3S", "DXI3S", "QDXI3S", "HXI3S", "QHXI3S", 
    "DRR", "QDRR"
]

# Supprimer les colonnes spécifiées
df_cleaned = df.drop(columns=columns_to_drop)

# Supprimer les lignes contenant des valeurs manquantes
df_cleaned = df_cleaned.dropna()

# Enregistrer les données nettoyées dans un nouveau fichier CSV
df_cleaned.to_csv(output_file, index=False, sep=";")

print(f"Les données nettoyées ont été enregistrées dans {output_file}")
