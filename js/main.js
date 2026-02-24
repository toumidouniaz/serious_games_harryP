// main.js - Game Initialization with Auth

// ============================================
// SYNC DB PROGRESS → LOCALSTORAGE
// ============================================
async function syncProgressFromDB(userId) {
  if (!window.DatabaseService) return;
  try {
    const dbProgress = await window.DatabaseService.getProgress(userId);
    const dbUnlocked = dbProgress.unlocked_level || 1;
    const dbCompleted = Array.isArray(dbProgress.completed_levels) ? dbProgress.completed_levels : [];

    const localProgress = loadProgress();

    // Fusionner : garder la progression la plus avancée
    const mergedUnlocked = Math.max(dbUnlocked, localProgress.unlockedLevel);
    const mergedCompleted = [...new Set([...dbCompleted.map(Number), ...localProgress.completedLevels])]
      .filter(n => Number.isFinite(n) && n >= 1)
      .sort((a, b) => a - b);

    saveProgress({ unlockedLevel: mergedUnlocked, completedLevels: mergedCompleted });
    console.log('✅ Progression synchronisée depuis la DB:', { mergedUnlocked, mergedCompleted });
  } catch (error) {
    console.warn('⚠️ Échec de la sync depuis la DB:', error);
  }
}

// ============================================
// INITIALIZE USER SESSION
// ============================================
async function initializeUserSession() {
  try {
    const { data: { session } } = await window.sb.auth.getSession();

    if (session?.user) {
      window.currentUserId = session.user.id;
      console.log('✅ User session loaded:', session.user.email);

      // Charger la progression depuis la DB vers le localStorage
      await syncProgressFromDB(session.user.id);

      // Migrate local progress to database if needed
      if (window.migrateLocalProgressIfNeeded) {
        await window.migrateLocalProgressIfNeeded(session.user.id);
      }
    } else {
      window.currentUserId = null;
      console.log('ℹ️ No user session - using local storage');
    }
  } catch (error) {
    console.error('❌ Error loading session:', error);
    window.currentUserId = null;
  }
}

// ============================================
// LEADERBOARD INITIALIZATION
// ============================================
try {
  window.leaderboard = new LeaderboardSystem();
  window.leaderboardUI = new LeaderboardUI(window.leaderboard);
  console.log('✅ Leaderboard initialized');
} catch (error) {
  console.error('❌ Leaderboard error:', error);
}

// ============================================
// MULTIPLAYER INITIALIZATION
// ============================================
try {
  // Vérifier que multiplayerUI est bien chargé
  if (!window.multiplayerUI) {
    console.log('⚠️ multiplayerUI not loaded yet, creating instance...');
    window.multiplayerUI = new MultiplayerUI();
  }
  console.log('✅ Multiplayer UI initialized:', window.multiplayerUI);
} catch (error) {
  console.error('❌ Multiplayer UI error:', error);
}

// ============================================
// AUTH STATE LISTENER (Single listener to avoid conflicts)
// ============================================
let authStateListenerInitialized = false;

if (window.sb && !authStateListenerInitialized) {
  authStateListenerInitialized = true;
  
  window.sb.auth.onAuthStateChange(async (event, session) => {
    console.log('🔄 Auth state changed:', event);

    if (event === 'SIGNED_IN' && session?.user) {
      window.currentUserId = session.user.id;
      console.log('✅ User signed in:', session.user.email);

      // Charger la progression depuis la DB et mettre à jour l'affichage
      await syncProgressFromDB(session.user.id);
      
      // Migrate local data if needed
      if (window.migrateLocalProgressIfNeeded) {
        await window.migrateLocalProgressIfNeeded(session.user.id);
      }
      
      // Re-render UI
      if (typeof render === 'function') render();
      
    } else if (event === 'SIGNED_OUT') {
      window.currentUserId = null;
      console.log('ℹ️ User signed out');
      
      // Disconnect from multiplayer if in a room
      if (window.multiplayerClient && window.multiplayerClient.isInRoom()) {
        console.log('🔌 Disconnecting from multiplayer due to logout');
        window.multiplayerClient.leaveRoom();
        window.multiplayerClient.disconnect();
      }
      
      // Re-render UI
      if (typeof render === 'function') render();
    }
  });
}

// ============================================
// DOM READY INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎮 Initializing game...');

  // Initialize user session first (charge et sync la progression depuis la DB)
  await initializeUserSession();

  // Re-render maintenant que la session et la progression sont prêtes
  if (typeof render === 'function') render();

  // Leaderboard button (navbar)
  const leaderboardBtn = document.getElementById('leaderboardBtn');
  if (leaderboardBtn) {
    leaderboardBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.leaderboardUI) {
        window.leaderboardUI.open();
      } else {
        console.error('leaderboardUI not initialized');
      }
    });
  }

  // Leaderboard button (page)
  const btnOpenLeaderboard = document.getElementById('btnOpenLeaderboard');
  if (btnOpenLeaderboard) {
    btnOpenLeaderboard.addEventListener('click', () => {
      if (window.leaderboardUI) {
        window.leaderboardUI.open();
      }
    });
  }

  console.log('✅ Game initialized!');
  console.log('Current user ID:', window.currentUserId || 'Not logged in');
});
