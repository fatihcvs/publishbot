const { EmbedBuilder } = require('discord.js');
const { storage } = require('../../database/storage');

module.exports = {
  name: 'dice',
  aliases: ['zar', 'roll'],
  description: 'Zar at ve tahmin et!',
  usage: '!dice <alt/ust/sayi> <miktar>',
  
  async execute(message, args, client) {
    if (args.length < 2) {
      return message.reply('Kullanım: `!dice <alt/ust/sayi(1-6)> <miktar>`\n\n**Örnekler:**\n`!dice alt 100` - 1-3 gelirse kazan (2x)\n`!dice ust 100` - 4-6 gelirse kazan (2x)\n`!dice 6 100` - Tam sayı tahmini (6x)');
    }

    const guess = args[0].toLowerCase();
    const betAmount = args[1].toLowerCase() === 'all' || args[1].toLowerCase() === 'hepsi'
      ? 'all'
      : parseInt(args[1]);

    let isNumber = false;
    let targetNumber = 0;
    let isHigh = false;
    let isLow = false;

    if (['1', '2', '3', '4', '5', '6'].includes(guess)) {
      isNumber = true;
      targetNumber = parseInt(guess);
    } else if (['alt', 'low', 'düşük', 'dusuk'].includes(guess)) {
      isLow = true;
    } else if (['üst', 'ust', 'high', 'yüksek', 'yuksek'].includes(guess)) {
      isHigh = true;
    } else {
      return message.reply('Geçersiz tahmin! `alt`, `ust` veya `1-6` arası bir sayı girin.');
    }

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

    const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    const result = Math.floor(Math.random() * 6) + 1;
    const diceEmoji = diceEmojis[result - 1];

    let won = false;
    let multiplier = 0;

    if (isNumber && result === targetNumber) {
      won = true;
      multiplier = 5.5;
    } else if (isLow && result <= 3) {
      won = true;
      multiplier = 1.9;
    } else if (isHigh && result >= 4) {
      won = true;
      multiplier = 1.9;
    }

    const winAmount = won ? Math.floor(actualBet * multiplier) : 0;

    if (won) {
      await storage.updateUserBalance(message.guild.id, message.author.id, winAmount);
    }

    const guessText = isNumber 
      ? `Sayı: ${targetNumber}`
      : (isLow ? 'Alt (1-3)' : 'Üst (4-6)');

    const embed = new EmbedBuilder()
      .setTitle('🎲 Zar Oyunu')
      .setColor(won ? '#00ff00' : '#ff0000')
      .setDescription(`
# ${diceEmoji}

**Sonuç: ${result}**
      `)
      .addFields(
        { name: '🎯 Tahminin', value: guessText, inline: true },
        { name: '💰 Bahis', value: `${actualBet} coin`, inline: true }
      );

    if (won) {
      embed.addFields(
        { name: '🏆 Kazanç', value: `+${winAmount} coin (${multiplier}x)`, inline: true }
      );
      embed.setFooter({ text: `Tebrikler! Net kar: +${winAmount - actualBet} coin` });
    } else {
      embed.addFields(
        { name: '💸 Kayıp', value: `${actualBet} coin`, inline: true }
      );
      embed.setFooter({ text: 'Bir dahaki sefere şansın yaver gitsin!' });
    }

    await storage.addGameHistory(
      message.guild.id,
      message.author.id,
      'dice',
      actualBet,
      winAmount,
      won ? 'win' : 'lose',
      { guess, result }
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
