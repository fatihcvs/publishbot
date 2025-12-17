const { EmbedBuilder } = require('discord.js');
const { storage } = require('../../database/storage');

module.exports = {
  name: 'coinflip',
  aliases: ['cf', 'yazıtura', 'yazitura'],
  description: 'Yazı tura oyna ve para kazan!',
  usage: '!coinflip <yazi/tura> <miktar>',
  
  async execute(message, args, client) {
    if (args.length < 2) {
      return message.reply('Kullanım: `!coinflip <yazi/tura> <miktar>`\nÖrnek: `!coinflip yazi 100`');
    }

    const choice = args[0].toLowerCase();
    if (!['yazi', 'yazı', 'tura', 'heads', 'tails', 'y', 't'].includes(choice)) {
      return message.reply('Lütfen `yazi` veya `tura` seçin!');
    }

    const isHeads = ['yazi', 'yazı', 'heads', 'y'].includes(choice);
    const betAmount = args[1].toLowerCase() === 'all' || args[1].toLowerCase() === 'hepsi' 
      ? 'all' 
      : parseInt(args[1]);

    if (betAmount !== 'all' && (isNaN(betAmount) || betAmount < 10)) {
      return message.reply('Minimum bahis miktarı **10** coin!');
    }

    let userEco = await storage.getUserEconomy(message.guild.id, message.author.id);
    if (!userEco) userEco = await storage.createUserEconomy(message.guild.id, message.author.id);

    const actualBet = betAmount === 'all' ? userEco.balance : betAmount;

    if (actualBet <= 0 || userEco.balance < actualBet) {
      return message.reply(`Yeterli bakiyen yok! Mevcut bakiye: **${userEco.balance}** coin`);
    }

    if (actualBet > 50000) {
      return message.reply('Maksimum bahis miktarı **50,000** coin!');
    }

    await storage.updateUserBalance(message.guild.id, message.author.id, -actualBet);

    const jackpotContribution = Math.floor(actualBet * 0.02);
    await storage.addToJackpot(message.guild.id, jackpotContribution);

    const result = Math.random() < 0.5;
    const won = (isHeads && result) || (!isHeads && !result);
    const resultText = result ? '🪙 Yazı' : '⭕ Tura';

    let winAmount = 0;
    let embed;

    if (won) {
      winAmount = Math.floor(actualBet * 1.95);
      await storage.updateUserBalance(message.guild.id, message.author.id, winAmount);
      
      embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('🎰 Coinflip - Kazandın!')
        .setDescription(`Sonuç: **${resultText}**`)
        .addFields(
          { name: '💰 Bahis', value: `${actualBet} coin`, inline: true },
          { name: '🏆 Kazanç', value: `+${winAmount} coin`, inline: true },
          { name: '📊 Net Kar', value: `+${winAmount - actualBet} coin`, inline: true }
        )
        .setFooter({ text: `${message.author.username} • Jackpot'a %2 katkı yapıldı` });
    } else {
      embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('🎰 Coinflip - Kaybettin!')
        .setDescription(`Sonuç: **${resultText}**`)
        .addFields(
          { name: '💸 Kaybedilen', value: `${actualBet} coin`, inline: true },
          { name: '🎯 Seçimin', value: isHeads ? 'Yazı' : 'Tura', inline: true }
        )
        .setFooter({ text: `${message.author.username} • Bir dahaki sefere!` });
    }

    await storage.addGameHistory(
      message.guild.id, 
      message.author.id, 
      'coinflip', 
      actualBet, 
      winAmount, 
      won ? 'win' : 'lose',
      { choice: isHeads ? 'heads' : 'tails', result: result ? 'heads' : 'tails' }
    );

    await storage.incrementUserStats(message.guild.id, message.author.id, 'gamesPlayed');
    if (won) {
      await storage.incrementUserStats(message.guild.id, message.author.id, 'gamesWon');
      await storage.incrementUserStats(message.guild.id, message.author.id, 'totalWon', winAmount);
    } else {
      await storage.incrementUserStats(message.guild.id, message.author.id, 'gamesLost');
      await storage.incrementUserStats(message.guild.id, message.author.id, 'totalLost', actualBet);
    }

    message.reply({ embeds: [embed] });
  }
};
