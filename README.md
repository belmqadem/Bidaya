# Bidaya

Carnet de santé numérique de l'enfant, vérifié par la clinique — avec communication post-vaccination entre parent, médecin et pharmacie.

## Le problème

Au Maroc, le suivi médical des enfants repose encore largement sur des carnets de santé papier. Ces documents se perdent, s'abîment, et ne sont pas accessibles à distance. Les parents n'ont aucun moyen simple de consulter l'historique vaccinal de leur enfant. En cas d'effets secondaires après une vaccination, le parent doit se déplacer physiquement à la clinique, et la communication entre médecin et pharmacie se fait par des ordonnances papier facilement falsifiables ou réutilisables.

## Notre solution

Une application web qui numérise le carnet de santé de l'enfant et met en place un circuit de communication sécurisé entre trois acteurs : **le parent**, **la clinique** et **la pharmacie**. Chaque dossier est créé et vérifié par la clinique, puis accessible au parent via un identifiant unique.

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

### 4. Communication post-vaccination

C'est le cœur de l'innovation de Bidaya. Quand un enfant présente des effets secondaires après une vaccination :

1. **Le parent signale** les symptômes depuis l'application (description, sévérité, vaccination concernée)
   - Il peut dicter les symptômes grâce à la **saisie vocale** (transcription automatique via ElevenLabs)
   - Il peut joindre une **photo** pour illustrer les symptômes (JPG, PNG, WebP — max 5 Mo)
2. **Le médecin reçoit** le signalement dans son tableau de bord, consulte les détails, la photo jointe et **répond au parent** via un fil de messages
3. **Le médecin crée une ordonnance numérique** avec un code unique (format ORD-XXXX-XXXX)
4. **Le parent** voit l'ordonnance et le code directement dans l'application, et le communique à sa pharmacie
5. **La pharmacie** entre le code, vérifie l'ordonnance, dispense les médicaments et **marque l'ordonnance comme utilisée**

Ce circuit empêche la réutilisation frauduleuse des ordonnances : une fois dispensée, l'ordonnance est verrouillée et ne peut plus être utilisée dans une autre pharmacie.

### 5. Analyse IA du risque néonatal

Un outil d'intelligence artificielle intégré permet d'estimer le risque néonatal à partir des données maternelles :
- Durée de gestation, parité, âge maternel
- Taille et poids de la mère, tabagisme

Le modèle prédit le poids de naissance estimé et classe le risque en trois niveaux : **faible**, **modéré** ou **élevé**.

## Les 3 espaces

| Espace | Accès | Fonctionnalités principales |
|--------|-------|----------------------------|
| **Parent** | Identifiant enfant + téléphone + OTP | Consulter le carnet, signaler des effets (voix + photo), voir les ordonnances, communiquer avec le médecin |
| **Clinique** | Email | Créer des dossiers, gérer vaccinations/consultations, répondre aux signalements, émettre des ordonnances |
| **Pharmacie** | Email | Rechercher une ordonnance par code, vérifier les détails, marquer comme dispensée |

## Stack technique

- **Frontend** : Next.js, React, Tailwind CSS, shadcn/ui
- **Backend** : Next.js API Routes, Server Actions
- **Base de données** : PostgreSQL (Neon) + Prisma ORM
- **IA** : MiniMax M2.5 (API LLM) pour la prédiction néonatale
- **Voix** : ElevenLabs Speech-to-Text pour la saisie vocale des symptômes
- **ML** : Python (pandas, scikit-learn) pour l'analyse exploratoire des données

## Lancer le projet

```bash
# Installer les dépendances
npm install

# Configurer les variables d'environnement
# Créer un fichier .env avec DATABASE_URL, MINIMAX_API_KEY et ELEVENLABS_API_KEY

# Initialiser la base de données
npm run db:push

# Lancer le serveur de développement
npm run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).
