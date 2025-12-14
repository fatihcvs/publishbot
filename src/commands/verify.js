const { EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  name: 'kayıt',
  aliases: ['verify', 'kayit', 'dogrulama'],
  description: 'Kayıt/doğrulama sistemini yönetir',
  permissions: [PermissionFlagsBits.ManageRoles],
  async execute(message, args, client) {
    const { storage } = require('../database/storage');
    const subCommand = args[0]?.toLowerCase();

    if (subCommand === 'kur' || subCommand === 'setup') {
      const unverifiedRole = message.mentions.roles.first();
      const verifiedRole = message.mentions.roles.last();

      if (!unverifiedRole || !verifiedRole || unverifiedRole.id === verifiedRole.id) {
        return message.reply('Kullanım: `!kayıt kur @doğrulanmamış-rol @doğrulanmış-rol`');
      }

      await storage.upsertGuild(message.guild.id, {
        verificationRole: unverifiedRole.id,
        verifiedRole: verifiedRole.id
      });

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('✅ Sunucu Doğrulama')
        .setDescription('Sunucumuza hoş geldiniz!\nKurallara uyacağınızı kabul ediyorsanız aşağıdaki butona tıklayarak kendinizi doğrulayın.')
        .setThumbnail(message.guild.iconURL({ dynamic: true }))
        .addFields(
          { name: '📜 Kurallar', value: '1. Saygılı olun\n2. Spam yapmayın\n3. NSFW içerik paylaşmayın\n4. Reklam yapmayın' }
        )
        .setFooter({ text: 'Doğrulamak için butona tıklayın' });

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('verify_user')
            .setLabel('Doğrula')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅')
        );

      await message.channel.send({ embeds: [embed], components: [row] });
      return message.reply('Doğrulama sistemi kuruldu!');
    }

    if (subCommand === 'manuel' || subCommand === 'manual') {
      const target = message.mentions.members.first();
      if (!target) {
        return message.reply('Lütfen bir kullanıcı etiketleyin!');
      }

      const guildData = await storage.getGuild(message.guild.id);
      if (!guildData?.verifiedRole) {
        return message.reply('Kayıt sistemi kurulmamış! `!kayıt kur` kullanın.');
      }

      try {
        if (guildData.verificationRole) {
          await target.roles.remove(guildData.verificationRole).catch(() => {});
        }
        await target.roles.add(guildData.verifiedRole);

        const embed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('✅ Kullanıcı Doğrulandı')
          .setDescription(`${target} başarıyla doğrulandı!`)
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      } catch (error) {
        console.error('Doğrulama hatası:', error);
        return message.reply('Kullanıcı doğrulanırken bir hata oluştu!');
      }
    }

    if (subCommand === 'kapat' || subCommand === 'disable') {
      await storage.upsertGuild(message.guild.id, {
        verificationRole: null,
        verifiedRole: null
      });
      return message.reply('Kayıt sistemi kapatıldı!');
    }

    // Durum
    const guildData = await storage.getGuild(message.guild.id);
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('📋 Kayıt Sistemi')
      .addFields(
        { name: 'Doğrulanmamış Rol', value: guildData?.verificationRole ? `<@&${guildData.verificationRole}>` : 'Ayarlanmamış', inline: true },
        { name: 'Doğrulanmış Rol', value: guildData?.verifiedRole ? `<@&${guildData.verifiedRole}>` : 'Ayarlanmamış', inline: true }
      )
      .setDescription('**Komutlar:**\n`!kayıt kur @kayıtsız @üye` - Sistemi kur\n`!kayıt manuel @kullanıcı` - Manuel doğrula\n`!kayıt kapat` - Sistemi kapat')
      .setTimestamp();

    message.reply({ embeds: [embed] });
  }
};
