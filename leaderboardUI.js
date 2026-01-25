// leaderboardUI.js - Interface du Classement Simplifié

class LeaderboardUI {
  constructor(leaderboardSystem) {
    this.leaderboard = leaderboardSystem;
    this.currentTab = 'global';
    this.selectedLevel = 1;
    this.playerName = this.getPlayerName();
    this.createModal();
    this.setupListeners();
  }

  /**
   * Récupère le nom du joueur
   */
  getPlayerName() {
    return localStorage.getItem('playerName') || 'Joueur';
  }

  /**
   * Crée la modal du classement
   */
  createModal() {
    const modal = document.createElement('div');
    modal.id = 'leaderboardModal';
    modal.className = 'leaderboard-modal';
    modal.innerHTML = `
      <div class="leaderboard-container">
        <div class="leaderboard-header">
          <h1>🏆 Classement</h1>
          <button class="leaderboard-close">✕</button>
        </div>

        <div class="leaderboard-tabs">
          <button class="leaderboard-tab-btn active" data-tab="global">Global</button>
          <button class="leaderboard-tab-btn" data-tab="level">Par Niveau</button>
          <button class="leaderboard-tab-btn" data-tab="personal">Mes Records</button>
        </div>

        <div class="leaderboard-content">
          <div class="leaderboard-tab active" id="global-tab">
            <h2 class="h2">Top 10 Global</h2>
            <table class="leaderboard-table" id="globalTable">
              <thead>
                <tr>
                  <th>Rang</th>
                  <th>Joueur</th>
                  <th>Score</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody id="globalBody"></tbody>
            </table>
          </div>

          <div class="leaderboard-tab" id="level-tab">
            <select id="levelSelect" class="leaderboard-select">
              <option value="1">Niveau 1</option>
              <option value="2">Niveau 2</option>
              <option value="3">Niveau 3</option>
              <option value="4">Niveau 4</option>
            </select>
            <h2 class="h2">Top 10 - Niveau <span id="levelNum">1</span></h2>
            <table class="leaderboard-table" id="levelTable">
              <thead>
                <tr>
                  <th>Rang</th>
                  <th>Joueur</th>
                  <th>Score</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody id="levelBody"></tbody>
            </table>
          </div>

          <div class="leaderboard-tab" id="personal-tab">
            <h2 class="h2">Mes Records - ${this.playerName}</h2>
            <table class="leaderboard-table" id="personalTable">
              <thead>
                <tr>
                  <th>Niveau</th>
                  <th>Score</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody id="personalBody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  /**
   * Configure les événements
   */
  setupListeners() {
    // Fermer
    document.querySelector('.leaderboard-close').addEventListener('click', () => {
      this.close();
    });

    // Onglets
    document.querySelectorAll('.leaderboard-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Changement de niveau
    document.getElementById('levelSelect').addEventListener('change', (e) => {
      this.selectedLevel = parseInt(e.target.value);
      document.getElementById('levelNum').textContent = this.selectedLevel;
      this.updateLevelLeaderboard();
    });
  }

  /**
   * Change d'onglet
   */
  switchTab(tabName) {
    this.currentTab = tabName;

    // Mettre à jour les boutons
    document.querySelectorAll('.leaderboard-tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Mettre à jour le contenu
    document.querySelectorAll('.leaderboard-tab').forEach(el => {
      el.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Actualiser les données
    if (tabName === 'global') {
      this.updateGlobalLeaderboard();
    } else if (tabName === 'level') {
      this.updateLevelLeaderboard();
    } else if (tabName === 'personal') {
      this.updatePersonalRecords();
    }
  }

  /**
   * Met à jour le classement global
   */
  updateGlobalLeaderboard() {
    const scores = this.leaderboard.getGlobalLeaderboard(10);
    const tbody = document.getElementById('globalBody');
    tbody.innerHTML = '';

    if (scores.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="leaderboard-empty">Aucun score</td></tr>';
      return;
    }

    scores.forEach((score, index) => {
      const row = document.createElement('tr');
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1);
      const date = new Date(score.date).toLocaleDateString('fr-FR');
      
      row.innerHTML = `
        <td class="leaderboard-rank">${medal}</td>
        <td>${score.playerName}</td>
        <td>${score.score}</td>
        <td class="muted">${date}</td>
      `;
      tbody.appendChild(row);
    });
  }

  /**
   * Met à jour le classement par niveau
   */
  updateLevelLeaderboard() {
    const scores = this.leaderboard.getLevelLeaderboard(this.selectedLevel, 10);
    const tbody = document.getElementById('levelBody');
    tbody.innerHTML = '';

    if (scores.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="leaderboard-empty">Aucun score pour ce niveau</td></tr>';
      return;
    }

    scores.forEach((score, index) => {
      const row = document.createElement('tr');
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1);
      const date = new Date(score.date).toLocaleDateString('fr-FR');
      
      row.innerHTML = `
        <td class="leaderboard-rank">${medal}</td>
        <td>${score.playerName}</td>
        <td>${score.score}</td>
        <td class="muted">${date}</td>
      `;
      tbody.appendChild(row);
    });
  }

  /**
   * Met à jour les records personnels
   */
  updatePersonalRecords() {
    const records = this.leaderboard.getPersonalRecords(this.playerName);
    const tbody = document.getElementById('personalBody');
    tbody.innerHTML = '';

    if (records.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="leaderboard-empty">Aucun record personnel</td></tr>';
      return;
    }

    records.forEach((record) => {
      const row = document.createElement('tr');
      const date = new Date(record.date).toLocaleDateString('fr-FR');
      
      row.innerHTML = `
        <td>Niveau ${record.levelId}</td>
        <td>${record.score}</td>
        <td class="muted">${date}</td>
      `;
      tbody.appendChild(row);
    });
  }

  /**
   * Ouvre le classement
   */
  open() {
    document.getElementById('leaderboardModal').classList.add('active');
    this.updateGlobalLeaderboard();
  }

  /**
   * Ferme le classement
   */
  close() {
    document.getElementById('leaderboardModal').classList.remove('active');
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LeaderboardUI;
}