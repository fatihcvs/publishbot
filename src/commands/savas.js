const { EmbedBuilder } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');

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
    const difficultyMultiplier = 1 + (profile.level * 0.1);

    const enemy = {
      name: ['Vahşi Kurt', 'Kızgın Ayı', 'Zehirli Yılan', 'Gölge Kurdu', 'Orman Canavarı'][Math.floor(Math.random() * 5)],
      emoji: ['🐺', '🐻', '🐍', '🌑', '👹'][Math.floor(Math.random() * 5)],
      hp: Math.floor((50 + Math.random() * 50) * difficultyMultiplier),
      str: Math.floor((20 + Math.random() * 20) * difficultyMultiplier),
      def: Math.floor((10 + Math.random() * 15) * difficultyMultiplier)
    };

    let userHp = userStats.hp;
    let enemyHp = enemy.hp;
    const battleLog = [];
    let round = 0;

    while (userHp > 0 && enemyHp > 0 && round < 20) {
      round++;

      const userDamage = Math.max(1, Math.floor(userStats.str * (1 - enemy.def / (enemy.def + 100)) * (0.9 + Math.random() * 0.2)));
      enemyHp -= userDamage;
      battleLog.push(`⚔️ Takımın **${userDamage}** hasar verdi!`);

      if (enemyHp <= 0) break;

      const enemyDamage = Math.max(1, Math.floor(enemy.str * (1 - userStats.def / (userStats.def + 100)) * (0.9 + Math.random() * 0.2)));
      userHp -= enemyDamage;
      battleLog.push(`${enemy.emoji} ${enemy.name} **${enemyDamage}** hasar verdi!`);
    }

    const won = enemyHp <= 0;
    const xpReward = won ? Math.floor(30 + Math.random() * 20) : 10;
    const moneyReward = won ? Math.floor(50 + Math.random() * 50) : 0;

    await letheStorage.addBattleReward(message.author.id, xpReward, moneyReward, won);

    // Update quest progress
    const completedQuests = [];
    const battleQuests = await letheStorage.updateQuestProgress(message.author.id, 'battle', 1);
    completedQuests.push(...battleQuests);
    
    if (won) {
      const winQuests = await letheStorage.updateQuestProgress(message.author.id, 'battle_win', 1);
      completedQuests.push(...winQuests);
    }
    
    // Update earn money quest
    if (moneyReward > 0) {
      await letheStorage.updateQuestProgress(message.author.id, 'earn_money', moneyReward);
    }

    const lastLogs = battleLog.slice(-6).join('\n');

    let equipmentStr = '';
    if (teamData.weapon.name) equipmentStr += `⚔️ ${teamData.weapon.emoji || ''} ${teamData.weapon.name} (+${teamData.weapon.damage} hasar)\n`;
    if (teamData.armor.name) equipmentStr += `🛡️ ${teamData.armor.emoji || ''} ${teamData.armor.name} (+${teamData.armor.defense} savunma)\n`;

    const embed = new EmbedBuilder()
      .setColor(won ? '#10b981' : '#ef4444')
      .setTitle(won ? `🏆 Zafer! ${enemy.emoji} ${enemy.name} yenildi!` : `💀 Yenilgi! ${enemy.emoji} ${enemy.name} kazandı!`)
      .setDescription(won ? 'Savaşı kazandın!' : 'Takımın yenildi...')
      .addFields(
        { name: '📜 Savaş', value: lastLogs || 'Savaş çok hızlı bitti!', inline: false },
        { name: '🎯 Tur', value: `${round}`, inline: true },
        { name: '✨ XP', value: `+${xpReward}`, inline: true },
        { name: '💰 Para', value: `+${moneyReward}`, inline: true }
      )
      .setFooter({ text: 'Takımını güçlendir ve tekrar dene!' })
      .setTimestamp();

    if (equipmentStr) {
      embed.addFields({ name: '🎒 Ekipman Bonusları', value: equipmentStr, inline: false });
    }

    // Show completed quests with rewards
    if (completedQuests.length > 0) {
      for (const q of completedQuests) {
        let rewardText = [];
        if (q.rewards?.coins > 0) rewardText.push(`+${q.rewards.coins}💰`);
        if (q.rewards?.xp > 0) rewardText.push(`+${q.rewards.xp}✨`);
        if (q.rewards?.item) rewardText.push(`+1 ${q.rewards.item.type}`);
        embed.addFields({ 
          name: `🎯 ${q.questInfo.emoji} ${q.questInfo.name} Tamamlandı!`, 
          value: rewardText.length > 0 ? `Ödül: ${rewardText.join(' ')}` : 'Tamamlandı!', 
          inline: false 
        });
      }
    }

    await message.reply({ embeds: [embed] });
  }
};
