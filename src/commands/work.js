const { EmbedBuilder } = require('discord.js');

const jobs = [
  { name: 'Programcı', emoji: '💻', message: 'Kod yazarak' },
  { name: 'Şef', emoji: '👨‍🍳', message: 'Yemek yaparak' },
  { name: 'Doktor', emoji: '👨‍⚕️', message: 'Hastaları tedavi ederek' },
  { name: 'Öğretmen', emoji: '👨‍🏫', message: 'Öğrencilere ders vererek' },
  { name: 'Mühendis', emoji: '👷', message: 'Proje geliştirerek' },
  { name: 'Sanatçı', emoji: '🎨', message: 'Resim çizerek' },
  { name: 'Müzisyen', emoji: '🎵', message: 'Müzik yaparak' },
  { name: 'Youtuber', emoji: '📺', message: 'Video çekerek' },
  { name: 'Streamer', emoji: '🎮', message: 'Yayın yaparak' },
  { name: 'Fotoğrafçı', emoji: '📷', message: 'Fotoğraf çekerek' }
];

module.exports = {
  name: 'çalış',
  aliases: ['work', 'calis', 'iş'],
  description: 'Çalışarak para kazanın',
  async execute(message, args, client) {
    const { storage } = require('../database/storage');
    
    let economy = await storage.getUserEconomy(message.guild.id, message.author.id);
    if (!economy) {
      economy = await storage.createUserEconomy(message.guild.id, message.author.id);
    }
    
    const config = await storage.getEconomyConfig(message.guild.id) || {};
    const minAmount = config.workMinAmount || 50;
    const maxAmount = config.workMaxAmount || 200;
    const symbol = config.currencySymbol || '💰';
    
    const now = new Date();
    const lastWork = economy.lastWork ? new Date(economy.lastWork) : null;
    
    if (lastWork) {
      const diff = now - lastWork;
      const minutes = diff / (1000 * 60);
      
      if (minutes < 30) {
        const remaining = 30 - minutes;
        const minutesLeft = Math.floor(remaining);
        const secondsLeft = Math.floor((remaining - minutesLeft) * 60);
        
        return message.reply(`Biraz dinlenmelisiniz! **${minutesLeft} dakika ${secondsLeft} saniye** sonra tekrar çalışabilirsiniz.`);
      }
    }
    
    const amount = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;
    const job = jobs[Math.floor(Math.random() * jobs.length)];
    
    await storage.updateUserBalance(message.guild.id, message.author.id, amount, false);
    
    const { db } = require('../database/db');
    const { userEconomy } = require('../../shared/schema');
    const { eq, and } = require('drizzle-orm');
    
    await db.update(userEconomy).set({ lastWork: now }).where(
      and(eq(userEconomy.guildId, message.guild.id), eq(userEconomy.userId, message.author.id))
    );
    
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle(`${job.emoji} ${job.name} olarak çalıştınız!`)
      .setDescription(`${job.message} ${symbol} **${amount}** kazandınız!`)
      .addFields(
        { name: 'Yeni Bakiye', value: `${symbol} ${(economy.balance || 0) + amount}`, inline: true }
      )
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};
