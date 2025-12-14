const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'hoşgeldin',
  aliases: ['welcome', 'hosgeldin'],
  description: 'Hoş geldin mesajı sistemini ayarlar',
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(message, args, client) {
    const { storage } = require('../database/storage');
    const subCommand = args[0]?.toLowerCase();
    
    if (!subCommand) {
      const guildData = await storage.getGuild(message.guild.id);
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('Hoş Geldin Sistemi')
        .addFields(
          { name: 'Kanal', value: guildData?.welcomeChannel ? `<#${guildData.welcomeChannel}>` : 'Ayarlanmamış', inline: true },
          { name: 'Mesaj', value: guildData?.welcomeMessage || 'Varsayılan mesaj', inline: false }
        )
        .setDescription('**Komutlar:**\n`!hoşgeldin kanal #kanal` - Kanal ayarla\n`!hoşgeldin mesaj <mesaj>` - Mesaj ayarla\n`!hoşgeldin kapat` - Sistemi kapat\n`!hoşgeldin test` - Test mesajı gönder\n\n**Değişkenler:**\n`{user}` - Kullanıcı etiketi\n`{username}` - Kullanıcı adı\n`{server}` - Sunucu adı\n`{membercount}` - Üye sayısı')
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
    
    if (subCommand === 'kapat' || subCommand === 'off' || subCommand === 'disable') {
      await storage.upsertGuild(message.guild.id, { welcomeChannel: null, welcomeMessage: null });
      return message.reply('Hoş geldin mesajları kapatıldı.');
    }
    
    if (subCommand === 'kanal' || subCommand === 'channel') {
      const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      if (!channel) {
        return message.reply('Lütfen bir kanal belirtin: `!hoşgeldin kanal #kanal`');
      }
      
      await storage.upsertGuild(message.guild.id, { welcomeChannel: channel.id });
      return message.reply(`Hoş geldin mesajları ${channel} kanalına gönderilecek.`);
    }
    
    if (subCommand === 'mesaj' || subCommand === 'message') {
      const welcomeMessage = args.slice(1).join(' ');
      if (!welcomeMessage) {
        return message.reply('Lütfen bir mesaj belirtin: `!hoşgeldin mesaj Hoş geldin {user}!`\n\nKullanılabilir değişkenler:\n`{user}` - Kullanıcı etiketi\n`{username}` - Kullanıcı adı\n`{server}` - Sunucu adı\n`{membercount}` - Üye sayısı');
      }
      
      await storage.upsertGuild(message.guild.id, { welcomeMessage });
      return message.reply(`Hoş geldin mesajı ayarlandı:\n${welcomeMessage}`);
    }
    
    if (subCommand === 'test') {
      const guildData = await storage.getGuild(message.guild.id);
      if (!guildData?.welcomeChannel) {
        return message.reply('Önce hoş geldin kanalını ayarlayın!');
      }

      const channel = message.guild.channels.cache.get(guildData.welcomeChannel);
      if (!channel) {
        return message.reply('Hoş geldin kanalı bulunamadı!');
      }

      let welcomeText = guildData.welcomeMessage || 'Hoş geldin {user}! Sunucumuz {server}\'a hoş geldin!';
      welcomeText = welcomeText
        .replace(/{user}/g, message.author.toString())
        .replace(/{username}/g, message.author.username)
        .replace(/{server}/g, message.guild.name)
        .replace(/{membercount}/g, message.guild.memberCount);

      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('Hoş Geldin!')
        .setDescription(welcomeText)
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      await channel.send({ embeds: [embed] });
      return message.reply('Test mesajı gönderildi!');
    }

    return message.reply('Geçersiz komut. `!hoşgeldin` yazarak kullanılabilir komutları görün.');
  }
};
