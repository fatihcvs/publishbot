const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const tableOrder = [
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

async function importData() {
  const exportPath = path.join(__dirname, '../data/export/full_export.json');
  
  if (!fs.existsSync(exportPath)) {
    console.error('Export file not found! Run exportData.js first.');
    process.exit(1);
  }

  const allData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
  let totalImported = 0;
  let skippedTables = 0;

  console.log('========================================');
  console.log('PRODUCTION DATABASE IMPORT');
  console.log('========================================');
  console.log('This script imports data from development to production.');
  console.log('Tables with existing data will be SKIPPED to prevent data loss.');
  console.log('If you want to overwrite, manually clear the table first.\n');
  console.log('Starting import...\n');

  for (const table of tableOrder) {
    const rows = allData[table] || [];
    if (rows.length === 0) continue;

    try {
      const existingResult = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      const existingCount = parseInt(existingResult.rows[0].count);
      
      if (existingCount > 0) {
        console.log(`⚠ ${table}: Already has ${existingCount} rows, skipping...`);
        skippedTables++;
        continue;
      }

      const columns = Object.keys(rows[0]);
      const columnList = columns.map(c => `"${c}"`).join(', ');
      
      for (const row of rows) {
        const values = columns.map((col, i) => {
          const val = row[col];
          if (val === null) return 'NULL';
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
          if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
          if (typeof val === 'number') return val;
          if (val instanceof Date || (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}/))) {
            return `'${val}'::timestamp`;
          }
          return `'${String(val).replace(/'/g, "''")}'`;
        });
        
        const query = `INSERT INTO ${table} (${columnList}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING`;
        await pool.query(query);
      }
      
      totalImported += rows.length;
      console.log(`✓ ${table}: ${rows.length} rows imported`);
      
      const hasSerialId = rows[0].id && typeof rows[0].id === 'number';
      if (hasSerialId) {
        const maxId = Math.max(...rows.map(r => r.id));
        await pool.query(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), $1, true)`, [maxId]);
      }
      
    } catch (error) {
      console.log(`✗ ${table}: ${error.message}`);
    }
  }

  console.log(`\n========================================`);
  console.log(`Import completed!`);
  console.log(`Total rows imported: ${totalImported}`);
  console.log(`Tables skipped (had existing data): ${skippedTables}`);
  console.log(`========================================`);

  await pool.end();
}

importData().catch(console.error);
