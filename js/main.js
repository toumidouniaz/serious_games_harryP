// main.js - Initialisation du jeu

// ================================
// 0) SUPABASE AUTH STATE (Phase 2)
// ================================
// Prérequis : index.html charge supabase-js + supabaseClient.js + migration.js
window.currentUserId = null;

async function initSupabaseSession() {
  if (!window.sb) {
    console.warn("⚠️ Supabase client (window.sb) non trouvé. Auth désactivée.");
    return;
  }

  try {
    // 1) Charger la session au démarrage
    const { data: sessionData, error: sessionError } = await window.sb.auth.getSession();
    if (sessionError) console.warn("⚠️ getSession error:", sessionError);

    const user = sessionData?.session?.user || null;
    window.currentUserId = user?.id || null;

    if (window.currentUserId) {
      console.log("👤 User connecté:", window.currentUserId);
      if (typeof window.migrateLocalProgressIfNeeded === "function") {
        await window.migrateLocalProgressIfNeeded(window.currentUserId);
        console.log("✅ Migration progression (si nécessaire) terminée");
      }
    } else {
      console.log("👤 Aucun user connecté (mode localStorage)");
    }

    // 2) Écouter les changements de session (login/logout)
    window.sb.auth.onAuthStateChange(async (_event, session) => {
      window.currentUserId = session?.user?.id || null;

      if (window.currentUserId) {
        console.log("👤 Session update: connecté", window.currentUserId);
        if (typeof window.migrateLocalProgressIfNeeded === "function") {
          await window.migrateLocalProgressIfNeeded(window.currentUserId);
          console.log("✅ Migration progression (si nécessaire) terminée");
        }
      } else {
        console.log("👤 Session update: déconnecté (mode localStorage)");
      }
    });
  } catch (err) {
    console.error("❌ Erreur initSupabaseSession:", err);
  }
}

// Lancer l'init Supabase dès que possible
// (avant DOMContentLoaded, pour que currentUserId soit prêt)
initSupabaseSession();


// ===============================================
// 1) LEADERBOARD INIT (Phase 1/2, déjà existant)
// ===============================================

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
