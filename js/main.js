// main.js - Initialisation du jeu

// Initialiser le leaderboard IMMÉDIATEMENT (avant DOMContentLoaded)
try {
  window.leaderboard = new LeaderboardSystem();
  window.leaderboardUI = new LeaderboardUI(window.leaderboard);
  console.log('✅ Leaderboard initialisé');
} catch (error) {
  console.error('❌ Erreur leaderboard:', error);
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 Initialisation du jeu...');

  // Bouton classement (navbar)
  const leaderboardBtn = document.getElementById('leaderboardBtn');
  if (leaderboardBtn) {
    leaderboardBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.leaderboardUI) {
        window.leaderboardUI.open();
      } else {
        console.error('leaderboardUI pas initialisé');
      }
    });
  }

  // Bouton dans la page du classement
  const btnOpenLeaderboard = document.getElementById('btnOpenLeaderboard');
  if (btnOpenLeaderboard) {
    btnOpenLeaderboard.addEventListener('click', () => {
      if (window.leaderboardUI) {
        window.leaderboardUI.open();
      }
    });
  }

  console.log('✅ Jeu initialisé !');
});