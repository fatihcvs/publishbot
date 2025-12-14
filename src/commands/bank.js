const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'banka',
  aliases: ['bank', 'deposit', 'withdraw', 'yatır', 'çek'],
  description: 'Banka işlemleri - para yatırma ve çekme',
  async execute(message, args, client) {
    const { storage } = require('../database/storage');
    const subCommand = args[0]?.toLowerCase();
    const amount = parseInt(args[1]) || parseInt(args[0]);
    
    let economy = await storage.getUserEconomy(message.guild.id, message.author.id);
    if (!economy) {
      economy = await storage.createUserEconomy(message.guild.id, message.author.id);
    }
    
    const config = await storage.getEconomyConfig(message.guild.id) || {};
    const symbol = config.currencySymbol || '💰';
    
    if (!subCommand || (!isNaN(parseInt(subCommand)) && !args[1])) {
      const embed = new EmbedBuilder()
        .setColor('#3498db')
        .setTitle('🏦 Banka')
        .setDescription('Banka işlemleri için aşağıdaki komutları kullanın.')
        .addFields(
          { name: '💵 Cüzdan', value: `${symbol} ${economy.balance || 0}`, inline: true },
          { name: '🏦 Banka', value: `${symbol} ${economy.bank || 0}`, inline: true },
          { name: '\u200b', value: '\u200b', inline: true },
          { name: 'Para Yatır', value: '`!banka yatır <miktar>`', inline: true },
          { name: 'Para Çek', value: '`!banka çek <miktar>`', inline: true }
        )
        .setTimestamp();
      
      return message.reply({ embeds: [embed] });
    }
    
    if (subCommand === 'yatır' || subCommand === 'deposit' || subCommand === 'yatir') {
      const depositAmount = parseInt(args[1]);
      
      if (!depositAmount || depositAmount <= 0) {
        return message.reply('Geçerli bir miktar girin!');
      }
      
      if (depositAmount > economy.balance) {
        return message.reply(`Yeterli bakiyeniz yok! Cüzdan: ${symbol} ${economy.balance}`);
      }
      
      await storage.updateUserBalance(message.guild.id, message.author.id, -depositAmount, false);
      await storage.updateUserBalance(message.guild.id, message.author.id, depositAmount, true);
      
      const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('🏦 Para Yatırıldı!')
        .setDescription(`${symbol} **${depositAmount}** bankaya yatırıldı.`)
        .addFields(
          { name: 'Yeni Cüzdan', value: `${symbol} ${economy.balance - depositAmount}`, inline: true },
          { name: 'Yeni Banka', value: `${symbol} ${economy.bank + depositAmount}`, inline: true }
        )
        .setTimestamp();
      
      return message.reply({ embeds: [embed] });
    }
    
    if (subCommand === 'çek' || subCommand === 'withdraw' || subCommand === 'cek') {
      const withdrawAmount = parseInt(args[1]);
      
      if (!withdrawAmount || withdrawAmount <= 0) {
        return message.reply('Geçerli bir miktar girin!');
      }
      
      if (withdrawAmount > economy.bank) {
        return message.reply(`Bankada yeterli para yok! Banka: ${symbol} ${economy.bank}`);
      }
      
      await storage.updateUserBalance(message.guild.id, message.author.id, withdrawAmount, false);
      await storage.updateUserBalance(message.guild.id, message.author.id, -withdrawAmount, true);
      
      const embed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('🏦 Para Çekildi!')
        .setDescription(`${symbol} **${withdrawAmount}** bankadan çekildi.`)
        .addFields(
          { name: 'Yeni Cüzdan', value: `${symbol} ${economy.balance + withdrawAmount}`, inline: true },
          { name: 'Yeni Banka', value: `${symbol} ${economy.bank - withdrawAmount}`, inline: true }
        )
        .setTimestamp();
      
      return message.reply({ embeds: [embed] });
    }
    
    return message.reply('Geçersiz komut. Kullanım: `!banka yatır <miktar>` veya `!banka çek <miktar>`');
  }
};
