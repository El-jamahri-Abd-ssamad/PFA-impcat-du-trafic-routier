import csv

def extraire_n_lignes_csv(fichier_source, fichier_cible, n):
    with open(fichier_source, newline='', encoding='utf-8') as f_in, \
         open(fichier_cible, mode='w', newline='', encoding='utf-8') as f_out:
        
        lecteur = csv.reader(f_in)
        ecrivain = csv.writer(f_out)
        
        for _ in range(n):
            try:
                ligne = next(lecteur)
                ecrivain.writerow(ligne)
            except StopIteration:
                break  # Arrête si le fichier contient moins de n lignes

# Exemple d'utilisation
fichier_entree = "data.csv"
fichier_sortie = "data_frame.csv"
nombre_de_lignes = 100000  # Nombre de lignes à extraire

extraire_n_lignes_csv(fichier_entree, fichier_sortie, nombre_de_lignes)
print(f"Les {nombre_de_lignes} premières lignes ont été enregistrées dans {fichier_sortie}")
