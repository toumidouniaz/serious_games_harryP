// databaseService.js
window.DatabaseService = {
  async getProgress(userId) {
    const { data, error } = await window.sb
      .from("progress")
      .select("*")
      .eq("user_id", userId)
      .single();

    // si pas encore de ligne -> progression par défaut
    if (error && error.code !== "PGRST116") throw error;
    return data || { user_id: userId, unlocked_level: 1, completed_levels: [] };
  },

  async upsertProgress(userId, unlockedLevel, completedLevels) {
    const payload = {
      user_id: userId,
      unlocked_level: unlockedLevel,
      completed_levels: completedLevels,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await window.sb
      .from("progress")
      .upsert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async saveCircuit(userId, { levelId, name, circuitJson }) {
    const payload = {
      user_id: userId,
      level_id: levelId,
      name,
      circuit_json: circuitJson,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await window.sb
      .from("saved_circuits")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
