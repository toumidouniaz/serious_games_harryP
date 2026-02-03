// ============================================
// userProfile.js - User Profile Management
// ============================================

window.UserProfile = {
    /**
     * Initialize profile UI
     */
    init() {
        console.log('Initializing UserProfile...');
        this.renderProfileButton();
        this.setupAuthListener();
    },

    /**
     * Setup auth state listener
     */
    setupAuthListener() {
        if (!window.sb) {
            console.warn('Supabase client not available');
            return;
        }

        window.sb.auth.onAuthStateChange((event, session) => {
            console.log('UserProfile: Auth state changed:', event);
            // Small delay to ensure currentUserId is set
            setTimeout(() => {
                this.renderProfileButton();
            }, 100);
        });
    },

    /**
     * Render profile button in navbar
     */
    renderProfileButton() {
        const authButtons = document.getElementById('authButtons');
        if (!authButtons) {
            console.warn('authButtons element not found');
            return;
        }

        const userId = window.currentUserId;
        console.log('Rendering profile button, userId:', userId);

        if (userId) {
            // User is logged in - show profile icon
            const existingProfile = document.getElementById('profileBtn');
            if (!existingProfile) {
                const profileBtn = document.createElement('button');
                profileBtn.id = 'profileBtn';
                profileBtn.className = 'btn';
                profileBtn.textContent = 'Profile';
                profileBtn.style.cssText = 'font-size: 14px; margin-left: 8px;';
                profileBtn.onclick = () => this.showProfileModal();

                authButtons.appendChild(profileBtn);
                console.log('Profile button added');
            }
        } else {
            // User logged out - remove profile button
            const existingProfile = document.getElementById('profileBtn');
            if (existingProfile) {
                existingProfile.remove();
                console.log('Profile button removed');
            }
        }
    },

    /**
     * Get user email
     */
    async getUserEmail() {
        try {
            const { data: { user } } = await window.sb.auth.getUser();
            return user?.email || 'Unknown';
        } catch {
            return 'Unknown';
        }
    },

    /**
     * Get user stats
     */
    async getUserStats() {
        const userId = window.currentUserId;
        if (!userId) return null;

        try {
            // Get progress
            const progress = await loadProgress();

            // Get achievements
            const achStats = achievementManager.getStats();

            // Get saved circuits count - count ALL circuits for logged in users
            const circuits = await window.circuitStorage.getAllCircuits();
            // When logged in, getAllCircuits returns both DB and localStorage circuits
            // Count them all since they're all the user's circuits

            return {
                completedLevels: progress.completedLevels.length,
                unlockedLevel: progress.unlockedLevel,
                totalLevels: APP_LEVELS.length,
                achievements: achStats.unlocked,
                totalAchievements: achStats.total,
                savedCircuits: circuits.length  // Count all circuits
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            return null;
        }
    },

    /**
     * Show profile modal
     */
    async showProfileModal() {
        const email = await this.getUserEmail();
        const stats = await this.getUserStats();

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'profileModal';

        modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px;">
        <div style="text-align: center; padding: 20px 0;">
          <div style="font-size: 4em; margin-bottom: 16px;">👤</div>
          <h2 class="h2">Wizard Profile</h2>
          <p class="muted">${email}</p>
        </div>

        ${stats ? `
          <div class="profile-stats">
            <h3 style="margin: 16px 0 12px; color: var(--accent);">Your Progress</h3>
            
            <div class="stat-grid">
              <div class="stat-card">
                <div class="stat-icon">📖</div>
                <div class="stat-value">${stats.completedLevels}/${stats.totalLevels}</div>
                <div class="stat-label">Levels Completed</div>
              </div>

              <div class="stat-card">
                <div class="stat-icon">🎯</div>
                <div class="stat-value">${stats.unlockedLevel}</div>
                <div class="stat-label">Current Level</div>
              </div>

              <div class="stat-card">
                <div class="stat-icon">🏆</div>
                <div class="stat-value">${stats.achievements}/${stats.totalAchievements}</div>
                <div class="stat-label">Achievements</div>
              </div>

              <div class="stat-card">
                <div class="stat-icon">💾</div>
                <div class="stat-value">${stats.savedCircuits}</div>
                <div class="stat-label">Saved Circuits</div>
              </div>
            </div>
          </div>
        ` : `
          <div class="overlay" style="margin: 16px 0;">
            <p class="muted">Loading stats...</p>
          </div>
        `}

        <div style="margin-top: 20px;">
          <h3 style="margin: 16px 0 12px; color: var(--accent);">Quick Actions</h3>
          <div class="toolbar" style="flex-direction: column; gap: 8px;">
            <button class="btn" id="btnViewAchievements" style="width: 100%;">
              View Achievements
            </button>
            <button class="btn" id="btnViewCircuits" style="width: 100%;">
              My Circuits
            </button>
            <button class="btn" id="btnViewLeaderboard" style="width: 100%;">
              Leaderboard
            </button>
          </div>
        </div>

        <div style="margin-top: 20px;">
          <h3 style="margin: 16px 0 12px; color: var(--accent);">Account Settings</h3>
          <div class="toolbar" style="flex-direction: column; gap: 8px;">
            <button class="btn" id="btnChangePassword" style="width: 100%;">
              Change Password
            </button>
            <button class="btn danger" id="btnLogoutFromProfile" style="width: 100%;">
              Logout
            </button>
          </div>
        </div>

        <div class="toolbar" style="margin-top: 24px;">
          <button class="btn primary" id="btnCloseProfile" style="width: 100%;">
            Close
          </button>
        </div>
      </div>
    `;

        document.body.appendChild(modal);

        // Event listeners
        document.getElementById('btnCloseProfile').onclick = () => modal.remove();

        document.getElementById('btnViewAchievements').onclick = () => {
            modal.remove();
            achievementManager.renderPage();
        };

        document.getElementById('btnViewCircuits').onclick = () => {
            modal.remove();
            window.circuitStorageUI.showCircuitLibrary();
        };

        document.getElementById('btnViewLeaderboard').onclick = () => {
            modal.remove();
            if (window.leaderboardUI) {
                window.leaderboardUI.open();
            }
        };

        document.getElementById('btnChangePassword').onclick = () => {
            modal.remove();
            this.showChangePasswordModal();
        };

        document.getElementById('btnLogoutFromProfile').onclick = async () => {
            modal.remove();
            if (window.AuthUI) {
                await window.AuthUI.handleLogout();
            }
        };

        // Close on overlay click
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        };
    },

    /**
     * Show change password modal
     */
    showChangePasswordModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'changePasswordModal';

        modal.innerHTML = `
      <div class="modal-content" style="max-width: 400px;">
        <h2 class="h2">Change Password</h2>
        <p class="muted">Enter your new password below</p>

        <form id="changePasswordForm" style="margin-top: 16px;">
          <div style="margin-bottom: 12px;">
            <label style="display: block; margin-bottom: 6px; color: var(--text);">
              New Password <span style="color: var(--danger);">*</span>
            </label>
            <input 
              type="password" 
              id="newPassword" 
              class="input-field" 
              placeholder="Min. 6 characters"
              minlength="6"
              required
            />
          </div>

          <div style="margin-bottom: 12px;">
            <label style="display: block; margin-bottom: 6px; color: var(--text);">
              Confirm Password <span style="color: var(--danger);">*</span>
            </label>
            <input 
              type="password" 
              id="confirmPassword" 
              class="input-field" 
              placeholder="Repeat password"
              minlength="6"
              required
            />
          </div>

          <div id="changePasswordError" style="margin: 12px 0;"></div>

          <div class="toolbar">
            <button type="button" class="btn" id="btnCancelChangePassword">Cancel</button>
            <button type="submit" class="btn primary">Update Password</button>
          </div>
        </form>
      </div>
    `;

        document.body.appendChild(modal);

        document.getElementById('btnCancelChangePassword').onclick = () => modal.remove();

        document.getElementById('changePasswordForm').onsubmit = async (e) => {
            e.preventDefault();
            await this.handleChangePassword(modal);
        };

        document.getElementById('newPassword').focus();
    },

    /**
     * Handle password change
     */
    async handleChangePassword(modal) {
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorDiv = document.getElementById('changePasswordError');

        if (!newPassword || !confirmPassword) {
            errorDiv.innerHTML = '<div class="overlay error">Please fill in all fields</div>';
            return;
        }

        if (newPassword !== confirmPassword) {
            errorDiv.innerHTML = '<div class="overlay error">Passwords do not match</div>';
            return;
        }

        if (newPassword.length < 6) {
            errorDiv.innerHTML = '<div class="overlay error">Password must be at least 6 characters</div>';
            return;
        }

        try {
            const { error } = await window.sb.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            errorDiv.innerHTML = '<div class="overlay success">Password updated successfully!</div>';

            setTimeout(() => {
                modal.remove();
                this.showNotification('Password changed successfully!', 'success');
            }, 1500);

        } catch (error) {
            console.error('Change password error:', error);
            errorDiv.innerHTML = `<div class="overlay error">${error.message}</div>`;
        }
    },

    /**
     * Show toast notification
     */
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      padding: 16px 24px;
      background: ${type === 'success' ? 'var(--ok)' : 'var(--danger)'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM ready, initializing UserProfile');
        window.UserProfile.init();
    });
} else {
    console.log('DOM already ready, initializing UserProfile');
    window.UserProfile.init();
}