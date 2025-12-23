const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function mergeGuilds(pool) {
  const exportPath = path.join(__dirname, '../data/export/full_export.json');
  
  if (!fs.existsSync(exportPath)) {
    return { success: false, error: 'Export file not found!' };
  }

  const allData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
  const guilds = allData.guilds || [];
  
  if (guilds.length === 0) {
    return { success: false, error: 'No guild data in export' };
  }

  const results = [];
  
  for (const guild of guilds) {
    try {
      const existingResult = await pool.query('SELECT id FROM guilds WHERE id = $1', [guild.id]);
      
      if (existingResult.rows.length > 0) {
        await pool.query(`
          UPDATE guilds SET
            prefix = $2,
            welcome_channel = $3,
            welcome_message = $4,
            log_channel = $5,
            auto_role = $6,
            mute_role = $7,
            modules = $8,
            automod_config = $9,
            auto_punishments = $10,
            log_config = $11,
            goodbye_channel = $12,
            goodbye_message = $13,
            verification_role = $14,
            verified_role = $15,
            ticket_category = $16,
            ticket_support_role = $17,
            temp_voice_channel = $18,
            temp_voice_category = $19
          WHERE id = $1
        `, [
          guild.id,
          guild.prefix,
          guild.welcome_channel,
          guild.welcome_message,
          guild.log_channel,
          guild.auto_role,
          guild.mute_role,
          JSON.stringify(guild.modules || {}),
          JSON.stringify(guild.automod_config || {}),
          JSON.stringify(guild.auto_punishments || {}),
          JSON.stringify(guild.log_config || {}),
          guild.goodbye_channel,
          guild.goodbye_message,
          guild.verification_role,
          guild.verified_role,
          guild.ticket_category,
          guild.ticket_support_role,
          guild.temp_voice_channel,
          guild.temp_voice_category
        ]);
        results.push({ guildId: guild.id, status: 'updated' });
      } else {
        await pool.query(`
          INSERT INTO guilds (
            id, prefix, welcome_channel, welcome_message, log_channel, auto_role, mute_role,
            modules, automod_config, auto_punishments, log_config, created_at,
            goodbye_channel, goodbye_message, verification_role, verified_role,
            ticket_category, ticket_support_role, temp_voice_channel, temp_voice_category
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        `, [
          guild.id,
          guild.prefix,
          guild.welcome_channel,
          guild.welcome_message,
          guild.log_channel,
          guild.auto_role,
          guild.mute_role,
          JSON.stringify(guild.modules || {}),
          JSON.stringify(guild.automod_config || {}),
          JSON.stringify(guild.auto_punishments || {}),
          JSON.stringify(guild.log_config || {}),
          guild.created_at || new Date(),
          guild.goodbye_channel,
          guild.goodbye_message,
          guild.verification_role,
          guild.verified_role,
          guild.ticket_category,
          guild.ticket_support_role,
          guild.temp_voice_channel,
          guild.temp_voice_category
        ]);
        results.push({ guildId: guild.id, status: 'inserted' });
      }
    } catch (error) {
      results.push({ guildId: guild.id, status: 'error', error: error.message });
    }
  }

  return { success: true, results };
}

module.exports = { mergeGuilds };
