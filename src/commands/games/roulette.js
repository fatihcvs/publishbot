const { EmbedBuilder } = require('discord.js');
const { storage } = require('../../database/storage');

const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

module.exports = {
  name: 'roulette',
  aliases: ['rulet', 'rl'],
  description: 'Rulet oyna!',
  usage: '!roulette <bahis_türü> <miktar>',
  
  async execute(message, args, client) {
    if (args.length < 2) {
      const helpEmbed = new EmbedBuilder()
        .setTitle('🎡 Rulet - Nasıl Oynanır')
        .setColor('#5865F2')
        .setDescription('Rulet masasına hoş geldin!')
        .addFields(
          { name: '🔴 Kırmızı', value: '`!rulet kirmizi 100` (2x)', inline: true },
          { name: '⚫ Siyah', value: '`!rulet siyah 100` (2x)', inline: true },
          { name: '🟢 Yeşil (0)', value: '`!rulet yesil 100` (35x)', inline: true },
          { name: '🔢 Tek', value: '`!rulet tek 100` (2x)', inline: true },
          { name: '🔢 Çift', value: '`!rulet cift 100` (2x)', inline: true },
          { name: '🎯 Sayı', value: '`!rulet 17 100` (35x)', inline: true },
          { name: '📊 1-18', value: '`!rulet alt 100` (2x)', inline: true },
          { name: '📊 19-36', value: '`!rulet ust 100` (2x)', inline: true }
        );
      return message.reply({ embeds: [helpEmbed] });
    }

    const betType = args[0].toLowerCase();
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

    if (actualBet > 100000) {
      return message.reply('Maksimum bahis miktarı **100,000** coin!');
    }

    let betInfo = parseBet(betType);
    if (!betInfo) {
      return message.reply('Geçersiz bahis türü! `!rulet` yazarak seçenekleri gör.');
    }

    await storage.updateUserBalance(message.guild.id, message.author.id, -actualBet);

    const jackpotContribution = Math.floor(actualBet * 0.03);
    await storage.addToJackpot(message.guild.id, jackpotContribution);

    const result = Math.floor(Math.random() * 37);
    const isRed = redNumbers.includes(result);
    const isBlack = blackNumbers.includes(result);
    const color = result === 0 ? '🟢' : (isRed ? '🔴' : '⚫');

    const won = checkWin(betInfo, result, isRed, isBlack);
    const winAmount = won ? Math.floor(actualBet * betInfo.multiplier) : 0;

    if (won) {
      await storage.updateUserBalance(message.guild.id, message.author.id, winAmount);
    }

    const wheelEmoji = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
    const resultDisplay = result < 10 ? wheelEmoji[result] : `${wheelEmoji[Math.floor(result/10)]}${wheelEmoji[result%10]}`;

    const embed = new EmbedBuilder()
      .setTitle('🎡 Rulet')
      .setColor(won ? '#00ff00' : '#ff0000')
      .setDescription(`
# ${color} ${resultDisplay}

**Sonuç: ${result}** ${color === '🟢' ? '(Yeşil)' : (isRed ? '(Kırmızı)' : '(Siyah)')}
      `)
      .addFields(
        { name: '🎯 Bahsin', value: betInfo.display, inline: true },
        { name: '💰 Miktar', value: `${actualBet} coin`, inline: true }
      );

    if (won) {
      embed.addFields(
        { name: '🏆 Kazanç', value: `+${winAmount} coin (${betInfo.multiplier}x)`, inline: true }
      );
      embed.setFooter({ text: `Tebrikler! Net kar: +${winAmount - actualBet} coin` });
    } else {
      embed.addFields(
        { name: '💸 Kayıp', value: `${actualBet} coin`, inline: true }
      );
      embed.setFooter({ text: 'Şansını tekrar dene!' });
    }

    await storage.addGameHistory(
      message.guild.id,
      message.author.id,
      'roulette',
      actualBet,
      winAmount,
      won ? 'win' : 'lose',
      { betType: betInfo.type, result, color: result === 0 ? 'green' : (isRed ? 'red' : 'black') }
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

function parseBet(betType) {
  if (['kirmizi', 'kırmızı', 'red', 'k'].includes(betType)) {
    return { type: 'red', display: '🔴 Kırmızı', multiplier: 2 };
  }
  if (['siyah', 'black', 's'].includes(betType)) {
    return { type: 'black', display: '⚫ Siyah', multiplier: 2 };
  }
  if (['yesil', 'yeşil', 'green', '0', 'y'].includes(betType)) {
    return { type: 'green', display: '🟢 Yeşil (0)', multiplier: 35 };
  }
  if (['tek', 'odd'].includes(betType)) {
    return { type: 'odd', display: '🔢 Tek', multiplier: 2 };
  }
  if (['cift', 'çift', 'even'].includes(betType)) {
    return { type: 'even', display: '🔢 Çift', multiplier: 2 };
  }
  if (['alt', 'low', '1-18'].includes(betType)) {
    return { type: 'low', display: '📊 1-18', multiplier: 2 };
  }
  if (['ust', 'üst', 'high', '19-36'].includes(betType)) {
    return { type: 'high', display: '📊 19-36', multiplier: 2 };
  }
  
  const num = parseInt(betType);
  if (!isNaN(num) && num >= 0 && num <= 36) {
    return { type: 'number', number: num, display: `🎯 Sayı: ${num}`, multiplier: 35 };
  }
  
  return null;
}

function checkWin(betInfo, result, isRed, isBlack) {
  switch (betInfo.type) {
    case 'red': return isRed;
    case 'black': return isBlack;
    case 'green': return result === 0;
    case 'odd': return result !== 0 && result % 2 === 1;
    case 'even': return result !== 0 && result % 2 === 0;
    case 'low': return result >= 1 && result <= 18;
    case 'high': return result >= 19 && result <= 36;
    case 'number': return result === betInfo.number;
    default: return false;
  }
}
