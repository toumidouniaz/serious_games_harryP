// main.js - Game Initialization with Auth

// ============================================
// INITIALIZE USER SESSION
// ============================================
async function initializeUserSession() {
  try {
    const { data: { session } } = await window.sb.auth.getSession();

    if (session?.user) {
      window.currentUserId = session.user.id;
      console.log('✅ User session loaded:', session.user.email);

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
// AUTH STATE LISTENER
// ============================================
if (window.sb) {
  window.sb.auth.onAuthStateChange(async (event, session) => {
    console.log('🔄 Auth state changed:', event);

    if (event === 'SIGNED_IN' && session?.user) {
      window.currentUserId = session.user.id;
      console.log('✅ User signed in:', session.user.email);

      // Migrate local data if needed
      if (window.migrateLocalProgressIfNeeded) {
        await window.migrateLocalProgressIfNeeded(session.user.id);
      }
    } else if (event === 'SIGNED_OUT') {
      window.currentUserId = null;
      console.log('ℹ️ User signed out');
    }
  });
}

// ============================================
// DOM READY INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎮 Initializing game...');

  // Initialize user session first
  await initializeUserSession();

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