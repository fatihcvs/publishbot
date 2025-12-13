const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'hoşgeldin',
  aliases: ['welcome', 'hosgeldin'],
  description: 'Hoş geldin mesajı sistemini ayarlar',
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(message, args, client) {
    const subCommand = args[0]?.toLowerCase();
    
    if (!client.config[message.guild.id]) {
      client.config[message.guild.id] = {};
    }
    
    if (subCommand === 'kapat' || subCommand === 'off') {
      delete client.config[message.guild.id].welcomeChannel;
      delete client.config[message.guild.id].welcomeMessage;
      client.saveConfig();
      return message.reply('Hoş geldin mesajları kapatıldı.');
    }
    
    if (subCommand === 'kanal') {
      const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      if (!channel) {
        return message.reply('Lütfen bir kanal belirtin: `!hoşgeldin kanal #kanal`');
      }
      
      client.config[message.guild.id].welcomeChannel = channel.id;
      client.saveConfig();
      
      return message.reply(`Hoş geldin mesajları ${channel} kanalına gönderilecek.`);
    }
    
    if (subCommand === 'mesaj') {
      const welcomeMessage = args.slice(1).join(' ');
      if (!welcomeMessage) {
        return message.reply('Lütfen bir mesaj belirtin: `!hoşgeldin mesaj Hoş geldin {user}!`\n\nKullanılabilir değişkenler:\n`{user}` - Kullanıcı etiketi\n`{username}` - Kullanıcı adı\n`{server}` - Sunucu adı\n`{membercount}` - Üye sayısı');
      }
      
      client.config[message.guild.id].welcomeMessage = welcomeMessage;
      client.saveConfig();
      
      return message.reply(`Hoş geldin mesajı ayarlandı:\n${welcomeMessage}`);
    }
    
    const currentChannel = client.config[message.guild.id].welcomeChannel;
    const currentMessage = client.config[message.guild.id].welcomeMessage;
    
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Hoş Geldin Sistemi')
      .setDescription('Aşağıdaki komutlarla hoş geldin sistemini yapılandırabilirsiniz.')
      .addFields(
        { name: 'Kanal Ayarla', value: '`!hoşgeldin kanal #kanal`', inline: false },
        { name: 'Mesaj Ayarla', value: '`!hoşgeldin mesaj Mesajınız`', inline: false },
        { name: 'Kapat', value: '`!hoşgeldin kapat`', inline: false },
        { name: 'Mevcut Kanal', value: currentChannel ? `<#${currentChannel}>` : 'Ayarlanmadı', inline: true },
        { name: 'Mevcut Mesaj', value: currentMessage || 'Ayarlanmadı', inline: true }
      )
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};
