const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

// Varsayılan mod konfigürasyonu
const DEFAULT_MOD_CONFIG = {
  mutePts: 3,       // kaç puan → mute
  kickPts: 5,       // kaç puan → kick
  banPts: 7,        // kaç puan → ban
  expireDays: 30    // uyarı kaç günde sona erer (0 = sonsuz)
};

module.exports = {
  name: 'warn',
  aliases: ['uyar'],
  description: 'Kullanıcıyı uyarır. Puan sistemi ve sona erme destekli.',
  usage: '!warn @kullanıcı [sebep] [| mod notu]',
  permissions: [PermissionFlagsBits.ModerateMembers],

  async execute(message, args, client, storage) {
    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

    if (!target) return message.reply('Lütfen uyarılacak bir kullanıcı belirtin!').catch(() => { });
    if (target.id === message.author.id) return message.reply('Kendini uyaramazsın!').catch(() => { });
    if (target.user.bot) return message.reply('Botları uyaramazsın!').catch(() => { });

    // Sebep ve moderatör notunu ayrıştır  (!warn @u sebep | not)
    const rawArgs = args.slice(1).join(' ');
    const [reasonPart, notePart] = rawArgs.split('|').map(s => s?.trim());
    const reason = reasonPart || 'Sebep belirtilmedi';
    const note = notePart || null;

    // Guild mod konfigürasyonu
    const guildData = await storage.getGuild(message.guild.id);
    const modCfg = { ...DEFAULT_MOD_CONFIG, ...(guildData?.modConfig || {}) };

    // Uyarı sona erme tarihi
    const expiresAt = modCfg.expireDays > 0
      ? new Date(Date.now() + modCfg.expireDays * 24 * 60 * 60 * 1000)
      : null;

    // Uyarıyı kaydet
    try {
      await storage.addWarning(message.guild.id, target.id, message.author.id, reason, { points: 1, note, expiresAt });
      await storage.addModCase(message.guild.id, 'warn', target.id, message.author.id, reason, null, note);
    } catch (err) {
      console.error('Uyarı kaydetme hatası:', err);
      return message.reply('Uyarı kaydedilirken bir hata oluştu!').catch(() => { });
    }

    // Güncel aktif puan
    const totalPts = await storage.getWarnPoints(message.guild.id, target.id);
    const warnCount = await storage.getWarningCount(message.guild.id, target.id);

    // Otomatik ceza (puana göre)
    let autoPunishment = null;
    try {
      if (totalPts >= modCfg.banPts && target.bannable) {
        await target.ban({ reason: `AutoPunish: ${totalPts} uyarı puanı` });
        await storage.addModCase(message.guild.id, 'ban', target.id, client.user.id, `Otomatik ban: ${totalPts} puan`);
        autoPunishment = `🔨 Otomatik Ban (${totalPts} puan)`;
      } else if (totalPts >= modCfg.kickPts && target.kickable) {
        await target.kick(`AutoPunish: ${totalPts} uyarı puanı`);
        await storage.addModCase(message.guild.id, 'kick', target.id, client.user.id, `Otomatik kick: ${totalPts} puan`);
        autoPunishment = `🦵 Otomatik Kick (${totalPts} puan)`;
      } else if (totalPts >= modCfg.mutePts && target.moderatable) {
        const muteDuration = 10 * 60 * 1000;
        await target.timeout(muteDuration, `AutoPunish: ${totalPts} uyarı puanı`);
        await storage.addModCase(message.guild.id, 'mute', target.id, client.user.id, `Otomatik susturma: ${totalPts} puan`, 10);
        autoPunishment = `🔇 Otomatik Susturma (${totalPts} puan) — 10 dk`;
      }
    } catch (punishErr) {
      console.error('Otomatik ceza hatası:', punishErr);
    }

    // Embed
    const color = totalPts >= modCfg.kickPts ? '#ff0000' : totalPts >= modCfg.mutePts ? '#ff6600' : '#ffff00';
    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle('⚠️ Kullanıcı Uyarıldı')
      .setThumbnail(target.user.displayAvatarURL())
      .addFields(
        { name: '👤 Kullanıcı', value: `${target.user.tag} (<@${target.id}>)`, inline: true },
        { name: '🛡️ Moderatör', value: message.author.tag, inline: true },
        { name: '📊 Aktif Puan', value: `${totalPts} / ${warnCount} uyarı`, inline: true },
        { name: '📝 Sebep', value: reason }
      )
      .setTimestamp();

    if (note) embed.addFields({ name: '🔒 Mod Notu (gizli)', value: note });
    if (expiresAt) embed.setFooter({ text: `Uyarılar ${modCfg.expireDays} günde sona erer` });
    if (autoPunishment) embed.addFields({ name: '🤖 Otomatik Ceza', value: autoPunishment });

    // Eşik uyarıları
    if (!autoPunishment) {
      if (totalPts === modCfg.mutePts - 1)
        embed.setFooter({ text: `⚠️ 1 puan sonra otomatik susturma! (Eşik: ${modCfg.mutePts})` });
      else if (totalPts === modCfg.kickPts - 1)
        embed.setFooter({ text: `🚨 1 puan sonra otomatik kick! (Eşik: ${modCfg.kickPts})` });
      else if (totalPts === modCfg.banPts - 1)
        embed.setFooter({ text: `☠️ 1 puan sonra otomatik ban! (Eşik: ${modCfg.banPts})` });
    }

    await message.reply({ embeds: [embed] }).catch(() => { });

    // Log kanalı
    if (guildData?.modLogChannel || guildData?.logChannel) {
      const logCh = message.guild.channels.cache.get(guildData.modLogChannel || guildData.logChannel);
      if (logCh) {
        const logEmbed = new EmbedBuilder()
          .setColor('#ffff00')
          .setTitle('📋 Moderasyon: Uyarı')
          .addFields(
            { name: 'Kullanıcı', value: `${target.user.tag} (${target.id})`, inline: true },
            { name: 'Moderatör', value: `${message.author.tag} (${message.author.id})`, inline: true },
            { name: 'Aktif Puan', value: `${totalPts}`, inline: true },
            { name: 'Sebep', value: reason }
          )
          .setTimestamp();
        if (note) logEmbed.addFields({ name: 'Mod Notu', value: note });
        if (autoPunishment) logEmbed.addFields({ name: 'Otomatik Ceza', value: autoPunishment });
        await logCh.send({ embeds: [logEmbed] }).catch(() => { });
      }
    }
  }
};
