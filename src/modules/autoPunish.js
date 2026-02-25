const { EmbedBuilder } = require('discord.js');

const defaultPunishments = {
  enabled: false,
  rules: [
    { warnings: 3, action: 'mute', duration: 10 },
    { warnings: 5, action: 'kick' },
    { warnings: 7, action: 'ban' }
  ]
};

async function checkAutoPunishment(message, userId, storage, client) {
  const guildData = await storage.getGuild(message.guild.id);
  const config = guildData?.autoPunishments || defaultPunishments;

  if (!config.enabled) return;

  const warningCount = await storage.getWarningCount(message.guild.id, userId);
  const member = await message.guild.members.fetch(userId).catch(() => null);

  if (!member) return;

  for (const rule of config.rules.sort((a, b) => b.warnings - a.warnings)) {
    if (warningCount >= rule.warnings) {
      await applyPunishment(message.guild, member, rule, warningCount, storage, client, guildData);
      break;
    }
  }
}

async function applyPunishment(guild, member, rule, warningCount, storage, client, guildData) {
  const reason = `Otomatik Ceza: ${warningCount} uyarıya ulaşıldı`;

  try {
    switch (rule.action) {
      case 'mute':
        if (member.moderatable) {
          const duration = (rule.duration || 10) * 60 * 1000;
          await member.timeout(duration, reason);
          await storage.addModCase(guild.id, 'mute', member.id, client.user.id, reason, rule.duration * 60);
        }
        break;
      case 'kick':
        if (member.kickable) {
          await member.kick(reason);
          await storage.addModCase(guild.id, 'kick', member.id, client.user.id, reason);
        }
        break;
      case 'ban':
        if (member.bannable) {
          await member.ban({ reason });
          await storage.addModCase(guild.id, 'ban', member.id, client.user.id, reason);
        }
        break;
    }

    try {
      await member.send(`**${guild.name}** sunucusunda ${warningCount} uyarıya ulaştığınız için **${rule.action}** cezası aldınız.`);
    } catch { }

    const targetLogChannel = guildData?.modLogChannel || guildData?.logChannel;
    if (targetLogChannel) {
      const logChannel = guild.channels.cache.get(targetLogChannel);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('Otomatik Ceza Uygulandı')
          .addFields(
            { name: 'Kullanıcı', value: member.user.tag, inline: true },
            { name: 'Ceza', value: rule.action, inline: true },
            { name: 'Uyarı Sayısı', value: `${warningCount}`, inline: true },
            { name: 'Sebep', value: reason }
          )
          .setTimestamp();

        await logChannel.send({ embeds: [embed] });
      }
    }
  } catch (error) {
    console.error('Auto punishment error:', error);
  }
}

module.exports = { checkAutoPunishment, defaultPunishments };
