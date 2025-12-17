const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { storage } = require('../../database/storage');

const activeGames = new Map();

module.exports = {
  name: 'crash',
  aliases: ['roket', 'rocket'],
  description: 'Crash oyunu! Çarpan yükselirken doğru zamanda çık.',
  usage: '!crash <miktar>',
  
  async execute(message, args, client) {
    const gameKey = `${message.guild.id}-${message.author.id}`;
    
    if (activeGames.has(gameKey)) {
      return message.reply('Zaten aktif bir crash oyunun var!');
    }

    const betAmount = parseInt(args[0]) || 50;

    if (betAmount < 10) {
      return message.reply('Minimum bahis miktarı **10** coin!');
    }

    let userEco = await storage.getUserEconomy(message.guild.id, message.author.id);
    if (!userEco) userEco = await storage.createUserEconomy(message.guild.id, message.author.id);

    if (userEco.balance < betAmount) {
      return message.reply(`Yeterli bakiyen yok! Mevcut bakiye: **${userEco.balance}** coin`);
    }

    if (betAmount > 100000) {
      return message.reply('Maksimum bahis miktarı **100,000** coin!');
    }

    await storage.updateUserBalance(message.guild.id, message.author.id, -betAmount);

    const crashPoint = generateCrashPoint();
    
    const game = {
      bet: betAmount,
      multiplier: 1.00,
      crashPoint,
      cashedOut: false,
      crashed: false,
      guildId: message.guild.id,
      userId: message.author.id
    };

    activeGames.set(gameKey, game);

    const embed = createEmbed(game);
    const buttons = createButtons();
    
    const msg = await message.reply({ embeds: [embed], components: [buttons] });

    const interval = setInterval(async () => {
      const currentGame = activeGames.get(gameKey);
      if (!currentGame || currentGame.cashedOut || currentGame.crashed) {
        clearInterval(interval);
        return;
      }

      currentGame.multiplier = Math.round((currentGame.multiplier + 0.05 + Math.random() * 0.1) * 100) / 100;

      if (currentGame.multiplier >= currentGame.crashPoint) {
        currentGame.crashed = true;
        activeGames.delete(gameKey);
        clearInterval(interval);

        const crashEmbed = new EmbedBuilder()
          .setTitle('💥 CRASH!')
          .setColor('#ff0000')
          .setDescription(`
# 💥 ${currentGame.crashPoint.toFixed(2)}x

Roket patladı!
          `)
          .addFields(
            { name: '💸 Kaybedilen', value: `${betAmount} coin`, inline: true },
            { name: '📉 Crash Noktası', value: `${currentGame.crashPoint.toFixed(2)}x`, inline: true }
          )
          .setFooter({ text: 'Bir dahaki sefere daha erken çık!' });

        await storage.addGameHistory(message.guild.id, message.author.id, 'crash', betAmount, 0, 'lose', { crashPoint: currentGame.crashPoint });
        await storage.incrementUserStats(message.guild.id, message.author.id, 'gamesPlayed');
        await storage.incrementUserStats(message.guild.id, message.author.id, 'gamesLost');
        await storage.incrementUserStats(message.guild.id, message.author.id, 'totalLost', betAmount);

        await msg.edit({ embeds: [crashEmbed], components: [] });
        return;
      }

      await msg.edit({ embeds: [createEmbed(currentGame)] }).catch(() => {});
    }, 800);

    const collector = msg.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      time: 60000
    });

    collector.on('collect', async (interaction) => {
      const currentGame = activeGames.get(gameKey);
      if (!currentGame) {
        await interaction.update({ components: [] });
        return;
      }

      if (interaction.customId === 'crash_cashout') {
        currentGame.cashedOut = true;
        activeGames.delete(gameKey);
        clearInterval(interval);

        const winAmount = Math.floor(betAmount * currentGame.multiplier);
        await storage.updateUserBalance(message.guild.id, message.author.id, winAmount);

        const winEmbed = new EmbedBuilder()
          .setTitle('🚀 Cash Out!')
          .setColor('#00ff00')
          .setDescription(`
# 💰 ${currentGame.multiplier.toFixed(2)}x

Başarıyla çıktın!
          `)
          .addFields(
            { name: '💰 Bahis', value: `${betAmount} coin`, inline: true },
            { name: '🏆 Kazanç', value: `+${winAmount} coin`, inline: true },
            { name: '📊 Net Kar', value: `+${winAmount - betAmount} coin`, inline: true }
          )
          .setFooter({ text: `Crash noktası: ${currentGame.crashPoint.toFixed(2)}x` });

        await storage.addGameHistory(message.guild.id, message.author.id, 'crash', betAmount, winAmount, 'win', { 
          cashoutMultiplier: currentGame.multiplier, 
          crashPoint: currentGame.crashPoint 
        });
        await storage.incrementUserStats(message.guild.id, message.author.id, 'gamesPlayed');
        await storage.incrementUserStats(message.guild.id, message.author.id, 'gamesWon');
        await storage.incrementUserStats(message.guild.id, message.author.id, 'totalWon', winAmount);

        await interaction.update({ embeds: [winEmbed], components: [] });
        collector.stop();
      }
    });

    collector.on('end', () => {
      clearInterval(interval);
      if (activeGames.has(gameKey)) {
        activeGames.delete(gameKey);
      }
    });
  }
};

function generateCrashPoint() {
  const e = Math.random();
  if (e < 0.01) return 1.00;
  return Math.max(1.00, Math.floor(100 / (e * 100)) / 100 * (0.95 + Math.random() * 0.1));
}

function createEmbed(game) {
  const progressBar = createProgressBar(game.multiplier);
  
  return new EmbedBuilder()
    .setTitle('🚀 Crash')
    .setColor('#5865F2')
    .setDescription(`
# 📈 ${game.multiplier.toFixed(2)}x

${progressBar}

Çarpan yükseliyor...
    `)
    .addFields(
      { name: '💰 Bahis', value: `${game.bet} coin`, inline: true },
      { name: '💵 Potansiyel', value: `${Math.floor(game.bet * game.multiplier)} coin`, inline: true }
    )
    .setFooter({ text: 'Roket patlamadan önce "Çık" butonuna bas!' });
}

function createProgressBar(multiplier) {
  const filled = Math.min(Math.floor(multiplier * 2), 20);
  const empty = 20 - filled;
  return '🚀' + '▓'.repeat(filled) + '░'.repeat(empty);
}

function createButtons() {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('crash_cashout')
        .setLabel('💰 ÇIK')
        .setStyle(ButtonStyle.Success)
    );
}
