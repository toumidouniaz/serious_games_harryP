// migration.js
const PROGRESS_KEY = "hp_logic_progress";
const MIGRATION_KEY = "hp_migrated_user";

window.migrateLocalProgressIfNeeded = async function (userId) {
  if (localStorage.getItem(MIGRATION_KEY) === userId) return;

  const raw = localStorage.getItem(PROGRESS_KEY);
  if (!raw) {
    localStorage.setItem(MIGRATION_KEY, userId);
    return;
  }

  let p;
  try { p = JSON.parse(raw); } catch { p = null; }
  if (!p) {
    localStorage.setItem(MIGRATION_KEY, userId);
    return;
  }

  const unlocked = Number(p.unlockedLevel || 1);
  const completed = Array.isArray(p.completedLevels) ? p.completedLevels.map(Number) : [];

  await window.DatabaseService.upsertProgress(userId, unlocked, completed);

  localStorage.setItem(MIGRATION_KEY, userId);
};
