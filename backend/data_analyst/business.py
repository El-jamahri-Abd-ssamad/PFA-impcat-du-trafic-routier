import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages

# Charger les données depuis le fichier CSV (à adapter avec le nom de votre fichier)
df = pd.read_csv('data_cleaned.csv', sep=';')

# Conversion de la colonne "Date et heure de comptage" en datetime en UTC
df['Date et heure de comptage'] = pd.to_datetime(df['Date et heure de comptage'], utc=True)

# Créer le rapport PDF et ajouter les graphiques
with PdfPages('rapport_trafic.pdf') as pdf:
    
    # Page de garde
    plt.figure(figsize=(11, 8.5))
    plt.axis('off')
    plt.text(0.5, 0.7, "Rapport d'analyse et modélisation\n de l'impact du trafic routier à Paris",
             fontsize=24, ha='center')
    plt.text(0.5, 0.5, "Ce rapport présente diverses visualisations pour étudier le trafic,\n"
                        "identifier les tendances et aider au choix des meilleurs itinéraires.",
             fontsize=14, ha='center')
    pdf.savefig()
    plt.close()

    # 1. Histogramme du Débit horaire
    plt.figure(figsize=(8, 5))
    sns.histplot(df['Debit_Horaire'], bins=10, kde=True)
    plt.title("Distribution du Débit horaire")
    plt.xlabel("Débit horaire")
    plt.ylabel("Fréquence")
    plt.figtext(0.5, -0.05, "Ce graphique montre la distribution du débit horaire, indicateur des volumes de trafic.",
                wrap=True, horizontalalignment='center', fontsize=10)
    plt.tight_layout()
    pdf.savefig()
    plt.close()

    # 2. Histogramme du Taux d'occupation
    plt.figure(figsize=(8, 5))
    sns.histplot(df["Taux d'occupation"], bins=10, kde=True, color='orange')
    plt.title("Distribution du Taux d'occupation")
    plt.xlabel("Taux d'occupation")
    plt.ylabel("Fréquence")
    plt.figtext(0.5, -0.05, "Ce graphique représente la distribution du taux d'occupation, reflet de la densité du trafic.",
                wrap=True, horizontalalignment='center', fontsize=10)
    plt.tight_layout()
    pdf.savefig()
    plt.close()

    # 3. Nuage de points : Débit horaire vs Taux d'occupation
    plt.figure(figsize=(8, 5))
    sns.scatterplot(x='Debit_Horaire', y="Taux d'occupation", data=df, 
                    hue='Etat trafic', style='Etat trafic', s=100)
    plt.title("Relation entre Débit horaire et Taux d'occupation")
    plt.xlabel("Débit horaire")
    plt.ylabel("Taux d'occupation")
    plt.figtext(0.5, -0.05, "Ce nuage de points illustre la relation entre débit horaire et taux d'occupation,\noutil pour modéliser l'impact du trafic.",
                wrap=True, horizontalalignment='center', fontsize=10)
    plt.tight_layout()
    pdf.savefig()
    plt.close()

    # 4. Comptage par Etat trafic (diagramme en barres)
    plt.figure(figsize=(8, 5))
    sns.countplot(x='Etat trafic', data=df, hue='Etat trafic', palette="viridis", legend=False)
    plt.title("Nombre d'entrées par Etat trafic")
    plt.xlabel("Etat trafic")
    plt.ylabel("Nombre d'entrées")
    plt.figtext(0.5, -0.05, "Ce diagramme montre la fréquence de chaque état de trafic (ex. Fluide, Pré-saturé, Ouvert).",
                wrap=True, horizontalalignment='center', fontsize=10)
    plt.tight_layout()
    pdf.savefig()
    plt.close()

    # 5. Evolution du Débit horaire dans le temps
    plt.figure(figsize=(10, 5))
    df_sorted = df.sort_values(by="Date et heure de comptage")
    sns.lineplot(x='Date et heure de comptage', y='Debit_Horaire', data=df_sorted, marker='o')
    plt.title("Évolution du Débit horaire dans le temps")
    plt.xlabel("Date et heure")
    plt.ylabel("Débit horaire")
    plt.xticks(rotation=45)
    plt.figtext(0.5, -0.05, "Ce graphique temporel met en évidence les tendances et pics de trafic au fil du temps.",
                wrap=True, horizontalalignment='center', fontsize=10)
    plt.tight_layout()
    pdf.savefig()
    plt.close()

    # 6. Carte de corrélation entre variables numériques
    plt.figure(figsize=(8, 6))
    cols = ['Debit_Horaire', "Taux d'occupation", 'distance_arc', 'Emission_CO2']
    corr = df[cols].corr()
    sns.heatmap(corr, annot=True, cmap='coolwarm', vmin=-1, vmax=1)
    plt.title("Carte de corrélation entre variables numériques")
    plt.figtext(0.5, -0.05, "La carte de corrélation évalue les relations entre trafic, distance des arcs et émissions de CO2.",
                wrap=True, horizontalalignment='center', fontsize=10)
    plt.tight_layout()
    pdf.savefig()
    plt.close()

    # 7. Boxplot des émissions de CO2 par Etat trafic
    plt.figure(figsize=(8, 5))
    sns.boxplot(x='Etat trafic', y='Emission_CO2', hue='Etat trafic', data=df, palette="Set2", legend=False)
    plt.title("Répartition des émissions de CO2 selon l'Etat trafic")
    plt.xlabel("Etat trafic")
    plt.ylabel("Emission de CO2")
    plt.figtext(0.5, -0.05, "Ce boxplot compare les émissions de CO2 selon l'état du trafic, utile pour détecter des anomalies.",
                wrap=True, horizontalalignment='center', fontsize=10)
    plt.tight_layout()
    pdf.savefig()
    plt.close()

    # 8. Relation entre distance de l'arc et émissions de CO2
    plt.figure(figsize=(8, 5))
    sns.scatterplot(x='distance_arc', y='Emission_CO2', data=df, hue='Etat trafic', style='Etat trafic', s=100)
    plt.title("Distance de l'arc vs Emission de CO2")
    plt.xlabel("Distance de l'arc (km)")
    plt.ylabel("Emission de CO2")
    plt.figtext(0.5, -0.05, "Ce graphique explore la relation entre la longueur d'un arc et ses émissions de CO2,\npermettant d'identifier des itinéraires plus écologiques.",
                wrap=True, horizontalalignment='center', fontsize=10)
    plt.tight_layout()
    pdf.savefig()
    plt.close()

    # 9. Moyenne du Débit horaire par Libellé d'arc
    plt.figure(figsize=(10, 5))
    moyennes = df.groupby('Libelle')['Debit_Horaire'].mean().sort_values(ascending=False)
    sns.barplot(x=moyennes.index, y=moyennes.values, palette="magma")
    plt.title("Moyenne du Débit horaire par arc")
    plt.xlabel("Libellé de l'arc")
    plt.ylabel("Débit horaire moyen")
    plt.xticks(rotation=45, ha='right')
    plt.figtext(0.5, -0.05, "Ce graphique compare la moyenne du débit horaire par arc, identifiant les zones à forte circulation.",
                wrap=True, horizontalalignment='center', fontsize=10)
    plt.tight_layout()
    pdf.savefig()
    plt.close()

    # 10. Page de conclusion
    plt.figure(figsize=(11, 8.5))
    plt.axis('off')
    conclusion = (
        "Conclusion du rapport\n\n"
        "L'analyse réalisée à partir des différentes visualisations permet de :\n"
        "- Comprendre la distribution des débits horaires et des taux d'occupation,\n"
        "- Identifier la relation entre débit horaire et densité de trafic,\n"
        "- Évaluer l'impact environnemental via les émissions de CO2,\n"
        "- Comparer la performance des différents arcs pour optimiser le choix des itinéraires.\n\n"
        "Ces éléments serviront de base pour une modélisation approfondie de l'impact du trafic routier à Paris."
    )
    plt.text(0.5, 0.5, conclusion, fontsize=14, ha='center', va='center')
    pdf.savefig()
    plt.close()

print("Le rapport PDF 'rapport_trafic.pdf' a été généré avec succès.")
