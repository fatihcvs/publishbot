const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'slowmode',
  aliases: ['yavaşmod', 'yavaş'],
  description: 'Kanal yavaş modunu ayarlar',
  permissions: [PermissionFlagsBits.ManageChannels],
  async execute(message, args, client) {
    const seconds = parseInt(args[0]);
    
    if (args[0] === 'kapat' || args[0] === 'off' || seconds === 0) {
      await message.channel.setRateLimitPerUser(0);
      return message.reply('Yavaş mod kapatıldı.');
    }
    
    if (isNaN(seconds) || seconds < 0 || seconds > 21600) {
      return message.reply('Kullanım: `!slowmode <saniye>` (0-21600)\nKapatmak için: `!slowmode kapat`');
    }
    
    try {
      await message.channel.setRateLimitPerUser(seconds);
      
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🐢 Yavaş Mod Ayarlandı')
        .setDescription(`Kullanıcılar her ${seconds} saniyede bir mesaj gönderebilir.`)
        .setTimestamp();
      
      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      message.reply('Yavaş mod ayarlanırken bir hata oluştu!');
    }
  }
};
