# Carnet de Santé Numérique

Dossier de santé numérique de l'enfant, vérifié par la clinique.

## Le problème

Au Maroc, le suivi médical des enfants repose encore largement sur des carnets de santé papier. Ces documents se perdent, s'abîment, et ne sont pas accessibles à distance. Les parents n'ont aucun moyen simple de consulter l'historique vaccinal ou les consultations de leur enfant.

## Notre solution

Une application web qui numérise le carnet de santé de l'enfant. Chaque dossier est créé et vérifié par la clinique, puis accessible au parent via un identifiant unique.

## Comment ça marche

### 1. Le personnel clinique crée un dossier

Lors de la naissance, la clinique enregistre le nouveau-né dans l'application :
- Informations de l'enfant (nom, date de naissance, poids, taille, etc.)
- Informations du parent (nom, téléphone)

Un **identifiant unique** est généré automatiquement et remis au parent.

### 2. Le parent accède au carnet

Le parent se connecte avec :
- L'identifiant unique de l'enfant
- Son numéro de téléphone
- Un code de vérification (OTP)

Il peut alors consulter :
- Le profil complet de son enfant
- Le calendrier vaccinal marocain
- L'historique des vaccinations et consultations
- La chronologie médicale complète

### 3. La clinique gère le suivi médical

Le personnel clinique peut rechercher un enfant par identifiant et :
- Ajouter des vaccinations (nom, dose, date, clinique, lot, site d'injection)
- Ajouter des consultations (motif, diagnostic, traitement, suivi)
- Suivre le calendrier vaccinal officiel marocain
- Marquer les vaccins comme administrés

### 4. Analyse IA du risque néonatal

Un outil d'intelligence artificielle intégré permet d'estimer le risque néonatal à partir des données maternelles :
- Durée de gestation, parité, âge maternel
- Taille et poids de la mère, tabagisme

Le modèle prédit le poids de naissance estimé et classe le risque en trois niveaux : **faible**, **modéré** ou **élevé**. Cet outil aide le personnel clinique dans sa prise de décision, sans remplacer le jugement médical.

## Stack technique

- **Frontend** : Next.js, React, Tailwind CSS, shadcn/ui
- **Backend** : Next.js API Routes, Server Actions
- **Base de données** : PostgreSQL (Neon) + Prisma ORM
- **IA** : MiniMax M2.5 (API LLM) pour la prédiction néonatale
- **ML** : Python (pandas, scikit-learn) pour l'analyse exploratoire des données

## Lancer le projet

```bash
# Installer les dépendances
npm install

# Configurer les variables d'environnement
# Créer un fichier .env avec DATABASE_URL et MINIMAX_API_KEY

# Initialiser la base de données
npm run db:push

# Lancer le serveur de développement
npm run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).
