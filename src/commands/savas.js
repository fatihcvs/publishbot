const { EmbedBuilder } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');

const enemyTeams = [
  {
    name: 'Vahşi Kurt Sürüsü',
    emoji: '🐺',
    animals: [
      { name: 'Alfa Kurt', emoji: '🐺', hp: 80, str: 25, def: 12, spd: 18 },
      { name: 'Beta Kurt', emoji: '🐺', hp: 60, str: 20, def: 10, spd: 15 },
      { name: 'Omega Kurt', emoji: '🐺', hp: 50, str: 18, def: 8, spd: 20 }
    ],
    equipment: { weapon: '⚔️ Keskin Pençeler', armor: '🛡️ Kalın Kürk' }
  },
  {
    name: 'Orman Canavarları',
    emoji: '👹',
    animals: [
      { name: 'Orman Trollü', emoji: '👹', hp: 120, str: 30, def: 20, spd: 8 },
      { name: 'Goblin Savaşçı', emoji: '👺', hp: 45, str: 22, def: 8, spd: 22 },
      { name: 'Ork Avcısı', emoji: '🧟', hp: 70, str: 28, def: 15, spd: 12 }
    ],
    equipment: { weapon: '🪓 Paslı Balta', armor: '🥋 Deri Zırh' }
  },
  {
    name: 'Karanlık Ordu',
    emoji: '🌑',
    animals: [
      { name: 'Gölge Şövalye', emoji: '🌑', hp: 90, str: 28, def: 18, spd: 14 },
      { name: 'Hayalet Köpek', emoji: '👻', hp: 55, str: 24, def: 10, spd: 25 },
      { name: 'Karanlık Yarasa', emoji: '🦇', hp: 40, str: 20, def: 6, spd: 30 }
    ],
    equipment: { weapon: '🗡️ Gölge Kılıcı', armor: '🖤 Karanlık Pelerin' }
  },
  {
    name: 'Zehir Lejyonu',
    emoji: '🐍',
    animals: [
      { name: 'Kral Kobra', emoji: '🐍', hp: 70, str: 32, def: 10, spd: 20 },
      { name: 'Zehirli Akrep', emoji: '🦂', hp: 50, str: 28, def: 15, spd: 16 },
      { name: 'Mor Örümcek', emoji: '🕷️', hp: 45, str: 25, def: 8, spd: 24 }
    ],
    equipment: { weapon: '☠️ Zehir Dişleri', armor: '🟢 Zehir Derisi' }
  },
  {
    name: 'Buz Kabilesi',
    emoji: '❄️',
    animals: [
      { name: 'Buz Ayısı', emoji: '🐻‍❄️', hp: 100, str: 26, def: 22, spd: 10 },
      { name: 'Kar Baykuşu', emoji: '🦉', hp: 55, str: 22, def: 12, spd: 28 },
      { name: 'Kutup Tilkisi', emoji: '🦊', hp: 60, str: 20, def: 14, spd: 22 }
    ],
    equipment: { weapon: '🧊 Buz Pençeleri', armor: '🧣 Kalın Kürk' }
  },
  {
    name: 'Ateş Birliği',
    emoji: '🔥',
    animals: [
      { name: 'Ateş Ejderhası', emoji: '🐉', hp: 110, str: 35, def: 18, spd: 12 },
      { name: 'Lav Böceği', emoji: '🪲', hp: 40, str: 24, def: 25, spd: 14 },
      { name: 'Feniks Yavrusu', emoji: '🐦‍🔥', hp: 65, str: 28, def: 10, spd: 26 }
    ],
    equipment: { weapon: '🔥 Alev Nefesi', armor: '🛡️ Magma Zırhı' }
  }
];

const battleAnimations = [
  ['⚔️', '💥', '✨', '🌟'],
  ['🗡️', '💢', '⚡', '💫'],
  ['🔥', '💨', '❄️', '🌀']
];

const attackMessages = [
  '{attacker} saldırıya geçti!',
  '{attacker} güçlü bir hamle yaptı!',
  '{attacker} rakibine saldırdı!',
  '{attacker} şiddetli bir atak başlattı!',
  '{attacker} hedefe kilitlendi!'
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

function createBattleEmbed(phase, userTeam, enemyTeam, userStats, enemyStats, currentHp, enemyHp, round, battleLog, teamData, won = null) {
  const embed = new EmbedBuilder();
  
  const userHpPercent = Math.max(0, Math.round((currentHp.user / userStats.hp) * 100));
  const enemyHpPercent = Math.max(0, Math.round((currentHp.enemy / enemyStats.hp) * 100));
  
  const userHpBar = createHpBar(userHpPercent);
  const enemyHpBar = createHpBar(enemyHpPercent);
  
  if (phase === 'intro') {
    embed.setColor('#fbbf24')
      .setTitle('⚔️ SAVAŞ BAŞLIYOR! ⚔️')
      .setDescription('```\n' + '═'.repeat(30) + '\n```');
    
    let userTeamStr = userTeam.map(t => {
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
    
    let enemyTeamStr = enemyTeam.animals.map(a => 
      `${a.emoji} **${a.name}**\n┗ ❤️${a.hp} ⚔️${a.str} 🛡️${a.def} ⚡${a.spd}`
    ).join('\n\n');
    
    embed.addFields(
      { name: '🟢 Senin Takımın', value: userTeamStr || 'Boş', inline: true },
      { name: '⚔️', value: '\u200b', inline: true },
      { name: `🔴 ${enemyTeam.emoji} ${enemyTeam.name}`, value: enemyTeamStr, inline: true }
    );
    
    let userEquip = '';
    if (teamData.allEquipment && teamData.allEquipment.length > 0) {
      userEquip = teamData.allEquipment.map(eq => {
        if (eq.type === 'weapon') return `⚔️ ${eq.emoji} ${eq.name} (+${eq.damage})`;
        if (eq.type === 'armor') return `🛡️ ${eq.emoji} ${eq.name} (+${eq.defense})`;
        if (eq.type === 'accessory') return `💍 ${eq.emoji} ${eq.name} (+${eq.effectValue})`;
        return '';
      }).filter(e => e).join('\n');
    }
    if (!userEquip && teamData.weapon?.name) userEquip += `⚔️ ${teamData.weapon.name}\n`;
    if (!userEquip && teamData.armor?.name) userEquip += `🛡️ ${teamData.armor.name}`;
    
    let enemyEquip = `${enemyTeam.equipment.weapon}\n${enemyTeam.equipment.armor}`;
    
    embed.addFields(
      { name: '🎒 Ekipmanlarınız', value: userEquip || '*Ekipman yok*', inline: true },
      { name: '📊', value: '\u200b', inline: true },
      { name: '🎒 Düşman Ekipmanı', value: enemyEquip, inline: true }
    );
    
  } else if (phase === 'battle') {
    const animSet = battleAnimations[Math.floor(Math.random() * battleAnimations.length)];
    const anim = animSet[Math.floor(Math.random() * animSet.length)];
    
    embed.setColor('#ef4444')
      .setTitle(`${anim} TUR ${round} ${anim}`)
      .setDescription('```ansi\n\u001b[1;31m⚔️ SAVAŞ DEVAM EDİYOR ⚔️\u001b[0m\n```');
    
    embed.addFields(
      { name: '🟢 Takımın', value: `${userHpBar}\n❤️ ${Math.max(0, currentHp.user)}/${userStats.hp}`, inline: true },
      { name: '⚔️ vs ⚔️', value: '\u200b', inline: true },
      { name: `🔴 ${enemyTeam.emoji} Düşman`, value: `${enemyHpBar}\n❤️ ${Math.max(0, currentHp.enemy)}/${enemyStats.hp}`, inline: true }
    );
    
    const recentLogs = battleLog.slice(-4).join('\n');
    embed.addFields({ name: '📜 Savaş Günlüğü', value: recentLogs || '...', inline: false });
    
  } else if (phase === 'result') {
    embed.setColor(won ? '#10b981' : '#ef4444')
      .setTitle(won ? '🏆 ZAFER! 🏆' : '💀 YENİLGİ! 💀')
      .setDescription(won 
        ? `\`\`\`diff\n+ ${enemyTeam.name} yenildi!\n\`\`\`` 
        : `\`\`\`diff\n- Takımın mağlup oldu...\n\`\`\``);
    
    embed.addFields(
      { name: '🟢 Takımın', value: `${userHpBar}\n❤️ ${Math.max(0, currentHp.user)}/${userStats.hp}`, inline: true },
      { name: won ? '✅' : '❌', value: '\u200b', inline: true },
      { name: `🔴 ${enemyTeam.emoji} Düşman`, value: `${enemyHpBar}\n❤️ ${Math.max(0, currentHp.enemy)}/${enemyStats.hp}`, inline: true }
    );
    
    const finalLogs = battleLog.slice(-6).join('\n');
    embed.addFields({ name: '📜 Savaş Özeti', value: finalLogs || 'Hızlı savaş!', inline: false });
  }
  
  embed.setTimestamp();
  return embed;
}

function createHpBar(percent) {
  const filled = Math.round(percent / 10);
  const empty = 10 - filled;
  const color = percent > 60 ? '🟩' : percent > 30 ? '🟨' : '🟥';
  return color.repeat(filled) + '⬛'.repeat(empty) + ` ${percent}%`;
}

module.exports = {
  name: 'savas',
  aliases: ['savaş', 'battle', 'fight', 'pve'],
  description: 'Takımınla savaşa gir',
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
    
    const teamData = await letheStorage.getTeamWithEquipment(message.author.id);

    if (teamData.team.length === 0) {
      return message.reply('❌ Takımın boş! Önce `!takımekle` ile hayvan ekle.');
    }

    const userStats = teamData.stats;
    const profile = await letheStorage.getProfile(message.author.id);
    const difficultyMultiplier = 1 + (profile.level * 0.08);

    const baseEnemy = enemyTeams[Math.floor(Math.random() * enemyTeams.length)];
    const enemyTeam = {
      ...baseEnemy,
      animals: baseEnemy.animals.map(a => ({
        ...a,
        hp: Math.floor(a.hp * difficultyMultiplier),
        str: Math.floor(a.str * difficultyMultiplier),
        def: Math.floor(a.def * difficultyMultiplier)
      }))
    };

    const enemyStats = {
      hp: enemyTeam.animals.reduce((sum, a) => sum + a.hp, 0),
      str: enemyTeam.animals.reduce((sum, a) => sum + a.str, 0),
      def: enemyTeam.animals.reduce((sum, a) => sum + a.def, 0),
      spd: Math.round(enemyTeam.animals.reduce((sum, a) => sum + a.spd, 0) / enemyTeam.animals.length)
    };

    const currentHp = { user: userStats.hp, enemy: enemyStats.hp };
    const battleLog = [];
    let round = 0;

    const introEmbed = createBattleEmbed('intro', teamData.team, enemyTeam, userStats, enemyStats, currentHp, null, 0, [], teamData);
    const battleMsg = await message.reply({ embeds: [introEmbed] });

    await delay(2000);

    while (currentHp.user > 0 && currentHp.enemy > 0 && round < 15) {
      round++;

      const userFirst = userStats.spd >= enemyStats.spd;
      
      if (userFirst) {
        const isCrit = Math.random() < 0.15;
        const isDodge = Math.random() < (enemyStats.spd / (enemyStats.spd + 100));
        
        if (isDodge) {
          const dodgeMsg = dodgeMessages[Math.floor(Math.random() * dodgeMessages.length)]
            .replace('{target}', `${enemyTeam.emoji} Düşman`);
          battleLog.push(dodgeMsg);
        } else {
          let damage = Math.max(1, Math.floor(userStats.str * (1 - enemyStats.def / (enemyStats.def + 100)) * (0.9 + Math.random() * 0.2)));
          if (isCrit) {
            damage = Math.floor(damage * 1.5);
            const critMsg = critMessages[Math.floor(Math.random() * critMessages.length)]
              .replace('{attacker}', '🟢 Takımın');
            battleLog.push(critMsg);
          }
          currentHp.enemy -= damage;
          
          const hitMsg = hitMessages[Math.floor(Math.random() * hitMessages.length)]
            .replace('{target}', `${enemyTeam.emoji}`)
            .replace('{damage}', damage.toString());
          battleLog.push(`⚔️ Takımın saldırdı! ${hitMsg}`);
        }

        if (currentHp.enemy <= 0) break;

        const enemyDodge = Math.random() < (userStats.spd / (userStats.spd + 100));
        if (enemyDodge) {
          const dodgeMsg = dodgeMessages[Math.floor(Math.random() * dodgeMessages.length)]
            .replace('{target}', '🟢 Takımın');
          battleLog.push(dodgeMsg);
        } else {
          const enemyDamage = Math.max(1, Math.floor(enemyStats.str * (1 - userStats.def / (userStats.def + 100)) * (0.9 + Math.random() * 0.2)));
          currentHp.user -= enemyDamage;
          
          const hitMsg = hitMessages[Math.floor(Math.random() * hitMessages.length)]
            .replace('{target}', '🟢')
            .replace('{damage}', enemyDamage.toString());
          battleLog.push(`${enemyTeam.emoji} Düşman saldırdı! ${hitMsg}`);
        }
      } else {
        const enemyDodge = Math.random() < (userStats.spd / (userStats.spd + 100));
        if (enemyDodge) {
          const dodgeMsg = dodgeMessages[Math.floor(Math.random() * dodgeMessages.length)]
            .replace('{target}', '🟢 Takımın');
          battleLog.push(dodgeMsg);
        } else {
          const enemyDamage = Math.max(1, Math.floor(enemyStats.str * (1 - userStats.def / (userStats.def + 100)) * (0.9 + Math.random() * 0.2)));
          currentHp.user -= enemyDamage;
          
          const hitMsg = hitMessages[Math.floor(Math.random() * hitMessages.length)]
            .replace('{target}', '🟢')
            .replace('{damage}', enemyDamage.toString());
          battleLog.push(`${enemyTeam.emoji} Düşman saldırdı! ${hitMsg}`);
        }

        if (currentHp.user <= 0) break;

        const isCrit = Math.random() < 0.15;
        const isDodge = Math.random() < (enemyStats.spd / (enemyStats.spd + 100));
        
        if (isDodge) {
          const dodgeMsg = dodgeMessages[Math.floor(Math.random() * dodgeMessages.length)]
            .replace('{target}', `${enemyTeam.emoji} Düşman`);
          battleLog.push(dodgeMsg);
        } else {
          let damage = Math.max(1, Math.floor(userStats.str * (1 - enemyStats.def / (enemyStats.def + 100)) * (0.9 + Math.random() * 0.2)));
          if (isCrit) {
            damage = Math.floor(damage * 1.5);
            const critMsg = critMessages[Math.floor(Math.random() * critMessages.length)]
              .replace('{attacker}', '🟢 Takımın');
            battleLog.push(critMsg);
          }
          currentHp.enemy -= damage;
          
          const hitMsg = hitMessages[Math.floor(Math.random() * hitMessages.length)]
            .replace('{target}', `${enemyTeam.emoji}`)
            .replace('{damage}', damage.toString());
          battleLog.push(`⚔️ Takımın saldırdı! ${hitMsg}`);
        }
      }

      const battleEmbed = createBattleEmbed('battle', teamData.team, enemyTeam, userStats, enemyStats, currentHp, null, round, battleLog, teamData);
      await battleMsg.edit({ embeds: [battleEmbed] });
      await delay(1500);
    }

    const won = currentHp.enemy <= 0;
    const xpReward = won ? Math.floor(30 + Math.random() * 30) : 10;
    const moneyReward = won ? Math.floor(60 + Math.random() * 60) : 0;

    await letheStorage.addBattleReward(message.author.id, xpReward, moneyReward, won);

    const completedQuests = [];
    const battleQuests = await letheStorage.updateQuestProgress(message.author.id, 'battle', 1);
    completedQuests.push(...battleQuests);
    
    if (won) {
      const winQuests = await letheStorage.updateQuestProgress(message.author.id, 'battle_win', 1);
      completedQuests.push(...winQuests);
    }
    
    if (moneyReward > 0) {
      await letheStorage.updateQuestProgress(message.author.id, 'earn_money', moneyReward);
    }

    const resultEmbed = createBattleEmbed('result', teamData.team, enemyTeam, userStats, enemyStats, currentHp, null, round, battleLog, teamData, won);
    
    resultEmbed.addFields(
      { name: '🎯 Toplam Tur', value: `${round}`, inline: true },
      { name: '✨ Kazanılan XP', value: `+${xpReward}`, inline: true },
      { name: '💰 Kazanılan Para', value: `+${moneyReward}`, inline: true }
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

    resultEmbed.setFooter({ text: won ? '🎉 Tebrikler! Bir sonraki savaş için hazır ol!' : '💪 Takımını güçlendir ve tekrar dene!' });

    await battleMsg.edit({ embeds: [resultEmbed] });
  }
};
