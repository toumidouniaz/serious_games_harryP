// ============================================
// authUI.js - Authentication UI Handler
// ============================================

window.AuthUI = {
  /**
   * Initialize auth UI - called from main.js
   */
  init() {
    this.renderAuthButtons();
    this.setupAuthListeners();
  },

  /**
   * Render login/logout buttons in the navbar
   */
  renderAuthButtons() {
    const container = document.getElementById('authButtons');
    if (!container) return;

    const userId = window.currentUserId;

    if (userId) {
      // User is logged in - show logout button
      container.innerHTML = `
        <button class="btn" id="btnLogout" style="font-size: 14px;">
          🔓 Logout
        </button>
      `;
    } else {
      // User is logged out - show login/signup buttons
      container.innerHTML = `
        <button class="btn primary" id="btnLogin" style="font-size: 14px; margin-right: 8px;">
          🔐 Login
        </button>
        <button class="btn" id="btnSignup" style="font-size: 14px;">
          ✨ Sign Up
        </button>
      `;
    }

    this.attachButtonListeners();
  },

  /**
   * Attach event listeners to auth buttons
   */
  attachButtonListeners() {
    const btnLogin = document.getElementById('btnLogin');
    const btnSignup = document.getElementById('btnSignup');
    const btnLogout = document.getElementById('btnLogout');

    if (btnLogin) {
      btnLogin.addEventListener('click', () => this.showLoginModal());
    }

    if (btnSignup) {
      btnSignup.addEventListener('click', () => this.showSignupModal());
    }

    if (btnLogout) {
      btnLogout.addEventListener('click', () => this.handleLogout());
    }
  },

  /**
   * Setup auth state change listener (only for UI updates, main listener is in main.js)
   */
  setupAuthListeners() {
    if (!window.sb) return;

    // Only listen for UI updates, don't trigger full re-renders here
    // The main auth listener in main.js handles the full logic
    window.sb.auth.onAuthStateChange((event, session) => {
      console.log('🔄 AuthUI: Auth state changed:', event);

      // Update UI buttons only
      this.renderAuthButtons();
    });
  },

  /**
   * Show login modal
   */
  showLoginModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'authModal';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 400px;">
        <h2 class="h2">🔐 Login to Hogwarts</h2>
        <p class="muted">Access your magical progress from anywhere!</p>

        <form id="loginForm" style="margin-top: 16px;">
          <div style="margin-bottom: 12px;">
            <label style="display: block; margin-bottom: 6px; color: var(--text);">
              Email <span style="color: var(--danger);">*</span>
            </label>
            <input 
              type="email" 
              id="loginEmail" 
              class="input-field" 
              placeholder="wizard@hogwarts.edu"
              required
            />
          </div>

          <div style="margin-bottom: 12px;">
            <label style="display: block; margin-bottom: 6px; color: var(--text);">
              Password <span style="color: var(--danger);">*</span>
            </label>
            <input 
              type="password" 
              id="loginPassword" 
              class="input-field" 
              placeholder="Enter your magical password"
              required
            />
          </div>

          <div id="loginError" style="margin: 12px 0;"></div>

          <div class="toolbar">
            <button type="button" class="btn" id="btnCancelLogin">Cancel</button>
            <button type="submit" class="btn primary">Login</button>
          </div>
        </form>

        <p class="muted" style="margin-top: 16px; text-align: center;">
          Don't have an account? 
          <a href="#" id="linkToSignup" style="color: var(--accent);">Sign up here</a>
        </p>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    document.getElementById('btnCancelLogin').onclick = () => modal.remove();
    document.getElementById('linkToSignup').onclick = (e) => {
      e.preventDefault();
      modal.remove();
      this.showSignupModal();
    };

    document.getElementById('loginForm').onsubmit = async (e) => {
      e.preventDefault();
      await this.handleLogin(modal);
    };

    // Focus email field
    document.getElementById('loginEmail').focus();
  },

  /**
   * Show signup modal
   */
  showSignupModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'authModal';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 400px;">
        <h2 class="h2">✨ Join Hogwarts</h2>
        <p class="muted">Create your wizard account!</p>

        <form id="signupForm" style="margin-top: 16px;">
          <div style="margin-bottom: 12px;">
            <label style="display: block; margin-bottom: 6px; color: var(--text);">
              Email <span style="color: var(--danger);">*</span>
            </label>
            <input 
              type="email" 
              id="signupEmail" 
              class="input-field" 
              placeholder="wizard@hogwarts.edu"
              required
            />
          </div>

          <div style="margin-bottom: 12px;">
            <label style="display: block; margin-bottom: 6px; color: var(--text);">
              Password <span style="color: var(--danger);">*</span>
            </label>
            <input 
              type="password" 
              id="signupPassword" 
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
              id="signupPasswordConfirm" 
              class="input-field" 
              placeholder="Repeat password"
              minlength="6"
              required
            />
          </div>

          <div id="signupError" style="margin: 12px 0;"></div>

          <div class="toolbar">
            <button type="button" class="btn" id="btnCancelSignup">Cancel</button>
            <button type="submit" class="btn primary">Sign Up</button>
          </div>
        </form>

        <p class="muted" style="margin-top: 16px; text-align: center;">
          Already have an account? 
          <a href="#" id="linkToLogin" style="color: var(--accent);">Login here</a>
        </p>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    document.getElementById('btnCancelSignup').onclick = () => modal.remove();
    document.getElementById('linkToLogin').onclick = (e) => {
      e.preventDefault();
      modal.remove();
      this.showLoginModal();
    };

    document.getElementById('signupForm').onsubmit = async (e) => {
      e.preventDefault();
      await this.handleSignup(modal);
    };

    // Focus email field
    document.getElementById('signupEmail').focus();
  },

  /**
   * Handle login form submission
   */
  async handleLogin(modal) {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    if (!email || !password) {
      errorDiv.innerHTML = '<div class="overlay error">Please fill in all fields</div>';
      return;
    }

    try {
      const { data, error } = await window.sb.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      errorDiv.innerHTML = '<div class="overlay success">✅ Login successful!</div>';
      setTimeout(() => {
        modal.remove();
        this.showNotification('Welcome back, wizard! 🪄', 'success');
      }, 1000);

    } catch (error) {
      console.error('Login error:', error);
      errorDiv.innerHTML = `<div class="overlay error">❌ ${error.message}</div>`;
    }
  },

  /**
   * Handle signup form submission
   */
  async handleSignup(modal) {
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const passwordConfirm = document.getElementById('signupPasswordConfirm').value;
    const errorDiv = document.getElementById('signupError');

    if (!email || !password || !passwordConfirm) {
      errorDiv.innerHTML = '<div class="overlay error">Please fill in all fields</div>';
      return;
    }

    if (password !== passwordConfirm) {
      errorDiv.innerHTML = '<div class="overlay error">Passwords do not match</div>';
      return;
    }

    if (password.length < 6) {
      errorDiv.innerHTML = '<div class="overlay error">Password must be at least 6 characters</div>';
      return;
    }

    try {
      const { data, error } = await window.sb.auth.signUp({
        email,
        password
      });

      if (error) throw error;

      errorDiv.innerHTML = '<div class="overlay success">✅ Account created! Please check your email to verify.</div>';

      setTimeout(() => {
        modal.remove();
        this.showNotification('Welcome to Hogwarts! Check your email. 📧', 'success');
      }, 2000);

    } catch (error) {
      console.error('Signup error:', error);
      errorDiv.innerHTML = `<div class="overlay error">❌ ${error.message}</div>`;
    }
  },

  /**
   * Handle logout
   */
  async handleLogout() {
    if (!confirm('Are you sure you want to logout?')) return;

    try {
      const { error } = await window.sb.auth.signOut();
      if (error) throw error;

      this.showNotification('Successfully logged out. See you soon! 👋', 'success');

      // Redirect to levels page
      location.hash = '#levels';

    } catch (error) {
      console.error('Logout error:', error);
      this.showNotification('Logout failed: ' + error.message, 'error');
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
  document.addEventListener('DOMContentLoaded', () => window.AuthUI.init());
} else {
  window.AuthUI.init();
}
