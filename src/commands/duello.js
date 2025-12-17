const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');

module.exports = {
  name: 'duello',
  aliases: ['düello', 'pvp', 'vs'],
  description: 'Başka bir kullanıcıyla düello yap',
  category: 'lethe',
  async execute(message, args, client, storage) {
    const opponent = message.mentions.users.first();

    if (!opponent) {
      return message.reply('❌ Kullanım: `!düello @kullanıcı`');
    }

    if (opponent.id === message.author.id) {
      return message.reply('❌ Kendinle düello yapamazsın!');
    }

    if (opponent.bot) {
      return message.reply('❌ Botlarla düello yapamazsın! PvE için `!savaş` kullan.');
    }

    const challengerData = await letheStorage.getTeamWithEquipment(message.guild.id, message.author.id);
    const opponentData = await letheStorage.getTeamWithEquipment(message.guild.id, opponent.id);

    if (challengerData.team.length === 0) {
      return message.reply('❌ Takımın boş! Önce `!takımekle` ile hayvan ekle.');
    }

    if (opponentData.team.length === 0) {
      return message.reply(`❌ ${opponent.username} henüz takım kurmamış!`);
    }

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('accept_duel')
          .setLabel('✅ Kabul Et')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('reject_duel')
          .setLabel('❌ Reddet')
          .setStyle(ButtonStyle.Danger)
      );

    const challengeEmbed = new EmbedBuilder()
      .setColor('#f59e0b')
      .setTitle('⚔️ Düello Daveti!')
      .setDescription(`${message.author} seni düelloya davet ediyor!`)
      .setFooter({ text: '30 saniye içinde yanıt ver!' })
      .setTimestamp();

    const challengeMsg = await message.reply({ 
      content: `${opponent}`,
      embeds: [challengeEmbed], 
      components: [row] 
    });

    const filter = (interaction) => interaction.user.id === opponent.id;
    const collector = challengeMsg.createMessageComponentCollector({ filter, time: 30000 });

    collector.on('collect', async (interaction) => {
      if (interaction.customId === 'reject_duel') {
        const rejectEmbed = new EmbedBuilder()
          .setColor('#ef4444')
          .setTitle('❌ Düello Reddedildi')
          .setDescription(`${opponent.username} düelloyu reddetti.`);
        
        await interaction.update({ embeds: [rejectEmbed], components: [] });
        return;
      }

      if (interaction.customId === 'accept_duel') {
        const challengerStats = challengerData.stats;
        const opponentStats = opponentData.stats;

        let challengerHp = challengerStats.hp;
        let opponentHp = opponentStats.hp;
        const battleLog = [];
        let round = 0;

        const challengerFirst = challengerStats.spd >= opponentStats.spd;

        while (challengerHp > 0 && opponentHp > 0 && round < 20) {
          round++;

          if (challengerFirst) {
            const damage = Math.max(1, Math.floor(challengerStats.str * (1 - opponentStats.def / (opponentStats.def + 100)) * (0.9 + Math.random() * 0.2)));
            opponentHp -= damage;
            battleLog.push(`⚔️ ${message.author.username}: **${damage}** hasar!`);

            if (opponentHp <= 0) break;

            const counterDamage = Math.max(1, Math.floor(opponentStats.str * (1 - challengerStats.def / (challengerStats.def + 100)) * (0.9 + Math.random() * 0.2)));
            challengerHp -= counterDamage;
            battleLog.push(`💥 ${opponent.username}: **${counterDamage}** hasar!`);
          } else {
            const damage = Math.max(1, Math.floor(opponentStats.str * (1 - challengerStats.def / (challengerStats.def + 100)) * (0.9 + Math.random() * 0.2)));
            challengerHp -= damage;
            battleLog.push(`💥 ${opponent.username}: **${damage}** hasar!`);

            if (challengerHp <= 0) break;

            const counterDamage = Math.max(1, Math.floor(challengerStats.str * (1 - opponentStats.def / (opponentStats.def + 100)) * (0.9 + Math.random() * 0.2)));
            opponentHp -= counterDamage;
            battleLog.push(`⚔️ ${message.author.username}: **${counterDamage}** hasar!`);
          }
        }

        const challengerWon = opponentHp <= 0;
        const winner = challengerWon ? message.author : opponent;

        const lastLogs = battleLog.slice(-6).join('\n');

        const resultEmbed = new EmbedBuilder()
          .setColor(challengerWon ? '#10b981' : '#ef4444')
          .setTitle(`🏆 ${winner.username} Kazandı!`)
          .setDescription(`${message.author.username} vs ${opponent.username}`)
          .addFields(
            { name: '📜 Savaş', value: lastLogs || 'Savaş çok hızlı bitti!', inline: false },
            { name: '🎯 Sonuç', value: `${round} turda ${winner.username} galip geldi!`, inline: false }
          )
          .setTimestamp();

        await interaction.update({ embeds: [resultEmbed], components: [] });
      }
    });

    collector.on('end', (collected, reason) => {
      if (reason === 'time' && collected.size === 0) {
        const timeoutEmbed = new EmbedBuilder()
          .setColor('#6b7280')
          .setTitle('⏰ Süre Doldu')
          .setDescription('Düello daveti yanıtsız kaldı.');
        
        challengeMsg.edit({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
      }
    });
  }
};
