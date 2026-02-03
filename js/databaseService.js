// ============================================
// databaseService.js - ENHANCED VERSION WITH BETTER ERROR LOGGING
// ============================================

window.DatabaseService = {
  /**
   * =============================
   * PROGRESS OPERATIONS
   * =============================
   */

  /**
   * Get user's progress
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} Progress object
   */
  async getProgress(userId) {
    const { data, error } = await window.sb
      .from("progress")
      .select("*")
      .eq("user_id", userId)
      .single();

    // If no row exists yet, return default progress
    if (error && error.code === "PGRST116") {
      return {
        user_id: userId,
        unlocked_level: 1,
        completed_levels: []
      };
    }

    if (error) throw error;
    return data;
  },

  /**
   * Update or insert user progress
   * @param {string} userId - User UUID
   * @param {number} unlockedLevel - Highest unlocked level
   * @param {Array<number>} completedLevels - Array of completed level IDs
   * @returns {Promise<Object>} Updated progress object
   */
  async upsertProgress(userId, unlockedLevel, completedLevels) {
    const payload = {
      user_id: userId,
      unlocked_level: unlockedLevel,
      completed_levels: completedLevels,
    };

    const { data, error } = await window.sb
      .from("progress")
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('❌ upsertProgress error:', error);
      throw error;
    }
    return data;
  },

  /**
   * Reset user progress
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} Reset progress object
   */
  async resetProgress(userId) {
    return await this.upsertProgress(userId, 1, []);
  },

  /**
   * =============================
   * SAVED CIRCUITS OPERATIONS
   * =============================
   */

  /**
   * Save a circuit to the database
   * @param {string} userId - User UUID
   * @param {Object} params - Circuit data
   * @param {number} params.levelId - Level ID (optional)
   * @param {string} params.name - Circuit name
   * @param {string} params.description - Circuit description (optional)
   * @param {Object} params.circuitJson - Circuit data (gates, wires, etc.)
   * @returns {Promise<Object>} Saved circuit object
   */
  async saveCircuit(userId, { levelId = null, name, description = '', circuitJson }) {
    // Clean payload - only include fields that exist in the database
    const payload = {
      user_id: userId,
      level_id: levelId,
      name: name,
      description: description,
      circuit_json: circuitJson
    };

    console.log('💾 Attempting to save circuit:', { userId, name, levelId });

    const { data, error } = await window.sb
      .from("saved_circuits")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('❌ Database save error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }

    console.log('✅ Circuit saved to database:', data.id);
    return data;
  },

  /**
   * Update an existing circuit
   * @param {string} circuitId - Circuit UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated circuit object
   */
  async updateCircuit(circuitId, updates) {
    const payload = {
      ...updates,
    };

    const { data, error } = await window.sb
      .from("saved_circuits")
      .update(payload)
      .eq('id', circuitId)
      .select()
      .single();

    if (error) {
      console.error('❌ updateCircuit error:', error);
      throw error;
    }
    return data;
  },

  /**
   * Get all circuits for a user
   * @param {string} userId - User UUID
   * @returns {Promise<Array>} Array of circuit objects
   */
  async getAllCircuits(userId) {
    const { data, error } = await window.sb
      .from("saved_circuits")
      .select("*")
      .eq("user_id", userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ getAllCircuits error:', error);
      throw error;
    }
    return data || [];
  },

  /**
   * Get circuits for a specific level
   * @param {string} userId - User UUID
   * @param {number} levelId - Level ID
   * @returns {Promise<Array>} Array of circuit objects
   */
  async getCircuitsByLevel(userId, levelId) {
    const { data, error } = await window.sb
      .from("saved_circuits")
      .select("*")
      .eq("user_id", userId)
      .eq("level_id", levelId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ getCircuitsByLevel error:', error);
      throw error;
    }
    return data || [];
  },

  /**
   * Get a specific circuit
   * @param {string} circuitId - Circuit UUID
   * @returns {Promise<Object>} Circuit object
   */
  async getCircuit(circuitId) {
    const { data, error } = await window.sb
      .from("saved_circuits")
      .select("*")
      .eq("id", circuitId)
      .single();

    if (error) {
      console.error('❌ getCircuit error:', error);
      throw error;
    }
    return data;
  },

  /**
   * Delete a circuit
   * @param {string} circuitId - Circuit UUID
   * @returns {Promise<void>}
   */
  async deleteCircuit(circuitId) {
    const { error } = await window.sb
      .from("saved_circuits")
      .delete()
      .eq("id", circuitId);

    if (error) {
      console.error('❌ deleteCircuit error:', error);
      throw error;
    }
  },

  /**
   * =============================
   * LEADERBOARD OPERATIONS (Future)
   * =============================
   */

  /**
   * Submit a score to the leaderboard
   * @param {string} userId - User UUID
   * @param {number} levelId - Level ID
   * @param {number} score - Score value
   * @param {Object} options - Additional options
   * @param {number} options.completionTime - Time in seconds
   * @param {number} options.gatesUsed - Number of gates used
   * @param {number} options.wiresUsed - Number of wires used
   * @returns {Promise<Object>} Leaderboard entry
   */
  async submitScore(userId, levelId, score, options = {}) {
    const payload = {
      user_id: userId,
      level_id: levelId,
      score: score,
      completion_time: options.completionTime || null,
      gates_used: options.gatesUsed || null,
      wires_used: options.wiresUsed || null,
    };

    const { data, error } = await window.sb
      .from("leaderboard")
      .upsert(payload, { onConflict: 'user_id,level_id' })
      .select()
      .single();

    if (error) {
      console.error('❌ submitScore error:', error);
      throw error;
    }
    return data;
  },

  /**
   * Get global leaderboard
   * @param {number} limit - Number of entries to return
   * @returns {Promise<Array>} Array of leaderboard entries
   */
  async getGlobalLeaderboard(limit = 10) {
    const { data, error } = await window.sb
      .from("leaderboard")
      .select(`
        *,
        users:user_id (email)
      `)
      .order('score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ getGlobalLeaderboard error:', error);
      throw error;
    }
    return data || [];
  },

  /**
   * Get leaderboard for a specific level
   * @param {number} levelId - Level ID
   * @param {number} limit - Number of entries to return
   * @returns {Promise<Array>} Array of leaderboard entries
   */
  async getLevelLeaderboard(levelId, limit = 10) {
    const { data, error } = await window.sb
      .from("leaderboard")
      .select(`
        *,
        users:user_id (email)
      `)
      .eq('level_id', levelId)
      .order('score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ getLevelLeaderboard error:', error);
      throw error;
    }
    return data || [];
  },

  /**
   * Get user's personal records
   * @param {string} userId - User UUID
   * @returns {Promise<Array>} Array of user's scores
   */
  async getPersonalRecords(userId) {
    const { data, error } = await window.sb
      .from("leaderboard")
      .select("*")
      .eq("user_id", userId)
      .order('level_id', { ascending: true });

    if (error) {
      console.error('❌ getPersonalRecords error:', error);
      throw error;
    }
    return data || [];
  },

  /**
   * =============================
   * UTILITY METHODS
   * =============================
   */

  /**
   * Check if database connection is working
   * @returns {Promise<boolean>} True if connected
   */
  async healthCheck() {
    try {
      const { error } = await window.sb
        .from("progress")
        .select("id")
        .limit(1);

      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Get current user info
   * @returns {Promise<Object|null>} User object or null
   */
  async getCurrentUser() {
    try {
      const { data: { user } } = await window.sb.auth.getUser();
      return user;
    } catch {
      return null;
    }
  }
};

// Log database service initialization
console.log('✅ DatabaseService initialized');