const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { storage } = require('../../database/storage');

const choices = {
  rock: { emoji: '🪨', name: 'Taş', beats: 'scissors' },
  paper: { emoji: '📄', name: 'Kağıt', beats: 'rock' },
  scissors: { emoji: '✂️', name: 'Makas', beats: 'paper' }
};

module.exports = {
  name: 'rps',
  aliases: ['tkmvs', 'taskagitmakas', 'taşkağıtmakas'],
  description: 'Taş Kağıt Makas oyna!',
  usage: '!rps [miktar] veya !rps @kullanici [miktar]',
  
  async execute(message, args, client) {
    const opponent = message.mentions.users.first();
    const betAmount = parseInt(args[opponent ? 1 : 0]) || 0;

    if (betAmount > 0) {
      let userEco = await storage.getUserEconomy(message.guild.id, message.author.id);
      if (!userEco) userEco = await storage.createUserEconomy(message.guild.id, message.author.id);

      if (userEco.balance < betAmount) {
        return message.reply(`Yeterli bakiyen yok! Mevcut bakiye: **${userEco.balance}** coin`);
      }

      if (betAmount > 25000) {
        return message.reply('Maksimum bahis miktarı **25,000** coin!');
      }
    }

    if (opponent && !opponent.bot && opponent.id !== message.author.id) {
      await playPvP(message, opponent, betAmount, client);
    } else {
      await playVsBot(message, betAmount);
    }
  }
};

async function playVsBot(message, betAmount) {
  if (betAmount > 0) {
    await storage.updateUserBalance(message.guild.id, message.author.id, -betAmount);
  }

  const embed = new EmbedBuilder()
    .setTitle('✂️ Taş Kağıt Makas')
    .setColor('#5865F2')
    .setDescription('Seçimini yap!')
    .addFields(
      { name: '💰 Bahis', value: betAmount > 0 ? `${betAmount} coin` : 'Eğlence modu', inline: true }
    );

  const buttons = createChoiceButtons();
  const msg = await message.reply({ embeds: [embed], components: [buttons] });

  const collector = msg.createMessageComponentCollector({
    filter: i => i.user.id === message.author.id,
    time: 30000,
    max: 1
  });

  collector.on('collect', async (interaction) => {
    const playerChoice = interaction.customId.replace('rps_', '');
    const botChoice = Object.keys(choices)[Math.floor(Math.random() * 3)];
    
    let result, color, winAmount = 0;
    
    if (playerChoice === botChoice) {
      result = 'Berabere!';
      color = '#ffff00';
      if (betAmount > 0) {
        await storage.updateUserBalance(message.guild.id, message.author.id, betAmount);
        winAmount = betAmount;
      }
    } else if (choices[playerChoice].beats === botChoice) {
      result = 'Kazandın!';
      color = '#00ff00';
      if (betAmount > 0) {
        winAmount = Math.floor(betAmount * 1.9);
        await storage.updateUserBalance(message.guild.id, message.author.id, winAmount);
      }
    } else {
      result = 'Kaybettin!';
      color = '#ff0000';
    }

    const resultEmbed = new EmbedBuilder()
      .setTitle('✂️ Taş Kağıt Makas - Sonuç')
      .setColor(color)
      .setDescription(`
**Sen:** ${choices[playerChoice].emoji} ${choices[playerChoice].name}
**Bot:** ${choices[botChoice].emoji} ${choices[botChoice].name}

# ${result}
      `)
      .addFields(
        { name: '💰 Sonuç', value: winAmount > betAmount ? `+${winAmount - betAmount} coin` : (winAmount === betAmount ? 'İade' : `-${betAmount} coin`), inline: true }
      );

    if (betAmount > 0) {
      await storage.addGameHistory(
        message.guild.id,
        message.author.id,
        'rps',
        betAmount,
        winAmount,
        result === 'Kazandın!' ? 'win' : (result === 'Berabere!' ? 'tie' : 'lose')
      );
      await storage.incrementUserStats(message.guild.id, message.author.id, 'gamesPlayed');
      if (result === 'Kazandın!') {
        await storage.incrementUserStats(message.guild.id, message.author.id, 'gamesWon');
        await storage.incrementUserStats(message.guild.id, message.author.id, 'totalWon', winAmount);
      } else if (result === 'Kaybettin!') {
        await storage.incrementUserStats(message.guild.id, message.author.id, 'gamesLost');
        await storage.incrementUserStats(message.guild.id, message.author.id, 'totalLost', betAmount);
      }
    }

    await interaction.update({ embeds: [resultEmbed], components: [] });
  });

  collector.on('end', (collected, reason) => {
    if (reason === 'time' && collected.size === 0) {
      if (betAmount > 0) {
        storage.updateUserBalance(message.guild.id, message.author.id, betAmount);
      }
      msg.edit({ content: 'Süre doldu! Bahis iade edildi.', components: [] }).catch(() => {});
    }
  });
}

async function playPvP(message, opponent, betAmount, client) {
  if (betAmount > 0) {
    let opponentEco = await storage.getUserEconomy(message.guild.id, opponent.id);
    if (!opponentEco) opponentEco = await storage.createUserEconomy(message.guild.id, opponent.id);

    if (opponentEco.balance < betAmount) {
      return message.reply(`${opponent.username}'in yeterli bakiyesi yok!`);
    }
  }

  const playerChoices = {};

  const embed = new EmbedBuilder()
    .setTitle('✂️ Taş Kağıt Makas - PvP')
    .setColor('#5865F2')
    .setDescription(`**${message.author.username}** vs **${opponent.username}**\n\nHer iki oyuncu da seçim yapmalı!`)
    .addFields(
      { name: '💰 Bahis', value: betAmount > 0 ? `${betAmount} coin` : 'Eğlence modu', inline: true },
      { name: `${message.author.username}`, value: '❓ Bekleniyor...', inline: true },
      { name: `${opponent.username}`, value: '❓ Bekleniyor...', inline: true }
    );

  const buttons = createChoiceButtons();
  const msg = await message.reply({ content: `<@${opponent.id}>`, embeds: [embed], components: [buttons] });

  const collector = msg.createMessageComponentCollector({
    filter: i => i.user.id === message.author.id || i.user.id === opponent.id,
    time: 60000
  });

  collector.on('collect', async (interaction) => {
    const choice = interaction.customId.replace('rps_', '');
    
    if (playerChoices[interaction.user.id]) {
      await interaction.reply({ content: 'Zaten seçim yaptın!', ephemeral: true });
      return;
    }

    playerChoices[interaction.user.id] = choice;
    await interaction.reply({ content: `${choices[choice].emoji} ${choices[choice].name} seçtin!`, ephemeral: true });

    if (Object.keys(playerChoices).length === 2) {
      collector.stop('complete');
    }
  });

  collector.on('end', async (collected, reason) => {
    if (reason !== 'complete' || Object.keys(playerChoices).length !== 2) {
      const timeoutEmbed = new EmbedBuilder()
        .setTitle('✂️ Taş Kağıt Makas - İptal')
        .setColor('#808080')
        .setDescription('Oyun süresi doldu veya tamamlanmadı.');
      
      await msg.edit({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
      return;
    }

    const p1Choice = playerChoices[message.author.id];
    const p2Choice = playerChoices[opponent.id];

    let winner, loser, result;
    
    if (p1Choice === p2Choice) {
      result = 'tie';
    } else if (choices[p1Choice].beats === p2Choice) {
      winner = message.author;
      loser = opponent;
      result = 'p1';
    } else {
      winner = opponent;
      loser = message.author;
      result = 'p2';
    }

    let winAmount = 0;
    if (betAmount > 0) {
      if (result === 'tie') {
      } else {
        await storage.updateUserBalance(message.guild.id, winner.id, -betAmount);
        await storage.updateUserBalance(message.guild.id, loser.id, -betAmount);
        winAmount = Math.floor(betAmount * 1.9);
        await storage.updateUserBalance(message.guild.id, winner.id, winAmount + betAmount);
      }
    }

    const resultEmbed = new EmbedBuilder()
      .setTitle('✂️ Taş Kağıt Makas - Sonuç')
      .setColor(result === 'tie' ? '#ffff00' : '#00ff00')
      .setDescription(`
**${message.author.username}:** ${choices[p1Choice].emoji} ${choices[p1Choice].name}
**${opponent.username}:** ${choices[p2Choice].emoji} ${choices[p2Choice].name}

# ${result === 'tie' ? '🤝 Berabere!' : `🏆 ${winner.username} kazandı!`}
      `);

    if (betAmount > 0 && result !== 'tie') {
      resultEmbed.addFields(
        { name: '💰 Ödül', value: `${winAmount} coin`, inline: true }
      );
    }

    await msg.edit({ embeds: [resultEmbed], components: [] }).catch(() => {});
  });
}

function createChoiceButtons() {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('rps_rock')
        .setLabel('Taş')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🪨'),
      new ButtonBuilder()
        .setCustomId('rps_paper')
        .setLabel('Kağıt')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📄'),
      new ButtonBuilder()
        .setCustomId('rps_scissors')
        .setLabel('Makas')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('✂️')
    );
}
