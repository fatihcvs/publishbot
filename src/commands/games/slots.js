const { EmbedBuilder } = require('discord.js');
const { storage } = require('../../database/storage');

module.exports = {
  name: 'slots',
  aliases: ['slot', 'jackpot', 'kumar'],
  description: 'Slot makinesi oyna!',
  usage: '!slots <miktar>',
  
  async execute(message, args, client) {
    const betAmount = args[0]?.toLowerCase() === 'all' || args[0]?.toLowerCase() === 'hepsi'
      ? 'all'
      : parseInt(args[0]) || 50;

    let userEco = await storage.getUserEconomy(message.guild.id, message.author.id);
    if (!userEco) userEco = await storage.createUserEconomy(message.guild.id, message.author.id);

    const actualBet = betAmount === 'all' ? userEco.balance : betAmount;

    if (actualBet < 10) {
      return message.reply('Minimum bahis miktarı **10** coin!');
    }

    if (userEco.balance < actualBet) {
      return message.reply(`Yeterli bakiyen yok! Mevcut bakiye: **${userEco.balance}** coin`);
    }

    if (actualBet > 100000) {
      return message.reply('Maksimum bahis miktarı **100,000** coin!');
    }

    await storage.updateUserBalance(message.guild.id, message.author.id, -actualBet);

    const jackpotContribution = Math.floor(actualBet * 0.05);
    await storage.addToJackpot(message.guild.id, jackpotContribution);

    const symbols = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣', '🎰', '⭐'];
    const weights = [25, 20, 18, 15, 10, 7, 3, 2];
    
    function getRandomSymbol() {
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let random = Math.random() * totalWeight;
      for (let i = 0; i < symbols.length; i++) {
        random -= weights[i];
        if (random <= 0) return symbols[i];
      }
      return symbols[0];
    }

    const reels = [
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]
    ];

    const middleRow = [reels[0][1], reels[1][1], reels[2][1]];
    
    const multipliers = {
      '🍒': 2,
      '🍋': 2.5,
      '🍊': 3,
      '🍇': 4,
      '💎': 10,
      '7️⃣': 25,
      '🎰': 50,
      '⭐': 100
    };

    let winAmount = 0;
    let winType = '';

    if (middleRow[0] === middleRow[1] && middleRow[1] === middleRow[2]) {
      const symbol = middleRow[0];
      const multiplier = multipliers[symbol] || 2;
      winAmount = Math.floor(actualBet * multiplier);
      winType = `3x ${symbol} - ${multiplier}x çarpan!`;

      if (symbol === '🎰') {
        const jackpot = await storage.claimJackpot(message.guild.id, message.author.id);
        if (jackpot) {
          winAmount += jackpot;
          winType += ` + 🎉 JACKPOT: ${jackpot} coin!`;
        }
      }
    } else if (middleRow[0] === middleRow[1] || middleRow[1] === middleRow[2]) {
      winAmount = Math.floor(actualBet * 1.5);
      winType = '2 eşleşme - 1.5x';
    }

    if (winAmount > 0) {
      await storage.updateUserBalance(message.guild.id, message.author.id, winAmount);
    }

    const slotDisplay = `
┏━━━━━━━━━━━━━━━┓
┃ ${reels[0][0]} │ ${reels[1][0]} │ ${reels[2][0]} ┃
┃───┼───┼───┃
┃ ${reels[0][1]} │ ${reels[1][1]} │ ${reels[2][1]} ┃ ◀
┃───┼───┼───┃
┃ ${reels[0][2]} │ ${reels[1][2]} │ ${reels[2][2]} ┃
┗━━━━━━━━━━━━━━━┛`;

    const embed = new EmbedBuilder()
      .setTitle('🎰 Slot Makinesi')
      .setDescription('```' + slotDisplay + '```')
      .setColor(winAmount > 0 ? '#00ff00' : '#ff0000');

    if (winAmount > 0) {
      embed.addFields(
        { name: '🎯 Sonuç', value: winType, inline: false },
        { name: '💰 Bahis', value: `${actualBet} coin`, inline: true },
        { name: '🏆 Kazanç', value: `+${winAmount} coin`, inline: true },
        { name: '📊 Net', value: `+${winAmount - actualBet} coin`, inline: true }
      );
    } else {
      embed.addFields(
        { name: '💸 Kaybedilen', value: `${actualBet} coin`, inline: true }
      );
    }

    const jackpotInfo = await storage.getJackpot(message.guild.id);
    if (jackpotInfo) {
      embed.setFooter({ text: `🎰 Jackpot Havuzu: ${jackpotInfo.amount} coin` });
    }

    await storage.addGameHistory(
      message.guild.id,
      message.author.id,
      'slots',
      actualBet,
      winAmount,
      winAmount > 0 ? 'win' : 'lose',
      { symbols: middleRow }
    );

    await storage.incrementUserStats(message.guild.id, message.author.id, 'gamesPlayed');
    if (winAmount > 0) {
      await storage.incrementUserStats(message.guild.id, message.author.id, 'gamesWon');
      await storage.incrementUserStats(message.guild.id, message.author.id, 'totalWon', winAmount);
      const stats = await storage.getUserStats(message.guild.id, message.author.id);
      if (winAmount > (stats?.biggestWin || 0)) {
        await storage.updateUserStats(message.guild.id, message.author.id, { biggestWin: winAmount });
      }
    } else {
      await storage.incrementUserStats(message.guild.id, message.author.id, 'gamesLost');
      await storage.incrementUserStats(message.guild.id, message.author.id, 'totalLost', actualBet);
    }

    message.reply({ embeds: [embed] });
  }
};
