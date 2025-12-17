const { EmbedBuilder } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');
const { weapons, armors, accessories } = require('../lethe/seedData');

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const bossDropRates = {
  rare: 0.40,
  epic: 0.35,
  legendary: 0.30,
  mythic: 0.25,
  hidden: 0.20
};

function getRandomBossLoot(rarity) {
  const roll = Math.random();
  if (roll > bossDropRates[rarity]) {
    return null;
  }
  
  const rarityWeapons = weapons.filter(w => w.rarity === rarity);
  const rarityArmors = armors.filter(a => a.rarity === rarity);
  const rarityAccessories = accessories.filter(a => a.rarity === rarity);
  
  const allItems = [
    ...rarityWeapons.map(w => ({ ...w, itemType: 'weapon' })),
    ...rarityArmors.map(a => ({ ...a, itemType: 'armor' })),
    ...rarityAccessories.map(a => ({ ...a, itemType: 'accessory' }))
  ];
  
  if (allItems.length === 0) {
    const lowerRarities = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
    const idx = lowerRarities.indexOf(rarity);
    if (idx > 0) {
      const lowerRarity = lowerRarities[idx - 1];
      const lowerWeapons = weapons.filter(w => w.rarity === lowerRarity);
      const lowerArmors = armors.filter(a => a.rarity === lowerRarity);
      const lowerAccessories = accessories.filter(a => a.rarity === lowerRarity);
      allItems.push(
        ...lowerWeapons.map(w => ({ ...w, itemType: 'weapon' })),
        ...lowerArmors.map(a => ({ ...a, itemType: 'armor' })),
        ...lowerAccessories.map(a => ({ ...a, itemType: 'accessory' }))
      );
    }
  }
  
  if (allItems.length === 0) return null;
  
  return allItems[Math.floor(Math.random() * allItems.length)];
}

function createHpBar(percent) {
  const filled = Math.round(percent / 10);
  const empty = 10 - filled;
  const color = percent > 60 ? '🟩' : percent > 30 ? '🟨' : '🟥';
  return color.repeat(filled) + '⬛'.repeat(empty) + ` ${percent}%`;
}

const battleAnimations = [
  ['⚔️', '💥', '✨', '🌟'],
  ['🗡️', '💢', '⚡', '💫'],
  ['🔥', '💨', '❄️', '🌀']
];

module.exports = {
  name: 'boss',
  aliases: ['bosssavas', 'bossfight'],
  description: 'Boss savaşına katıl',
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
    
    const { db } = require('../database/db');
    const { letheBosses } = require('../../shared/schema');

    const teamData = await letheStorage.getTeamWithEquipment(message.author.id);

    if (teamData.team.length < 3) {
      return message.reply('❌ Boss savaşı için tam takım gerekli! (3/3 hayvan)');
    }

    const bosses = await db.select().from(letheBosses);
    
    if (bosses.length === 0) {
      return message.reply('❌ Henüz boss tanımlanmamış!');
    }

    const profile = await letheStorage.getProfile(message.author.id);
    
    const availableBosses = bosses.filter(b => {
      if (b.bossId === 'young_dragon') return true;
      if (b.bossId === 'giant_kraken') return profile.level >= 5;
      if (b.bossId === 'skeleton_king') return profile.level >= 10;
      if (b.bossId === 'demon_lord') return profile.level >= 20;
      if (b.bossId === 'chaos_dragon') return profile.level >= 30;
      return true;
    });

    const boss = availableBosses[Math.floor(Math.random() * availableBosses.length)];
    const userStats = teamData.stats;

    const introEmbed = new EmbedBuilder()
      .setColor('#fbbf24')
      .setTitle('⚔️ BOSS SAVAŞI BAŞLIYOR! ⚔️')
      .setDescription('```\n' + '═'.repeat(30) + '\n```');

    let userTeamStr = teamData.team.map(t => {
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

    let bossStr = `${boss.emoji} **${boss.name}**\n┗ ❤️${boss.hp} ⚔️${boss.str} 🛡️${boss.def}`;

    introEmbed.addFields(
      { name: '🟢 Senin Takımın', value: userTeamStr || 'Boş', inline: true },
      { name: '⚔️', value: '\u200b', inline: true },
      { name: `🔴 ${boss.emoji} BOSS`, value: bossStr, inline: true }
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

    introEmbed.addFields(
      { name: '🎒 Ekipmanlarınız', value: userEquip || '*Ekipman yok*', inline: true },
      { name: '📊', value: '\u200b', inline: true },
      { name: '💀 Boss Özelliği', value: `Ödül: 💰 ${boss.rewardMoney}\nNadirlik: ${boss.rewardRarity}`, inline: true }
    );

    introEmbed.setTimestamp();
    const battleMsg = await message.reply({ embeds: [introEmbed] });

    await delay(2500);

    let userHp = userStats.hp;
    let bossHp = boss.hp;
    const battleLog = [];
    let round = 0;

    while (userHp > 0 && bossHp > 0 && round < 30) {
      round++;

      const userDamage = Math.max(1, Math.floor(userStats.str * (1 - boss.def / (boss.def + 100)) * (0.85 + Math.random() * 0.3)));
      bossHp -= userDamage;
      battleLog.push(`⚔️ Takımın **${userDamage}** hasar verdi!`);

      if (bossHp <= 0) break;

      const bossDamage = Math.max(1, Math.floor(boss.str * (1 - userStats.def / (userStats.def + 100)) * (0.9 + Math.random() * 0.2)));
      userHp -= bossDamage;
      battleLog.push(`💀 ${boss.emoji} **${bossDamage}** hasar verdi!`);

      if (round % 3 === 0 && round < 30) {
        const animSet = battleAnimations[Math.floor(Math.random() * battleAnimations.length)];
        const anim = animSet[Math.floor(Math.random() * animSet.length)];
        
        const userHpPercent = Math.max(0, Math.round((userHp / userStats.hp) * 100));
        const bossHpPercent = Math.max(0, Math.round((bossHp / boss.hp) * 100));

        const battleEmbed = new EmbedBuilder()
          .setColor('#ef4444')
          .setTitle(`${anim} TUR ${round} ${anim}`)
          .setDescription('```ansi\n\u001b[1;31m⚔️ BOSS SAVAŞI DEVAM EDİYOR ⚔️\u001b[0m\n```')
          .addFields(
            { name: '🟢 Takımın', value: `${createHpBar(userHpPercent)}\n❤️ ${Math.max(0, userHp)}/${userStats.hp}`, inline: true },
            { name: '⚔️ vs ⚔️', value: '\u200b', inline: true },
            { name: `🔴 ${boss.emoji} ${boss.name}`, value: `${createHpBar(bossHpPercent)}\n❤️ ${Math.max(0, bossHp)}/${boss.hp}`, inline: true }
          )
          .addFields({ name: '📜 Savaş Günlüğü', value: battleLog.slice(-4).join('\n') || '...', inline: false })
          .setTimestamp();

        await battleMsg.edit({ embeds: [battleEmbed] });
        await delay(1500);
      }
    }

    const won = bossHp <= 0;
    const xpReward = won ? boss.rewardMoney / 10 : 20;
    const moneyReward = won ? boss.rewardMoney : 0;

    await letheStorage.addBattleReward(message.author.id, xpReward, moneyReward, won, true);

    const completedQuests = [];
    const battleQuests = await letheStorage.updateQuestProgress(message.author.id, 'battle', 1);
    completedQuests.push(...battleQuests);
    
    if (won) {
      const bossQuests = await letheStorage.updateQuestProgress(message.author.id, 'boss_kill', 1);
      completedQuests.push(...bossQuests);
      const winQuests = await letheStorage.updateQuestProgress(message.author.id, 'battle_win', 1);
      completedQuests.push(...winQuests);
      
      if (moneyReward > 0) {
        await letheStorage.updateQuestProgress(message.author.id, 'earn_money', moneyReward);
      }
    }

    const resultEmbed = new EmbedBuilder()
      .setColor(won ? '#10b981' : '#ef4444')
      .setTitle(won ? `🏆 ${boss.emoji} ${boss.name} YENİLDİ! 🏆` : `💀 YENİLGİ! 💀`)
      .setDescription(won 
        ? `\`\`\`diff\n+ ${boss.name} mağlup edildi!\n\`\`\`` 
        : `\`\`\`diff\n- ${boss.name} çok güçlüydü...\n\`\`\``);

    resultEmbed.addFields(
      { name: `${won ? '🏆' : '💀'} Senin Takımın`, value: userTeamStr || 'Boş', inline: true },
      { name: won ? '✅' : '❌', value: '\u200b', inline: true },
      { name: `${won ? '💀' : '🏆'} ${boss.emoji} BOSS`, value: bossStr, inline: true }
    );

    resultEmbed.addFields(
      { name: '🎒 Ekipmanlarınız', value: userEquip || '*Ekipman yok*', inline: true },
      { name: '📊', value: '\u200b', inline: true },
      { name: '🎁 Ödüller', value: `💰 +${moneyReward}\n✨ +${Math.floor(xpReward)} XP`, inline: true }
    );

    resultEmbed.addFields(
      { name: '🎯 Tur Sayısı', value: `${round}`, inline: true }
    );

    let droppedItem = null;
    if (won) {
      droppedItem = getRandomBossLoot(boss.rewardRarity);
      
      if (droppedItem) {
        const itemId = droppedItem.weaponId || droppedItem.armorId || droppedItem.accessoryId;
        await letheStorage.addInventoryItem(message.author.id, itemId, droppedItem.itemType);
        
        const rarityColors = {
          common: '⬜', uncommon: '🟩', rare: '🟦', epic: '🟪', legendary: '🟨', mythic: '🟧', hidden: '🟥'
        };
        const rarityColor = rarityColors[droppedItem.rarity] || '⬜';
        const dropChance = Math.round(bossDropRates[boss.rewardRarity] * 100);
        
        resultEmbed.addFields({ 
          name: '🎁 Boss Ödülü!', 
          value: `${rarityColor} **${droppedItem.emoji} ${droppedItem.name}** düştü!\n*(%${dropChance} şans - ${boss.rewardRarity} nadirlik)*`, 
          inline: true 
        });
      } else {
        const dropChance = Math.round(bossDropRates[boss.rewardRarity] * 100);
        resultEmbed.addFields({ 
          name: '🎁 Bonus', 
          value: `Bu sefer eşya düşmedi.\n*(%${dropChance} şans - ${boss.rewardRarity} nadirlik)*`, 
          inline: true 
        });
      }
    }

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

    resultEmbed.setFooter({ text: won ? 'Tebrikler! Bir sonraki boss daha güçlü olacak!' : 'Takımını güçlendir ve tekrar dene!' })
      .setTimestamp();

    await battleMsg.edit({ embeds: [resultEmbed] });
  }
};
