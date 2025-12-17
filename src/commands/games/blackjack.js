const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { storage } = require('../../database/storage');

const activeGames = new Map();

const cards = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const suits = ['♠', '♥', '♦', '♣'];

function createDeck() {
  const deck = [];
  for (const suit of suits) {
    for (const card of cards) {
      deck.push({ card, suit });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
}

function getCardValue(card) {
  if (['J', 'Q', 'K'].includes(card)) return 10;
  if (card === 'A') return 11;
  return parseInt(card);
}

function calculateHand(hand) {
  let value = 0;
  let aces = 0;
  
  for (const c of hand) {
    value += getCardValue(c.card);
    if (c.card === 'A') aces++;
  }
  
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }
  
  return value;
}

function formatHand(hand, hideSecond = false) {
  if (hideSecond && hand.length >= 2) {
    return `${hand[0].card}${hand[0].suit} 🂠`;
  }
  return hand.map(c => `${c.card}${c.suit}`).join(' ');
}

function createGameEmbed(game, showDealer = false) {
  const playerValue = calculateHand(game.playerHand);
  const dealerValue = calculateHand(game.dealerHand);
  
  const embed = new EmbedBuilder()
    .setTitle('🃏 Blackjack')
    .setColor('#2f3136')
    .addFields(
      { 
        name: '🎰 Krupiye', 
        value: `${formatHand(game.dealerHand, !showDealer)}\n${showDealer ? `Değer: ${dealerValue}` : 'Değer: ?'}`,
        inline: false 
      },
      { 
        name: '🎮 Senin Elin', 
        value: `${formatHand(game.playerHand)}\nDeğer: ${playerValue}`,
        inline: false 
      },
      { name: '💰 Bahis', value: `${game.bet} coin`, inline: true }
    );
  
  return embed;
}

function createButtons(disabled = false) {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('bj_hit')
        .setLabel('Kart Çek')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🃏')
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId('bj_stand')
        .setLabel('Dur')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('✋')
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId('bj_double')
        .setLabel('Double')
        .setStyle(ButtonStyle.Success)
        .setEmoji('💰')
        .setDisabled(disabled)
    );
}

module.exports = {
  name: 'blackjack',
  aliases: ['bj', '21'],
  description: 'Blackjack oyna!',
  usage: '!blackjack <miktar>',
  
  async execute(message, args, client) {
    const gameKey = `${message.guild.id}-${message.author.id}`;
    
    if (activeGames.has(gameKey)) {
      return message.reply('Zaten aktif bir blackjack oyunun var!');
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

    if (betAmount > 50000) {
      return message.reply('Maksimum bahis miktarı **50,000** coin!');
    }

    await storage.updateUserBalance(message.guild.id, message.author.id, -betAmount);

    const deck = createDeck();
    const playerHand = [deck.pop(), deck.pop()];
    const dealerHand = [deck.pop(), deck.pop()];

    const game = {
      deck,
      playerHand,
      dealerHand,
      bet: betAmount,
      doubled: false,
      guildId: message.guild.id,
      userId: message.author.id
    };

    activeGames.set(gameKey, game);

    const playerValue = calculateHand(playerHand);
    
    if (playerValue === 21) {
      activeGames.delete(gameKey);
      const winAmount = Math.floor(betAmount * 2.5);
      await storage.updateUserBalance(message.guild.id, message.author.id, winAmount);
      
      const embed = createGameEmbed(game, true)
        .setColor('#ffd700')
        .setTitle('🃏 Blackjack - BLACKJACK!')
        .addFields({ name: '🎉 Sonuç', value: `BLACKJACK! +${winAmount} coin kazandın!`, inline: false });
      
      await storage.addGameHistory(message.guild.id, message.author.id, 'blackjack', betAmount, winAmount, 'blackjack');
      await storage.incrementUserStats(message.guild.id, message.author.id, 'gamesPlayed');
      await storage.incrementUserStats(message.guild.id, message.author.id, 'gamesWon');
      await storage.incrementUserStats(message.guild.id, message.author.id, 'totalWon', winAmount);
      
      return message.reply({ embeds: [embed] });
    }

    const embed = createGameEmbed(game);
    const buttons = createButtons(userEco.balance < betAmount);
    
    const msg = await message.reply({ embeds: [embed], components: [buttons] });

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

      if (interaction.customId === 'bj_hit') {
        currentGame.playerHand.push(currentGame.deck.pop());
        const playerValue = calculateHand(currentGame.playerHand);
        
        if (playerValue > 21) {
          activeGames.delete(gameKey);
          const embed = createGameEmbed(currentGame, true)
            .setColor('#ff0000')
            .setTitle('🃏 Blackjack - BUST!')
            .addFields({ name: '💥 Sonuç', value: `Bust! ${currentGame.bet} coin kaybettin.`, inline: false });
          
          await storage.addGameHistory(message.guild.id, message.author.id, 'blackjack', currentGame.bet, 0, 'lose');
          await storage.incrementUserStats(message.guild.id, message.author.id, 'gamesPlayed');
          await storage.incrementUserStats(message.guild.id, message.author.id, 'gamesLost');
          await storage.incrementUserStats(message.guild.id, message.author.id, 'totalLost', currentGame.bet);
          
          await interaction.update({ embeds: [embed], components: [] });
          collector.stop();
          return;
        }
        
        await interaction.update({ embeds: [createGameEmbed(currentGame)], components: [createButtons()] });
      }
      
      else if (interaction.customId === 'bj_stand') {
        await finishGame(interaction, currentGame, gameKey, message);
        collector.stop();
      }
      
      else if (interaction.customId === 'bj_double') {
        const userEco = await storage.getUserEconomy(message.guild.id, message.author.id);
        if (userEco.balance < currentGame.bet) {
          await interaction.reply({ content: 'Double için yeterli bakiyen yok!', ephemeral: true });
          return;
        }
        
        await storage.updateUserBalance(message.guild.id, message.author.id, -currentGame.bet);
        currentGame.bet *= 2;
        currentGame.doubled = true;
        currentGame.playerHand.push(currentGame.deck.pop());
        
        const playerValue = calculateHand(currentGame.playerHand);
        
        if (playerValue > 21) {
          activeGames.delete(gameKey);
          const embed = createGameEmbed(currentGame, true)
            .setColor('#ff0000')
            .setTitle('🃏 Blackjack - BUST!')
            .addFields({ name: '💥 Sonuç', value: `Double Bust! ${currentGame.bet} coin kaybettin.`, inline: false });
          
          await storage.addGameHistory(message.guild.id, message.author.id, 'blackjack', currentGame.bet, 0, 'lose');
          await storage.incrementUserStats(message.guild.id, message.author.id, 'gamesPlayed');
          await storage.incrementUserStats(message.guild.id, message.author.id, 'gamesLost');
          await storage.incrementUserStats(message.guild.id, message.author.id, 'totalLost', currentGame.bet);
          
          await interaction.update({ embeds: [embed], components: [] });
          collector.stop();
          return;
        }
        
        await finishGame(interaction, currentGame, gameKey, message);
        collector.stop();
      }
    });

    collector.on('end', (collected, reason) => {
      if (reason === 'time' && activeGames.has(gameKey)) {
        activeGames.delete(gameKey);
        msg.edit({ components: [] }).catch(() => {});
      }
    });
  }
};

async function finishGame(interaction, game, gameKey, message) {
  activeGames.delete(gameKey);
  
  while (calculateHand(game.dealerHand) < 17) {
    game.dealerHand.push(game.deck.pop());
  }
  
  const playerValue = calculateHand(game.playerHand);
  const dealerValue = calculateHand(game.dealerHand);
  
  let result, color, winAmount = 0;
  
  if (dealerValue > 21) {
    result = `Krupiye bust! +${game.bet * 2} coin kazandın!`;
    color = '#00ff00';
    winAmount = game.bet * 2;
  } else if (playerValue > dealerValue) {
    result = `Kazandın! +${game.bet * 2} coin`;
    color = '#00ff00';
    winAmount = game.bet * 2;
  } else if (playerValue < dealerValue) {
    result = `Kaybettin! -${game.bet} coin`;
    color = '#ff0000';
  } else {
    result = `Berabere! Bahis iade edildi.`;
    color = '#ffff00';
    winAmount = game.bet;
  }
  
  if (winAmount > 0) {
    await storage.updateUserBalance(message.guild.id, message.author.id, winAmount);
  }
  
  const embed = createGameEmbed(game, true)
    .setColor(color)
    .setTitle('🃏 Blackjack - Oyun Bitti')
    .addFields({ name: '🎯 Sonuç', value: result, inline: false });
  
  const gameResult = winAmount > game.bet ? 'win' : (winAmount === game.bet ? 'tie' : 'lose');
  await storage.addGameHistory(message.guild.id, message.author.id, 'blackjack', game.bet, winAmount, gameResult);
  await storage.incrementUserStats(message.guild.id, message.author.id, 'gamesPlayed');
  
  if (winAmount > game.bet) {
    await storage.incrementUserStats(message.guild.id, message.author.id, 'gamesWon');
    await storage.incrementUserStats(message.guild.id, message.author.id, 'totalWon', winAmount);
  } else if (winAmount < game.bet) {
    await storage.incrementUserStats(message.guild.id, message.author.id, 'gamesLost');
    await storage.incrementUserStats(message.guild.id, message.author.id, 'totalLost', game.bet);
  }
  
  await interaction.update({ embeds: [embed], components: [] });
}
