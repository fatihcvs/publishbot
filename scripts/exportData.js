const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const tables = [
  'guilds',
  'warnings',
  'mod_cases',
  'custom_commands',
  'reaction_roles',
  'giveaways',
  'reminders',
  'afk_users',
  'user_levels',
  'level_rewards',
  'scheduled_messages',
  'user_achievements',
  'invite_tracking',
  'social_notifications',
  'user_birthdays',
  'birthday_config',
  'user_economy',
  'economy_config',
  'shop_items',
  'tickets',
  'ticket_config',
  'polls',
  'temp_voice_channels',
  'game_history',
  'user_inventory',
  'game_items',
  'active_duels',
  'daily_streak',
  'jackpot_pool',
  'user_stats',
  'loot_boxes',
  'lethe_animals',
  'user_animals',
  'lethe_weapons',
  'lethe_armors',
  'lethe_accessories',
  'lethe_consumables',
  'lethe_baits',
  'lethe_crates',
  'lethe_bosses',
  'user_lethe_inventory',
  'user_lethe_profile',
  'lethe_achievements',
  'user_lethe_achievements',
  'lethe_battles',
  'lethe_quests',
  'user_lethe_quests',
  'lethe_daily',
  'lethe_work',
  'lethe_evolution_gems',
  'lethe_abilities',
  'lethe_trades',
  'lethe_gifts',
  'lethe_friends',
  'lethe_raids',
  'lethe_leaderboard',
  'lethe_events',
  'lethe_community_goals',
  'lethe_event_participation'
];

async function exportData() {
  const exportDir = path.join(__dirname, '../data/export');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const allData = {};
  let totalRows = 0;

  console.log('Starting database export...\n');

  for (const table of tables) {
    try {
      const result = await pool.query(`SELECT * FROM ${table}`);
      allData[table] = result.rows;
      totalRows += result.rows.length;
      if (result.rows.length > 0) {
        console.log(`✓ ${table}: ${result.rows.length} rows`);
      }
    } catch (error) {
      console.log(`✗ ${table}: ${error.message}`);
      allData[table] = [];
    }
  }

  const exportPath = path.join(exportDir, 'full_export.json');
  fs.writeFileSync(exportPath, JSON.stringify(allData, null, 2));
  
  console.log(`\n========================================`);
  console.log(`Export completed!`);
  console.log(`Total tables: ${tables.length}`);
  console.log(`Total rows: ${totalRows}`);
  console.log(`File: ${exportPath}`);
  console.log(`========================================`);

  await pool.end();
}

exportData().catch(console.error);
