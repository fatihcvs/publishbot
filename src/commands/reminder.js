const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'hatırlat',
  aliases: ['remind', 'remindme', 'hatirlatici'],
  description: 'Hatırlatıcı oluşturur',
  async execute(message, args, client) {
    const { storage } = require('../database/storage');
    
    if (args.length < 2) {
      return message.reply('Kullanım: `!hatırlat <süre> <mesaj>`\nÖrnek: `!hatırlat 30d Toplantı` veya `!hatırlat 2h Ara ver`\nBirimler: s (saniye), m (dakika), h (saat), d (gün)');
    }
    
    const timeArg = args[0];
    const reminderMessage = args.slice(1).join(' ');
    
    const timeMatch = timeArg.match(/^(\d+)([smhd])$/i);
    if (!timeMatch) {
      return message.reply('Geçersiz süre formatı! Örnek: 30s, 5m, 2h, 1d');
    }
    
    const amount = parseInt(timeMatch[1]);
    const unit = timeMatch[2].toLowerCase();
    
    let ms;
    switch (unit) {
      case 's': ms = amount * 1000; break;
      case 'm': ms = amount * 60 * 1000; break;
      case 'h': ms = amount * 60 * 60 * 1000; break;
      case 'd': ms = amount * 24 * 60 * 60 * 1000; break;
    }
    
    if (ms > 30 * 24 * 60 * 60 * 1000) {
      return message.reply('Maksimum hatırlatıcı süresi 30 gündür!');
    }
    
    const remindAt = new Date(Date.now() + ms);
    
    await storage.addReminder(message.author.id, message.channel.id, message.guild.id, reminderMessage, remindAt);
    
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('⏰ Hatırlatıcı Oluşturuldu')
      .addFields(
        { name: 'Mesaj', value: reminderMessage },
        { name: 'Zaman', value: `<t:${Math.floor(remindAt.getTime() / 1000)}:R>` }
      )
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};
