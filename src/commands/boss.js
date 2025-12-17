const { EmbedBuilder } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');

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

    let userHp = userStats.hp;
    let bossHp = boss.hp;
    const battleLog = [];
    let round = 0;

    while (userHp > 0 && bossHp > 0 && round < 30) {
      round++;

      const userDamage = Math.max(1, Math.floor(userStats.str * (1 - boss.def / (boss.def + 100)) * (0.85 + Math.random() * 0.3)));
      bossHp -= userDamage;
      battleLog.push(`⚔️ Takımın **${userDamage}** hasar verdi! (Boss HP: ${Math.max(0, bossHp)})`);

      if (bossHp <= 0) break;

      const bossDamage = Math.max(1, Math.floor(boss.str * (1 - userStats.def / (userStats.def + 100)) * (0.9 + Math.random() * 0.2)));
      userHp -= bossDamage;
      battleLog.push(`💀 ${boss.emoji} **${bossDamage}** hasar verdi! (Takım HP: ${Math.max(0, userHp)})`);
    }

    const won = bossHp <= 0;
    const xpReward = won ? boss.rewardMoney / 10 : 20;
    const moneyReward = won ? boss.rewardMoney : 0;

    await letheStorage.addBattleReward(message.author.id, xpReward, moneyReward, won, true);

    const lastLogs = battleLog.slice(-8).join('\n');

    let equipmentStr = '';
    if (teamData.weapon.name) equipmentStr += `⚔️ ${teamData.weapon.emoji || ''} ${teamData.weapon.name} (+${teamData.weapon.damage} hasar)\n`;
    if (teamData.armor.name) equipmentStr += `🛡️ ${teamData.armor.emoji || ''} ${teamData.armor.name} (+${teamData.armor.defense} savunma)\n`;

    const embed = new EmbedBuilder()
      .setColor(won ? '#10b981' : '#ef4444')
      .setTitle(won ? `🏆 ${boss.emoji} ${boss.name} Yenildi!` : `💀 ${boss.emoji} ${boss.name} Kazandı!`)
      .setDescription(won ? 'Boss savaşını kazandın!' : 'Boss çok güçlüydü...')
      .addFields(
        { name: '📜 Savaş Özeti', value: lastLogs || 'Savaş hızlıca bitti!', inline: false },
        { name: '🎯 Tur', value: `${round}`, inline: true },
        { name: '✨ XP', value: `+${Math.floor(xpReward)}`, inline: true },
        { name: '💰 Para', value: `+${moneyReward}`, inline: true }
      )
      .setFooter({ text: won ? 'Tebrikler! Bir sonraki boss daha güçlü olacak!' : 'Takımını güçlendir ve tekrar dene!' })
      .setTimestamp();

    if (equipmentStr) {
      embed.addFields({ name: '🎒 Ekipman Bonusları', value: equipmentStr, inline: false });
    }

    if (won) {
      embed.addFields({ name: '🎁 Ödül', value: `${boss.rewardRarity} nadirliğinde eşya şansı!`, inline: false });
    }

    await message.reply({ embeds: [embed] });
  }
};
