const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');

const battleAnimations = [
  ['⚔️', '💥', '✨', '🌟'],
  ['🗡️', '💢', '⚡', '💫'],
  ['🔥', '💨', '❄️', '🌀']
];

const attackMessages = [
  '{attacker} saldırıya geçti!',
  '{attacker} güçlü bir hamle yaptı!',
  '{attacker} rakibine saldırdı!',
  '{attacker} şiddetli bir atak başlattı!'
];

const hitMessages = [
  '{target} **{damage}** hasar aldı!',
  '{target} sarsıldı! **{damage}** hasar!',
  '{target} ağır bir darbe yedi! **{damage}**',
  '{target} sendeledi! **{damage}** hasar!'
];

const critMessages = [
  '💥 KRİTİK! {attacker} müthiş bir vuruş yaptı!',
  '⚡ SÜPER ETKİLİ! {attacker} ezici bir darbe indirdi!',
  '🔥 YIKICI SALDIRI! {attacker} rakibini sarstı!'
];

const dodgeMessages = [
  '💨 {target} saldırıdan kaçındı!',
  '🌀 {target} manevra yaptı!',
  '✨ {target} son anda sıyrıldı!'
];

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createHpBar(percent) {
  const filled = Math.round(percent / 10);
  const empty = 10 - filled;
  const color = percent > 60 ? '🟩' : percent > 30 ? '🟨' : '🟥';
  return color.repeat(filled) + '⬛'.repeat(empty) + ` ${percent}%`;
}

function createDuelEmbed(phase, challenger, opponent, challengerTeam, opponentTeam, challengerStats, opponentStats, currentHp, round, battleLog, won = null) {
  const embed = new EmbedBuilder();
  
  const challengerHpPercent = Math.max(0, Math.round((currentHp.challenger / challengerStats.hp) * 100));
  const opponentHpPercent = Math.max(0, Math.round((currentHp.opponent / opponentStats.hp) * 100));
  
  const challengerHpBar = createHpBar(challengerHpPercent);
  const opponentHpBar = createHpBar(opponentHpPercent);
  
  if (phase === 'intro') {
    embed.setColor('#fbbf24')
      .setTitle('⚔️ DÜELLO BAŞLIYOR! ⚔️')
      .setDescription(`**${challenger.username}** vs **${opponent.username}**\n\`\`\`\n${'═'.repeat(30)}\n\`\`\``);
    
    let challengerTeamStr = challengerTeam.map(t => {
      const base = `${t.animalInfo.emoji} **${t.userAnimal.nickname || t.animalInfo.name}** Lv.${t.userAnimal.level}`;
      const eff = t.effectiveStats || t.userAnimal;
      let stats = `┣ ❤️${eff.hp} ⚔️${eff.str} 🛡️${eff.def} ⚡${eff.spd}`;
      
      let equipLine = '';
      if (t.equipment) {
        const eqParts = [];
        if (t.equipment.weaponInfo) eqParts.push(`⚔️${t.equipment.weaponInfo.emoji}`);
        if (t.equipment.armorInfo) eqParts.push(`🛡️${t.equipment.armorInfo.emoji}`);
        if (t.equipment.accessoryInfo) eqParts.push(`💍${t.equipment.accessoryInfo.emoji}`);
        if (eqParts.length > 0) equipLine = `\n┗ ${eqParts.join(' ')}`;
      }
      
      return base + '\n' + stats + equipLine;
    }).join('\n\n');
    
    let opponentTeamStr = opponentTeam.map(t => {
      const base = `${t.animalInfo.emoji} **${t.userAnimal.nickname || t.animalInfo.name}** Lv.${t.userAnimal.level}`;
      const eff = t.effectiveStats || t.userAnimal;
      let stats = `┣ ❤️${eff.hp} ⚔️${eff.str} 🛡️${eff.def} ⚡${eff.spd}`;
      
      let equipLine = '';
      if (t.equipment) {
        const eqParts = [];
        if (t.equipment.weaponInfo) eqParts.push(`⚔️${t.equipment.weaponInfo.emoji}`);
        if (t.equipment.armorInfo) eqParts.push(`🛡️${t.equipment.armorInfo.emoji}`);
        if (t.equipment.accessoryInfo) eqParts.push(`💍${t.equipment.accessoryInfo.emoji}`);
        if (eqParts.length > 0) equipLine = `\n┗ ${eqParts.join(' ')}`;
      }
      
      return base + '\n' + stats + equipLine;
    }).join('\n\n');
    
    embed.addFields(
      { name: `🟢 ${challenger.username}`, value: challengerTeamStr || 'Boş', inline: true },
      { name: '⚔️', value: '\u200b', inline: true },
      { name: `🔴 ${opponent.username}`, value: opponentTeamStr || 'Boş', inline: true }
    );
    
  } else if (phase === 'battle') {
    const animSet = battleAnimations[Math.floor(Math.random() * battleAnimations.length)];
    const anim = animSet[Math.floor(Math.random() * animSet.length)];
    
    embed.setColor('#ef4444')
      .setTitle(`${anim} TUR ${round} ${anim}`)
      .setDescription(`**${challenger.username}** vs **${opponent.username}**\n\`\`\`ansi\n\u001b[1;31m⚔️ DÜELLO DEVAM EDİYOR ⚔️\u001b[0m\n\`\`\``);
    
    embed.addFields(
      { name: `🟢 ${challenger.username}`, value: `${challengerHpBar}\n❤️ ${Math.max(0, currentHp.challenger)}/${challengerStats.hp}`, inline: true },
      { name: '⚔️ vs ⚔️', value: '\u200b', inline: true },
      { name: `🔴 ${opponent.username}`, value: `${opponentHpBar}\n❤️ ${Math.max(0, currentHp.opponent)}/${opponentStats.hp}`, inline: true }
    );
    
    const recentLogs = battleLog.slice(-4).join('\n');
    embed.addFields({ name: '📜 Savaş Günlüğü', value: recentLogs || '...', inline: false });
    
  } else if (phase === 'result') {
    const winner = won === 'challenger' ? challenger : opponent;
    const isChallenger = won === 'challenger';
    
    embed.setColor(isChallenger ? '#10b981' : '#ef4444')
      .setTitle(`🏆 ${winner.username} KAZANDI! 🏆`)
      .setDescription(`**${challenger.username}** vs **${opponent.username}**\n\`\`\`diff\n+ ${winner.username} galip geldi!\n\`\`\``);
    
    let challengerTeamStr = challengerTeam.map(t => {
      const base = `${t.animalInfo.emoji} **${t.userAnimal.nickname || t.animalInfo.name}** Lv.${t.userAnimal.level}`;
      const eff = t.effectiveStats || t.userAnimal;
      let stats = `┣ ❤️${eff.hp} ⚔️${eff.str} 🛡️${eff.def} ⚡${eff.spd}`;
      
      let equipLine = '';
      if (t.equipment) {
        const eqParts = [];
        if (t.equipment.weaponInfo) eqParts.push(`⚔️${t.equipment.weaponInfo.emoji}`);
        if (t.equipment.armorInfo) eqParts.push(`🛡️${t.equipment.armorInfo.emoji}`);
        if (t.equipment.accessoryInfo) eqParts.push(`💍${t.equipment.accessoryInfo.emoji}`);
        if (eqParts.length > 0) equipLine = `\n┗ ${eqParts.join(' ')}`;
      }
      
      return base + '\n' + stats + equipLine;
    }).join('\n\n');
    
    let opponentTeamStr = opponentTeam.map(t => {
      const base = `${t.animalInfo.emoji} **${t.userAnimal.nickname || t.animalInfo.name}** Lv.${t.userAnimal.level}`;
      const eff = t.effectiveStats || t.userAnimal;
      let stats = `┣ ❤️${eff.hp} ⚔️${eff.str} 🛡️${eff.def} ⚡${eff.spd}`;
      
      let equipLine = '';
      if (t.equipment) {
        const eqParts = [];
        if (t.equipment.weaponInfo) eqParts.push(`⚔️${t.equipment.weaponInfo.emoji}`);
        if (t.equipment.armorInfo) eqParts.push(`🛡️${t.equipment.armorInfo.emoji}`);
        if (t.equipment.accessoryInfo) eqParts.push(`💍${t.equipment.accessoryInfo.emoji}`);
        if (eqParts.length > 0) equipLine = `\n┗ ${eqParts.join(' ')}`;
      }
      
      return base + '\n' + stats + equipLine;
    }).join('\n\n');
    
    embed.addFields(
      { name: `${isChallenger ? '🏆' : '💀'} ${challenger.username}`, value: challengerTeamStr || 'Boş', inline: true },
      { name: isChallenger ? '✅' : '❌', value: '\u200b', inline: true },
      { name: `${isChallenger ? '💀' : '🏆'} ${opponent.username}`, value: opponentTeamStr || 'Boş', inline: true }
    );
  }
  
  embed.setTimestamp();
  return embed;
}

module.exports = {
  name: 'duello',
  aliases: ['d', 'düello', 'pvp', 'vs'],
  description: 'Başka bir kullanıcıyla düello yap',
  category: 'lethe',
  async execute(message, args, client, storage) {
    const guildData = await storage.getGuild(message.guild.id);
    if (guildData?.modules && guildData.modules.economy === false) {
      return message.reply('❌ Lethe Game bu sunucuda devre dışı.');
    }
    
    const letheChannels = guildData?.modules?.letheChannels || [];
    if (letheChannels.length > 0 && !letheChannels.includes(message.channel.id)) {
      return message.reply(`❌ Lethe Game komutları sadece belirlenen kanallarda çalışır! \`!oyunkanal liste\` ile kontrol et.`);
    }
    
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

    const challengerData = await letheStorage.getTeamWithEquipment(message.author.id);
    const opponentData = await letheStorage.getTeamWithEquipment(opponent.id);

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
      .addFields(
        { name: `🟢 ${message.author.username}`, value: `${challengerData.team.length} hayvanlı takım\nToplam Güç: ⚔️${challengerData.stats.str} 🛡️${challengerData.stats.def}`, inline: true },
        { name: '⚔️', value: '\u200b', inline: true },
        { name: `🔴 ${opponent.username}`, value: `${opponentData.team.length} hayvanlı takım\nToplam Güç: ⚔️${opponentData.stats.str} 🛡️${opponentData.stats.def}`, inline: true }
      )
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

        const currentHp = { challenger: challengerStats.hp, opponent: opponentStats.hp };
        const battleLog = [];
        let round = 0;

        const introEmbed = createDuelEmbed('intro', message.author, opponent, challengerData.team, opponentData.team, challengerStats, opponentStats, currentHp, 0, []);
        await interaction.update({ embeds: [introEmbed], components: [] });

        await delay(2000);

        const challengerFirst = challengerStats.spd >= opponentStats.spd;

        while (currentHp.challenger > 0 && currentHp.opponent > 0 && round < 20) {
          round++;

          if (challengerFirst) {
            const isCrit = Math.random() < 0.15;
            const isDodge = Math.random() < (opponentStats.spd / (opponentStats.spd + 100));
            
            if (isDodge) {
              const dodgeMsg = dodgeMessages[Math.floor(Math.random() * dodgeMessages.length)]
                .replace('{target}', `🔴 ${opponent.username}`);
              battleLog.push(dodgeMsg);
            } else {
              let damage = Math.max(1, Math.floor(challengerStats.str * (1 - opponentStats.def / (opponentStats.def + 100)) * (0.9 + Math.random() * 0.2)));
              if (isCrit) {
                damage = Math.floor(damage * 1.5);
                const critMsg = critMessages[Math.floor(Math.random() * critMessages.length)]
                  .replace('{attacker}', `🟢 ${message.author.username}`);
                battleLog.push(critMsg);
              }
              currentHp.opponent -= damage;
              
              const hitMsg = hitMessages[Math.floor(Math.random() * hitMessages.length)]
                .replace('{target}', `🔴`)
                .replace('{damage}', damage.toString());
              battleLog.push(`⚔️ ${message.author.username} saldırdı! ${hitMsg}`);
            }

            if (currentHp.opponent <= 0) break;

            const opponentDodge = Math.random() < (challengerStats.spd / (challengerStats.spd + 100));
            if (opponentDodge) {
              const dodgeMsg = dodgeMessages[Math.floor(Math.random() * dodgeMessages.length)]
                .replace('{target}', `🟢 ${message.author.username}`);
              battleLog.push(dodgeMsg);
            } else {
              const counterDamage = Math.max(1, Math.floor(opponentStats.str * (1 - challengerStats.def / (challengerStats.def + 100)) * (0.9 + Math.random() * 0.2)));
              currentHp.challenger -= counterDamage;
              
              const hitMsg = hitMessages[Math.floor(Math.random() * hitMessages.length)]
                .replace('{target}', '🟢')
                .replace('{damage}', counterDamage.toString());
              battleLog.push(`💥 ${opponent.username} saldırdı! ${hitMsg}`);
            }
          } else {
            const isDodge = Math.random() < (challengerStats.spd / (challengerStats.spd + 100));
            
            if (isDodge) {
              const dodgeMsg = dodgeMessages[Math.floor(Math.random() * dodgeMessages.length)]
                .replace('{target}', `🟢 ${message.author.username}`);
              battleLog.push(dodgeMsg);
            } else {
              const damage = Math.max(1, Math.floor(opponentStats.str * (1 - challengerStats.def / (challengerStats.def + 100)) * (0.9 + Math.random() * 0.2)));
              currentHp.challenger -= damage;
              
              const hitMsg = hitMessages[Math.floor(Math.random() * hitMessages.length)]
                .replace('{target}', '🟢')
                .replace('{damage}', damage.toString());
              battleLog.push(`💥 ${opponent.username} saldırdı! ${hitMsg}`);
            }

            if (currentHp.challenger <= 0) break;

            const challengerDodge = Math.random() < (opponentStats.spd / (opponentStats.spd + 100));
            if (challengerDodge) {
              const dodgeMsg = dodgeMessages[Math.floor(Math.random() * dodgeMessages.length)]
                .replace('{target}', `🔴 ${opponent.username}`);
              battleLog.push(dodgeMsg);
            } else {
              const counterDamage = Math.max(1, Math.floor(challengerStats.str * (1 - opponentStats.def / (opponentStats.def + 100)) * (0.9 + Math.random() * 0.2)));
              currentHp.opponent -= counterDamage;
              
              const hitMsg = hitMessages[Math.floor(Math.random() * hitMessages.length)]
                .replace('{target}', '🔴')
                .replace('{damage}', counterDamage.toString());
              battleLog.push(`⚔️ ${message.author.username} saldırdı! ${hitMsg}`);
            }
          }

          const battleEmbed = createDuelEmbed('battle', message.author, opponent, challengerData.team, opponentData.team, challengerStats, opponentStats, currentHp, round, battleLog);
          await challengeMsg.edit({ embeds: [battleEmbed] });
          await delay(1500);
        }

        const challengerWon = currentHp.opponent <= 0;

        await letheStorage.updateQuestProgress(message.author.id, 'pvp', 1);
        await letheStorage.updateQuestProgress(opponent.id, 'pvp', 1);
        
        const completedQuests = [];
        if (challengerWon) {
          const winQuests = await letheStorage.updateQuestProgress(message.author.id, 'pvp_win', 1);
          completedQuests.push(...winQuests);
        } else {
          await letheStorage.updateQuestProgress(opponent.id, 'pvp_win', 1);
        }

        const resultEmbed = createDuelEmbed('result', message.author, opponent, challengerData.team, opponentData.team, challengerStats, opponentStats, currentHp, round, battleLog, challengerWon ? 'challenger' : 'opponent');
        
        resultEmbed.addFields(
          { name: '🎯 Toplam Tur', value: `${round}`, inline: true }
        );

        if (completedQuests.length > 0) {
          for (const q of completedQuests) {
            let rewardText = [];
            if (q.rewards?.coins > 0) rewardText.push(`+${q.rewards.coins}💰`);
            if (q.rewards?.xp > 0) rewardText.push(`+${q.rewards.xp}✨`);
            if (q.rewards?.item) rewardText.push(`+1 ${q.rewards.item.type}`);
            resultEmbed.addFields({ 
              name: `🎯 ${q.questInfo.emoji} ${q.questInfo.name} Tamamlandı!`, 
              value: rewardText.length > 0 ? `Ödül: ${rewardText.join(' ')}` : 'Tamamlandı!', 
              inline: false 
            });
          }
        }

        resultEmbed.setFooter({ text: challengerWon ? `🎉 Tebrikler ${message.author.username}!` : `🎉 Tebrikler ${opponent.username}!` });

        await challengeMsg.edit({ embeds: [resultEmbed] });
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
