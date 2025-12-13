const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'otoceza',
  aliases: ['autopunish', 'autop'],
  description: 'Otomatik ceza sistemini yönetir',
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(message, args, client) {
    const { storage } = require('../database/storage');
    
    const guildData = await storage.getGuild(message.guild.id) || {};
    const config = guildData.autoPunishments || {
      enabled: false,
      rules: [
        { warnings: 3, action: 'mute', duration: 10 },
        { warnings: 5, action: 'kick' },
        { warnings: 7, action: 'ban' }
      ]
    };
    
    const subCommand = args[0]?.toLowerCase();
    
    if (!subCommand || subCommand === 'durum') {
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('Otomatik Ceza Sistemi')
        .addFields(
          { name: 'Durum', value: config.enabled ? '✅ Aktif' : '❌ Kapalı' }
        )
        .setDescription(
          '**Kurallar:**\n' +
          config.rules.map(r => {
            const actionNames = { mute: 'Sustur', kick: 'At', ban: 'Yasakla' };
            const duration = r.duration ? ` (${r.duration} dk)` : '';
            return `${r.warnings} uyarı → ${actionNames[r.action]}${duration}`;
          }).join('\n') +
          '\n\n**Komutlar:**\n`!otoceza aç/kapat`\n`!otoceza kural <uyarı_sayısı> <mute/kick/ban> [süre_dk]`'
        )
        .setTimestamp();
      
      return message.reply({ embeds: [embed] });
    }
    
    if (subCommand === 'aç') {
      config.enabled = true;
      await storage.upsertGuild(message.guild.id, { autoPunishments: config });
      return message.reply('Otomatik ceza sistemi aktif edildi!');
    }
    
    if (subCommand === 'kapat') {
      config.enabled = false;
      await storage.upsertGuild(message.guild.id, { autoPunishments: config });
      return message.reply('Otomatik ceza sistemi kapatıldı!');
    }
    
    if (subCommand === 'kural') {
      const warnings = parseInt(args[1]);
      const action = args[2]?.toLowerCase();
      const duration = parseInt(args[3]) || null;
      
      if (!warnings || !['mute', 'kick', 'ban'].includes(action)) {
        return message.reply('Kullanım: `!otoceza kural <uyarı_sayısı> <mute/kick/ban> [süre_dk]`');
      }
      
      const existingIndex = config.rules.findIndex(r => r.warnings === warnings);
      const rule = { warnings, action, ...(duration && { duration }) };
      
      if (existingIndex >= 0) {
        config.rules[existingIndex] = rule;
      } else {
        config.rules.push(rule);
        config.rules.sort((a, b) => a.warnings - b.warnings);
      }
      
      await storage.upsertGuild(message.guild.id, { autoPunishments: config });
      return message.reply(`${warnings} uyarıda ${action} kuralı eklendi/güncellendi.`);
    }
    
    if (subCommand === 'sil') {
      const warnings = parseInt(args[1]);
      if (!warnings) {
        return message.reply('Kullanım: `!otoceza sil <uyarı_sayısı>`');
      }
      
      config.rules = config.rules.filter(r => r.warnings !== warnings);
      await storage.upsertGuild(message.guild.id, { autoPunishments: config });
      return message.reply(`${warnings} uyarı kuralı silindi.`);
    }
    
    message.reply('Geçersiz komut! `!otoceza` yazarak yardım alın.');
  }
};
