const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

// Süre çözümleyici: "7g" → 7 gün ms, "1s" → 1 saat ms, "30d" → 30 dk ms
function parseDuration(str) {
  const match = str?.match(/^(\d+)(g|s|d|saat|gün|dakika|day|hour|min)?$/i);
  if (!match) return null;
  const num = parseInt(match[1]);
  const unit = (match[2] || '').toLowerCase();
  if (unit === 'g' || unit === 'gün' || unit === 'day') return num * 24 * 60 * 60 * 1000;
  if (unit === 's' || unit === 'saat' || unit === 'hour') return num * 60 * 60 * 1000;
  if (unit === 'd' || unit === 'dakika' || unit === 'min') return num * 60 * 1000;
  return num * 24 * 60 * 60 * 1000; // varsayılan: gün
}

function formatDuration(ms) {
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  if (days > 0) return `${days} gün${hours > 0 ? ` ${hours} saat` : ''}`;
  return `${hours} saat`;
}

module.exports = {
  name: 'ban',
  aliases: ['yasakla', 'tempban', 'sürelihban'],
  description: 'Bir üyeyi kalıcı ya da süreli olarak yasaklar',
  permissions: [PermissionFlagsBits.BanMembers],
  usage: '!ban @kullanıcı [süre: 7g/24s/60d] [sebep]',
  // Örnekler:
  //  !ban @kullanıcı spam         → kalıcı ban
  //  !ban @kullanıcı 7g reklam   → 7 günlük ban, sonra otomatik unban

  async execute(message, args, client, storage) {
    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

    if (!target) {
      return message.reply(
        '❌ **Kullanım:**\n' +
        '`!ban @kullanıcı <sebep>` → Kalıcı ban\n' +
        '`!ban @kullanıcı 7g <sebep>` → 7 günlük ban\n' +
        '`!ban @kullanıcı 24s reklam` → 24 saatlik ban'
      );
    }

    if (!target.bannable) {
      return message.reply('❌ Bu kullanıcıyı yasaklayamıyorum! (Rolü benden yüksek olabilir)');
    }

    if (target.id === message.author.id) {
      return message.reply('❌ Kendini yasaklayamazsın!');
    }

    // Süre parse et (2. arg sayısal + birim mi?)
    let duration = null;
    let reasonStartIndex = 1;

    if (args[1] && /^\d+[gsdhourminayd]*$/i.test(args[1])) {
      duration = parseDuration(args[1]);
      if (duration !== null) reasonStartIndex = 2;
    }

    const reason = args.slice(reasonStartIndex).join(' ') || 'Sebep belirtilmedi';
    const unbanAt = duration ? new Date(Date.now() + duration) : null;

    try {
      await target.ban({ reason: duration ? `[${formatDuration(duration)} BAN] ${reason}` : reason });

      if (storage) {
        await storage.addModCase(
          message.guild.id,
          duration ? 'tempban' : 'ban',
          target.id,
          message.author.id,
          reason,
          duration ? Math.floor(duration / 60000) : null
        ).catch(() => { });
      }

      // Süreli ise scheduler'a kaydet (varsa)
      if (duration) {
        setTimeout(async () => {
          try {
            await message.guild.bans.remove(target.id, 'Süreli ban sona erdi').catch(() => { });
          } catch (_) { }
        }, duration);
      }

      const embed = new EmbedBuilder()
        .setColor('#ef4444')
        .setTitle(duration ? '⏳ Süreli Ban Uygulandı' : '🔨 Kullanıcı Yasaklandı')
        .addFields(
          { name: '👤 Kullanıcı', value: `${target.user.tag}\n\`${target.id}\``, inline: true },
          { name: '🛡️ Moderatör', value: message.author.tag, inline: true },
          { name: '📝 Sebep', value: reason, inline: false }
        )
        .setTimestamp();

      if (duration) {
        embed.addFields(
          { name: '⏱️ Süre', value: formatDuration(duration), inline: true },
          { name: '🔓 Unban Zamanı', value: `<t:${Math.floor(unbanAt.getTime() / 1000)}:F>`, inline: true }
        );
      }

      await message.reply({ embeds: [embed] });

      // Log kanalına gönder
      const guildData = await storage?.getGuild(message.guild.id);
      if (guildData?.logChannel) {
        const logCh = message.guild.channels.cache.get(guildData.logChannel);
        if (logCh) await logCh.send({ embeds: [embed] }).catch(() => { });
      }
    } catch (error) {
      console.error('[BAN] Hata:', error);
      message.reply('❌ Kullanıcı yasaklanırken bir hata oluştu!');
    }
  }
};
