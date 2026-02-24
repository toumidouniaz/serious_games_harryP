# 🪄 Hogwarts Logic Academy

Un jeu éducatif de circuits logiques sur le thème de Harry Potter avec mode multijoueur collaboratif en temps réel.

---

## 📋 Table des matières

- [🚀 Démarrage rapide](#-démarrage-rapide)
- [🎮 Fonctionnalités](#-fonctionnalités)
- [📊 État d'avancement](#-état-davancement)
- [🏗️ Architecture technique](#️-architecture-technique)
- [🔧 Configuration](#-configuration)
- [🐛 Dépannage](#-dépannage)

---

## 🚀 Démarrage rapide

### Mode Solo

1. **Ouvrez simplement le fichier dans votre navigateur :**
   ```
   Ouvrez index.html dans Chrome, Firefox, Edge, etc.
   ```

2. **Jouez :**
   - Cliquez sur un niveau déverrouillé
   - Placez des portes logiques (AND, OR, NOT, XOR)
   - Connectez-les avec des fils
   - Cliquez sur "Cast Spell" pour vérifier votre circuit

### Mode Multijoueur

1. **Démarrez le serveur Socket.IO :**

   **Windows :**
   ```bash
   start-server.bat
   ```

   **Mac/Linux :**
   ```bash
   chmod +x start-server.sh
   ./start-server.sh
   ```

   **Ou manuellement :**
   ```bash
   npm install
   npm start
   ```

2. **Ouvrez le jeu :**
   - Ouvrez `index.html` dans votre navigateur
   - Cliquez sur "🎮 Multijoueur"

3. **Créez ou rejoignez une salle :**
   - **Hôte** : Cliquez sur "Créer une salle" → Notez le code de salle
   - **Joueurs** : Entrez le code de salle → Cliquez sur "Rejoindre"

4. **Jouez ensemble :**
   - Tous les joueurs cliquent sur "Prêt"
   - L'hôte clique sur "Démarrer la partie"
   - Collaborez pour résoudre le puzzle !

---

## 🎮 Fonctionnalités

### ✅ Fonctionnalités implémentées

#### Mode Solo
- ✅ **12 niveaux progressifs** avec difficulté croissante
- ✅ **4 types de portes logiques** : AND, OR, NOT, XOR
- ✅ **Système de fils interactifs** avec animation et validation
- ✅ **Système de progression** : déblocage de niveaux
- ✅ **15 achievements** déblocables
- ✅ **Leaderboard** avec classement des joueurs
- ✅ **Sauvegarde de circuits** personnalisés
- ✅ **Authentification Supabase** (optionnelle)
- ✅ **Profil utilisateur** avec statistiques

#### Mode Multijoueur (Collaboratif)
- ✅ **Salles de jeu** : jusqu'à 4 joueurs par salle
- ✅ **Synchronisation en temps réel** :
  - Placement de portes synchronisé
  - Connexion de fils synchronisée
  - Déplacement de portes synchronisé
  - Suppression d'éléments synchronisée
- ✅ **Curseurs des joueurs** visibles en temps réel
- ✅ **Chat en direct** entre joueurs
- ✅ **Écran de victoire collaboratif** avec :
  - Temps total de l'équipe
  - Nombre de portes placées (total)
  - Nombre de fils connectés (total)
  - **Contributions individuelles** de chaque joueur
- ✅ **Chronomètre d'équipe** précis
- ✅ **Système de lobby** avec statut "Prêt"

### 🎯 Détails des fonctionnalités multijoueur

#### Synchronisation
- Toutes les actions sont synchronisées instantanément entre les joueurs
- Les portes INPUT/OUTPUT ne sont pas comptées dans les contributions
- Seules les portes logiques (AND, OR, NOT, XOR) sont comptées
- Les fils sont synchronisés avec leurs connexions

#### Écran de victoire
- S'affiche **simultanément** pour tous les joueurs (délai de 500ms)
- Affiche les statistiques d'équipe :
  - ⏱️ Temps total
  - ⚡ Portes placées (total)
  - 🔗 Fils connectés (total)
  - 👥 Nombre de joueurs
- Affiche les contributions individuelles :
  - Nom du joueur
  - Nombre de portes placées
  - Nombre de fils connectés

---

## 📊 État d'avancement

### ✅ Complété (100%)

| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Système de portes logiques | ✅ | AND, OR, NOT, XOR |
| Système de fils | ✅ | Validation, animation, connexions |
| Calculateur de circuit | ✅ | Évaluation logique correcte |
| 12 niveaux | ✅ | Difficulté progressive |
| Progression | ✅ | Sauvegarde localStorage |
| Achievements | ✅ | 15 achievements déblocables |
| Leaderboard | ✅ | Classement avec Supabase |
| Authentification | ✅ | Supabase (optionnelle) |
| Sauvegarde de circuits | ✅ | localStorage + Supabase |
| Profil utilisateur | ✅ | Statistiques et progression |
| **Mode Multijoueur** | ✅ | **Entièrement fonctionnel** |
| Synchronisation temps réel | ✅ | Socket.IO |
| Chat multijoueur | ✅ | Messages en temps réel |
| Curseurs des joueurs | ✅ | Position en temps réel |
| Écran de victoire collaboratif | ✅ | Avec contributions individuelles |
| Tracking des contributions | ✅ | Portes et fils par joueur |

### 🎉 Résumé

**Le projet est complet et entièrement fonctionnel !**

Toutes les fonctionnalités principales sont implémentées et testées :
- ✅ Mode solo avec 12 niveaux
- ✅ Mode multijoueur collaboratif (jusqu'à 4 joueurs)
- ✅ Synchronisation en temps réel
- ✅ Système de progression et achievements
- ✅ Authentification et sauvegarde cloud

---

## 🏗️ Architecture technique

### Technologies utilisées

- **Frontend** : HTML5, CSS3, JavaScript (Vanilla)
- **Backend** : Node.js + Express
- **Temps réel** : Socket.IO
- **Base de données** : Supabase (PostgreSQL)
- **Authentification** : Supabase Auth

### Structure du projet

```
seriousgames/
├── index.html              # Point d'entrée
├── css/
│   ├── style.css          # Styles principaux
│   ├── multiplayer.css    # Styles multijoueur
│   ├── circuitStorage.css # Styles sauvegarde
│   └── UserProfile.css    # Styles profil
├── js/
│   ├── app.js             # Contrôleur principal
│   ├── gateSystem.js      # Système de portes
│   ├── wireSystem.js      # Système de fils
│   ├── wireRenderer.js    # Rendu des fils
│   ├── wireValidator.js   # Validation des fils
│   ├── circuitCalculator.js # Calcul logique
│   ├── multiplayerClient.js # Client Socket.IO
│   ├── multiplayerSync.js   # Synchronisation
│   ├── multiplayerUI.js     # Interface multijoueur
│   ├── leaderboardSystem.js # Système de classement
│   ├── leaderboardUI.js     # Interface classement
│   ├── circuitStorage.js    # Sauvegarde circuits
│   ├── supabaseClient.js    # Client Supabase
│   ├── databaseService.js   # Service DB
│   ├── authUI.js            # Interface auth
│   ├── UserProfile.js       # Profil utilisateur
│   ├── migration.js         # Migration données
│   └── main.js              # Initialisation
├── server/
│   └── index.js           # Serveur Socket.IO
├── package.json           # Dépendances Node.js
├── start-server.bat       # Script Windows
└── start-server.sh        # Script Mac/Linux
```

### Flux de données multijoueur

```
Client 1                    Serveur Socket.IO              Client 2
   |                              |                            |
   |-- syncAddGate() ------------>|                            |
   |                              |-- gate-added ------------->|
   |                              |                            |
   |                              |<-- syncAddGate() ----------|
   |<-- gate-added ---------------|                            |
   |                              |                            |
   |-- levelCompleted() --------->|                            |
   |                              |-- player-completed-level ->|
   |                              |                            |
   |-- showVictory (500ms) -------|-- showVictory (500ms) -----|
```

---

## 🔧 Configuration

### Configuration Supabase (optionnelle)

Le jeu fonctionne sans Supabase (sauvegarde locale uniquement).

Pour activer Supabase :

1. **Créez un projet sur** [supabase.com](https://supabase.com)

2. **Configurez `js/supabaseClient.js` :**
   ```javascript
   const SUPABASE_URL = 'https://votre-projet.supabase.co';
   const SUPABASE_ANON_KEY = 'votre-clé-anonyme';
   ```

3. **Désactivez la confirmation d'email (développement) :**
   - Dashboard Supabase → Authentication → Providers → Email
   - Désactiver "Confirm email"

4. **Créez les tables** (voir `js/databaseService.js` pour le schéma)

### Configuration du serveur multijoueur

Le serveur écoute sur le port **3001** par défaut.

Pour changer le port, modifiez `server/index.js` :
```javascript
const PORT = process.env.PORT || 3001;
```

---

## 🐛 Dépannage

### Le mode multijoueur ne fonctionne pas

1. **Vérifiez que le serveur est démarré :**
   ```bash
   npm start
   ```
   Vous devriez voir : `✅ Serveur Socket.IO démarré sur le port 3001`

2. **Vérifiez que le port 3001 est libre :**
   ```bash
   # Windows
   netstat -ano | findstr :3001

   # Mac/Linux
   lsof -i :3001
   ```

3. **Rechargez la page avec Ctrl+F5** pour vider le cache

### Les portes/fils ne se synchronisent pas

1. **Ouvrez la console (F12)** et vérifiez les logs :
   - `📤 Synchronisation ajout de porte` (envoi)
   - `📥 Porte ajoutée par [username]` (réception)

2. **Vérifiez que le mode multijoueur est activé :**
   ```javascript
   // Dans la console
   window.multiplayerSync.isMultiplayerMode  // doit être true
   window.multiplayerSync.syncEnabled        // doit être true
   ```

### Les contributions sont incorrectes

Les portes INPUT et OUTPUT ne sont **pas comptées** dans les contributions.
Seules les portes logiques (AND, OR, NOT, XOR) sont comptées.

---

## 👥 Crédits

Développé dans le cadre d'un projet de Serious Game.

**Technologies :**
- Socket.IO pour le temps réel
- Supabase pour la base de données
- Canvas API pour le rendu

---

## 📝 Licence

Projet éducatif - Tous droits réservés

---

**Amusez-vous bien ! ✨🪄**