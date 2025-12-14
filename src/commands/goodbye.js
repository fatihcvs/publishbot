const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'hoşçakal',
  aliases: ['goodbye', 'hoscakal', 'ayrilma'],
  description: 'Hoşçakal mesajı sistemini ayarlar',
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(message, args, client) {
    const { storage } = require('../database/storage');
    const subCommand = args[0]?.toLowerCase();

    if (!subCommand) {
      const guildData = await storage.getGuild(message.guild.id);
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('Hoşçakal Sistemi')
        .addFields(
          { name: 'Kanal', value: guildData?.goodbyeChannel ? `<#${guildData.goodbyeChannel}>` : 'Ayarlanmamış', inline: true },
          { name: 'Mesaj', value: guildData?.goodbyeMessage || 'Varsayılan mesaj', inline: false }
        )
        .setDescription('**Komutlar:**\n`!hoşçakal kanal #kanal` - Kanal ayarla\n`!hoşçakal mesaj <mesaj>` - Mesaj ayarla\n`!hoşçakal kapat` - Sistemi kapat\n\n**Değişkenler:**\n`{user}` - Kullanıcı adı\n`{server}` - Sunucu adı\n`{membercount}` - Üye sayısı')
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (subCommand === 'kanal' || subCommand === 'channel') {
      const channel = message.mentions.channels.first();
      if (!channel) {
        return message.reply('Lütfen bir kanal etiketleyin!');
      }

      await storage.upsertGuild(message.guild.id, { goodbyeChannel: channel.id });
      return message.reply(`Hoşçakal kanalı ${channel} olarak ayarlandı!`);
    }

    if (subCommand === 'mesaj' || subCommand === 'message') {
      const goodbyeMessage = args.slice(1).join(' ');
      if (!goodbyeMessage) {
        return message.reply('Lütfen bir mesaj girin!');
      }

      await storage.upsertGuild(message.guild.id, { goodbyeMessage });
      return message.reply('Hoşçakal mesajı güncellendi!');
    }

    if (subCommand === 'kapat' || subCommand === 'disable') {
      await storage.upsertGuild(message.guild.id, { goodbyeChannel: null, goodbyeMessage: null });
      return message.reply('Hoşçakal sistemi kapatıldı!');
    }

    if (subCommand === 'test') {
      const guildData = await storage.getGuild(message.guild.id);
      if (!guildData?.goodbyeChannel) {
        return message.reply('Önce hoşçakal kanalını ayarlayın!');
      }

      const channel = message.guild.channels.cache.get(guildData.goodbyeChannel);
      if (!channel) {
        return message.reply('Hoşçakal kanalı bulunamadı!');
      }

      let goodbyeText = guildData.goodbyeMessage || '**{user}** sunucudan ayrıldı. Görüşmek üzere!';
      goodbyeText = goodbyeText
        .replace(/{user}/g, message.author.username)
        .replace(/{server}/g, message.guild.name)
        .replace(/{membercount}/g, message.guild.memberCount);

      const embed = new EmbedBuilder()
        .setColor('#ff6b6b')
        .setTitle('👋 Güle Güle!')
        .setDescription(goodbyeText)
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      await channel.send({ embeds: [embed] });
      return message.reply('Test mesajı gönderildi!');
    }
  }
};
