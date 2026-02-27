const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'warn',
  aliases: ['uyar'],
  description: 'Bir üyeyi uyarır ve uyarı sayısına göre otomatik ceza uygular',
  permissions: [PermissionFlagsBits.ModerateMembers],
  async execute(message, args, client, storage) {
    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

    if (!target) {
      return message.reply('Lütfen uyarılacak bir kullanıcı belirtin!');
    }

    if (target.id === message.author.id) {
      return message.reply('Kendini uyaramazsın!');
    }

    if (target.user.bot) {
      return message.reply('Botları uyaramazsın!');
    }

    const reason = args.slice(1).join(' ') || 'Sebep belirtilmedi';

    // Veritabanına uyarı kaydet
    try {
      await storage.addWarning(message.guild.id, target.id, message.author.id, reason);
      await storage.addModCase(message.guild.id, 'warn', target.id, message.author.id, reason);
    } catch (err) {
      console.error('Uyarı kaydetme hatası:', err);
      return message.reply('Uyarı kaydedilirken bir hata oluştu!');
    }

    const warningCount = await storage.getWarningCount(message.guild.id, target.id);

    // Otomatik ceza sistemi
    let autoPunishment = null;
    const guildData = await storage.getGuild(message.guild.id);

    try {
      if (warningCount >= 5 && target.kickable) {
        await target.kick(`AutoPunish: ${warningCount} uyarı`);
        await storage.addModCase(message.guild.id, 'kick', target.id, client.user.id, `Otomatik kick: ${warningCount} uyarı`);
        autoPunishment = `🦵 Otomatik Kick (${warningCount} uyarı)`;
      } else if (warningCount >= 3 && target.moderatable) {
        // 10 dakika mute
        const muteDuration = 10 * 60 * 1000;
        await target.timeout(muteDuration, `AutoPunish: ${warningCount} uyarı`);
        await storage.addModCase(message.guild.id, 'mute', target.id, client.user.id, `Otomatik susturma: ${warningCount} uyarı`, 10);
        autoPunishment = `🔇 Otomatik Susturma (${warningCount} uyarı) - 10 dakika`;
      }
    } catch (punishErr) {
      console.error('Otomatik ceza uygulama hatası:', punishErr);
    }

    const embed = new EmbedBuilder()
      .setColor(warningCount >= 5 ? '#ff0000' : warningCount >= 3 ? '#ff6600' : '#ffff00')
      .setTitle('⚠️ Kullanıcı Uyarıldı')
      .addFields(
        { name: 'Kullanıcı', value: `${target.user.tag} (<@${target.id}>)`, inline: true },
        { name: 'Toplam Uyarı', value: `${warningCount}`, inline: true },
        { name: 'Moderatör', value: message.author.tag, inline: true },
        { name: 'Sebep', value: reason }
      )
      .setTimestamp();

    if (autoPunishment) {
      embed.addFields({ name: '🤖 Otomatik Ceza', value: autoPunishment });
    }

    // Uyarı eşiklerine yaklaştıkça renk ve bilgi değişir
    if (warningCount === 2) {
      embed.setFooter({ text: '⚠️ Dikkat: 3. uyarıda otomatik susturma uygulanacak!' });
    } else if (warningCount === 4) {
      embed.setFooter({ text: '🚨 Son uyarı: 5. uyarıda otomatik kick uygulanacak!' });
    }

    await message.reply({ embeds: [embed] });

    // Log kanalına gönder
    if (guildData?.logChannel) {
      const logChannel = message.guild.channels.cache.get(guildData.logChannel);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor('#ffff00')
          .setTitle('📋 Moderasyon: Uyarı')
          .addFields(
            { name: 'Kullanıcı', value: `${target.user.tag} (${target.id})`, inline: true },
            { name: 'Moderatör', value: `${message.author.tag} (${message.author.id})`, inline: true },
            { name: 'Toplam Uyarı', value: `${warningCount}`, inline: true },
            { name: 'Sebep', value: reason }
          )
          .setTimestamp();

        if (autoPunishment) {
          logEmbed.addFields({ name: 'Otomatik Ceza', value: autoPunishment });
        }

        await logChannel.send({ embeds: [logEmbed] }).catch(() => { });
      }
    }
  }
};
