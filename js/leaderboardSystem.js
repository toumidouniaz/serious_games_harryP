// leaderboardSystem.js - Système de Classement Simplifié

class LeaderboardSystem {
  constructor() {
    this.globalScores = [];      // Classement global
    this.levelScores = {};       // Classement par niveau
    this.personalRecords = {};   // Records personnels
    this.storageKey = 'logicGamesLeaderboard';
    this.loadFromStorage();
  }

  /**
   * Soumet un nouveau score
   * @param {string} playerName - Nom du joueur
   * @param {number} levelId - ID du niveau
   * @param {number} score - Points du score
   * @param {number} time - Temps en secondes (optionnel)
   */
  submitScore(playerName, levelId, score, time = null) {
    const scoreData = {
      id: Date.now(),
      playerName: playerName || 'Anonyme',
      levelId: levelId,
      score: score,
      time: time,
      date: new Date().toISOString()
    };

    // Ajouter au classement global
    this.globalScores.push(scoreData);
    this.globalScores.sort((a, b) => b.score - a.score);
    this.globalScores = this.globalScores.slice(0, 50); // Garder top 50

    // Ajouter au classement par niveau
    if (!this.levelScores[levelId]) {
      this.levelScores[levelId] = [];
    }
    this.levelScores[levelId].push(scoreData);
    this.levelScores[levelId].sort((a, b) => b.score - a.score);
    this.levelScores[levelId] = this.levelScores[levelId].slice(0, 50);

    // Mettre à jour record personnel
    this.updatePersonalRecord(playerName, levelId, scoreData);

    this.saveToStorage();
    return scoreData;
  }

  /**
   * Met à jour le record personnel du joueur
   */
  updatePersonalRecord(playerName, levelId, scoreData) {
    const key = `${playerName}_${levelId}`;
    
    if (!this.personalRecords[key]) {
      this.personalRecords[key] = scoreData;
    } else if (scoreData.score > this.personalRecords[key].score) {
      this.personalRecords[key] = scoreData;
    }
  }

  /**
   * Obtient le classement global (top N)
   */
  getGlobalLeaderboard(limit = 10) {
    return this.globalScores.slice(0, limit);
  }

  /**
   * Obtient le classement pour un niveau spécifique
   */
  getLevelLeaderboard(levelId, limit = 10) {
    if (!this.levelScores[levelId]) return [];
    return this.levelScores[levelId].slice(0, limit);
  }

  /**
   * Obtient tous les records personnels d'un joueur
   */
  getPersonalRecords(playerName) {
    return Object.values(this.personalRecords)
      .filter(record => record.playerName === playerName)
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Obtient le record personnel pour un niveau
   */
  getPersonalRecord(playerName, levelId) {
    const key = `${playerName}_${levelId}`;
    return this.personalRecords[key] || null;
  }

  /**
   * Sauvegarde dans localStorage
   */
  saveToStorage() {
    try {
      const data = {
        globalScores: this.globalScores,
        levelScores: this.levelScores,
        personalRecords: this.personalRecords
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    }
  }

  /**
   * Charge depuis localStorage
   */
  loadFromStorage() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        this.globalScores = parsed.globalScores || [];
        this.levelScores = parsed.levelScores || {};
        this.personalRecords = parsed.personalRecords || {};
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
    }
  }

  /**
   * Réinitialise complètement
   */
  reset() {
    this.globalScores = [];
    this.levelScores = {};
    this.personalRecords = {};
    this.saveToStorage();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LeaderboardSystem;
}