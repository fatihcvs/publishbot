const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'günlük',
  aliases: ['daily', 'gunluk'],
  description: 'Günlük ödülünüzü alın',
  async execute(message, args, client) {
    const { storage } = require('../database/storage');
    
    let economy = await storage.getUserEconomy(message.guild.id, message.author.id);
    if (!economy) {
      economy = await storage.createUserEconomy(message.guild.id, message.author.id);
    }
    
    const config = await storage.getEconomyConfig(message.guild.id) || {};
    const dailyAmount = config.dailyAmount || 100;
    const symbol = config.currencySymbol || '💰';
    
    const now = new Date();
    const lastDaily = economy.lastDaily ? new Date(economy.lastDaily) : null;
    
    if (lastDaily) {
      const diff = now - lastDaily;
      const hours = diff / (1000 * 60 * 60);
      
      if (hours < 24) {
        const remaining = 24 - hours;
        const hoursLeft = Math.floor(remaining);
        const minutesLeft = Math.floor((remaining - hoursLeft) * 60);
        
        return message.reply(`Günlük ödülünüzü zaten aldınız! **${hoursLeft} saat ${minutesLeft} dakika** sonra tekrar alabilirsiniz.`);
      }
    }
    
    await storage.updateUserBalance(message.guild.id, message.author.id, dailyAmount, false);
    
    const { db } = require('../database/db');
    const { userEconomy } = require('../../shared/schema');
    const { eq, and } = require('drizzle-orm');
    
    await db.update(userEconomy).set({ lastDaily: now }).where(
      and(eq(userEconomy.guildId, message.guild.id), eq(userEconomy.userId, message.author.id))
    );
    
    const embed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle('💰 Günlük Ödül!')
      .setDescription(`${symbol} **${dailyAmount}** günlük ödülünüzü aldınız!`)
      .addFields(
        { name: 'Yeni Bakiye', value: `${symbol} ${(economy.balance || 0) + dailyAmount}`, inline: true }
      )
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};
