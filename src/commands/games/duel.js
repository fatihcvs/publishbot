const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { storage } = require('../../database/storage');

module.exports = {
  name: 'duel',
  aliases: ['duello', 'pvp', 'vs'],
  description: 'Başka bir kullanıcıya coinflip düellosu yolla!',
  usage: '!duel @kullanici <miktar>',
  
  async execute(message, args, client) {
    const opponent = message.mentions.users.first();
    if (!opponent || opponent.bot || opponent.id === message.author.id) {
      return message.reply('Geçerli bir kullanıcı etiketle! `!duel @kullanici <miktar>`');
    }

    const betAmount = parseInt(args[1]) || 100;

    if (betAmount < 10) {
      return message.reply('Minimum düello miktarı **10** coin!');
    }

    if (betAmount > 50000) {
      return message.reply('Maksimum düello miktarı **50,000** coin!');
    }

    let challengerEco = await storage.getUserEconomy(message.guild.id, message.author.id);
    if (!challengerEco) challengerEco = await storage.createUserEconomy(message.guild.id, message.author.id);

    if (challengerEco.balance < betAmount) {
      return message.reply(`Yeterli bakiyen yok! Mevcut bakiye: **${challengerEco.balance}** coin`);
    }

    let opponentEco = await storage.getUserEconomy(message.guild.id, opponent.id);
    if (!opponentEco) opponentEco = await storage.createUserEconomy(message.guild.id, opponent.id);

    if (opponentEco.balance < betAmount) {
      return message.reply(`${opponent.username}'in yeterli bakiyesi yok!`);
    }

    const duel = await storage.createDuel(
      message.guild.id,
      message.channel.id,
      message.author.id,
      opponent.id,
      betAmount,
      'coinflip'
    );

    const embed = new EmbedBuilder()
      .setTitle('⚔️ Düello Daveti!')
      .setColor('#ffa500')
      .setDescription(`**${message.author.username}**, **${opponent.username}**'i düelloya davet etti!`)
      .addFields(
        { name: '💰 Bahis', value: `${betAmount} coin`, inline: true },
        { name: '🎮 Oyun', value: 'Coinflip', inline: true },
        { name: '⏱️ Süre', value: '60 saniye', inline: true }
      )
      .setFooter({ text: `${opponent.username}, kabul etmek için butona tıkla!` });

    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`duel_accept_${duel.id}`)
          .setLabel('Kabul Et')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅'),
        new ButtonBuilder()
          .setCustomId(`duel_decline_${duel.id}`)
          .setLabel('Reddet')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌')
      );

    const msg = await message.reply({ content: `<@${opponent.id}>`, embeds: [embed], components: [buttons] });

    const collector = msg.createMessageComponentCollector({
      filter: i => i.user.id === opponent.id,
      time: 60000
    });

    collector.on('collect', async (interaction) => {
      const currentDuel = await storage.getDuel(duel.id);
      if (!currentDuel || currentDuel.status !== 'pending') {
        await interaction.update({ components: [] });
        return;
      }

      if (interaction.customId === `duel_decline_${duel.id}`) {
        await storage.deleteDuel(duel.id);
        
        const declineEmbed = new EmbedBuilder()
          .setTitle('⚔️ Düello Reddedildi')
          .setColor('#ff0000')
          .setDescription(`${opponent.username} düelloyu reddetti.`);
        
        await interaction.update({ embeds: [declineEmbed], components: [] });
        collector.stop();
        return;
      }

      if (interaction.customId === `duel_accept_${duel.id}`) {
        const freshChallengerEco = await storage.getUserEconomy(message.guild.id, message.author.id);
        const freshOpponentEco = await storage.getUserEconomy(message.guild.id, opponent.id);

        if (freshChallengerEco.balance < betAmount || freshOpponentEco.balance < betAmount) {
          await storage.deleteDuel(duel.id);
          await interaction.update({ 
            content: 'Yetersiz bakiye nedeniyle düello iptal edildi!', 
            embeds: [], 
            components: [] 
          });
          return;
        }

        await storage.updateUserBalance(message.guild.id, message.author.id, -betAmount);
        await storage.updateUserBalance(message.guild.id, opponent.id, -betAmount);
        await storage.updateDuel(duel.id, { status: 'active' });

        const result = Math.random() < 0.5;
        const winner = result ? message.author : opponent;
        const loser = result ? opponent : message.author;
        const totalPot = betAmount * 2;
        const winAmount = Math.floor(totalPot * 0.95);

        await storage.updateUserBalance(message.guild.id, winner.id, winAmount);
        await storage.addToJackpot(message.guild.id, totalPot - winAmount);
        await storage.deleteDuel(duel.id);

        const coinResult = result ? '🪙 Yazı' : '⭕ Tura';

        const resultEmbed = new EmbedBuilder()
          .setTitle('⚔️ Düello Sonucu!')
          .setColor('#00ff00')
          .setDescription(`
${coinResult}

🏆 **${winner.username}** kazandı!
          `)
          .addFields(
            { name: '💰 Ödül', value: `${winAmount} coin`, inline: true },
            { name: '💔 Kayıp', value: `${loser.username}: -${betAmount} coin`, inline: true }
          )
          .setFooter({ text: 'Havuzdan %5 komisyon alındı' });

        await storage.addGameHistory(message.guild.id, winner.id, 'duel', betAmount, winAmount, 'win');
        await storage.addGameHistory(message.guild.id, loser.id, 'duel', betAmount, 0, 'lose');

        await storage.incrementUserStats(message.guild.id, winner.id, 'gamesPlayed');
        await storage.incrementUserStats(message.guild.id, winner.id, 'gamesWon');
        await storage.incrementUserStats(message.guild.id, winner.id, 'totalWon', winAmount);

        await storage.incrementUserStats(message.guild.id, loser.id, 'gamesPlayed');
        await storage.incrementUserStats(message.guild.id, loser.id, 'gamesLost');
        await storage.incrementUserStats(message.guild.id, loser.id, 'totalLost', betAmount);

        await interaction.update({ embeds: [resultEmbed], components: [] });
        collector.stop();
      }
    });

    collector.on('end', async (collected, reason) => {
      if (reason === 'time') {
        const currentDuel = await storage.getDuel(duel.id);
        if (currentDuel && currentDuel.status === 'pending') {
          await storage.deleteDuel(duel.id);
          
          const timeoutEmbed = new EmbedBuilder()
            .setTitle('⚔️ Düello Süresi Doldu')
            .setColor('#808080')
            .setDescription('Düello daveti yanıtlanmadı.');
          
          await msg.edit({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
        }
      }
    });
  }
};
