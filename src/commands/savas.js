const { EmbedBuilder } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');

module.exports = {
  name: 'savas',
  aliases: ['savaş', 'battle', 'fight'],
  description: 'Bot ile savaş',
  category: 'lethe',
  async execute(message, args, client, storage) {
    const team = await letheStorage.getTeam(message.guild.id, message.author.id);

    if (team.length === 0) {
      return message.reply('❌ Takımın boş! Önce `!takımekle <hayvan_id>` ile hayvan ekle.');
    }

    const userStats = {
      hp: team.reduce((sum, t) => sum + t.userAnimal.hp, 0),
      str: team.reduce((sum, t) => sum + t.userAnimal.str, 0),
      def: team.reduce((sum, t) => sum + t.userAnimal.def, 0),
      spd: Math.round(team.reduce((sum, t) => sum + t.userAnimal.spd, 0) / team.length)
    };

    const difficulty = Math.min(3, Math.max(1, Math.ceil(team.length)));
    const enemyBase = {
      hp: 80 + (difficulty * 40),
      str: 15 + (difficulty * 8),
      def: 10 + (difficulty * 5),
      spd: 10 + (difficulty * 3)
    };

    const enemies = [
      { name: 'Vahşi Kurt', emoji: '🐺' },
      { name: 'Kızgın Ayı', emoji: '🐻' },
      { name: 'Zehirli Yılan', emoji: '🐍' },
      { name: 'Büyük Kartal', emoji: '🦅' },
      { name: 'Yaban Domuzu', emoji: '🐗' },
      { name: 'Gizli Tilki', emoji: '🦊' }
    ];

    const enemy = enemies[Math.floor(Math.random() * enemies.length)];
    const enemyStats = { ...enemyBase };

    let userHp = userStats.hp;
    let enemyHp = enemyStats.hp;
    const battleLog = [];
    let round = 0;

    const userFirst = userStats.spd >= enemyStats.spd;

    while (userHp > 0 && enemyHp > 0 && round < 20) {
      round++;

      if (userFirst) {
        const userDamage = Math.max(1, Math.floor(userStats.str * (1 - enemyStats.def / (enemyStats.def + 100)) * (0.9 + Math.random() * 0.2)));
        enemyHp -= userDamage;
        battleLog.push(`⚔️ Takımın **${userDamage}** hasar verdi!`);

        if (enemyHp <= 0) break;

        const enemyDamage = Math.max(1, Math.floor(enemyStats.str * (1 - userStats.def / (userStats.def + 100)) * (0.9 + Math.random() * 0.2)));
        userHp -= enemyDamage;
        battleLog.push(`💥 ${enemy.emoji} **${enemyDamage}** hasar verdi!`);
      } else {
        const enemyDamage = Math.max(1, Math.floor(enemyStats.str * (1 - userStats.def / (userStats.def + 100)) * (0.9 + Math.random() * 0.2)));
        userHp -= enemyDamage;
        battleLog.push(`💥 ${enemy.emoji} **${enemyDamage}** hasar verdi!`);

        if (userHp <= 0) break;

        const userDamage = Math.max(1, Math.floor(userStats.str * (1 - enemyStats.def / (enemyStats.def + 100)) * (0.9 + Math.random() * 0.2)));
        enemyHp -= userDamage;
        battleLog.push(`⚔️ Takımın **${userDamage}** hasar verdi!`);
      }
    }

    const won = enemyHp <= 0;
    const xpReward = won ? 20 + (difficulty * 15) : 5;
    const moneyReward = won ? 30 + (difficulty * 25) : 0;

    const profile = await letheStorage.getProfile(message.guild.id, message.author.id);

    const { db } = require('../database/db');
    const { userLetheProfile, userEconomy } = require('../../shared/schema');
    const { eq, and, sql } = require('drizzle-orm');

    await db.update(userLetheProfile)
      .set({
        totalBattles: sql`${userLetheProfile.totalBattles} + 1`,
        battlesWon: won ? sql`${userLetheProfile.battlesWon} + 1` : userLetheProfile.battlesWon,
        xp: sql`${userLetheProfile.xp} + ${xpReward}`
      })
      .where(and(eq(userLetheProfile.guildId, message.guild.id), eq(userLetheProfile.visitorId, message.author.id)));

    if (moneyReward > 0) {
      const economy = await db.select().from(userEconomy)
        .where(and(eq(userEconomy.guildId, message.guild.id), eq(userEconomy.userId, message.author.id)))
        .limit(1);

      if (economy.length > 0) {
        await db.update(userEconomy)
          .set({ balance: sql`${userEconomy.balance} + ${moneyReward}` })
          .where(and(eq(userEconomy.guildId, message.guild.id), eq(userEconomy.userId, message.author.id)));
      }
    }

    const lastLogs = battleLog.slice(-6).join('\n');

    const embed = new EmbedBuilder()
      .setColor(won ? '#10b981' : '#ef4444')
      .setTitle(won ? '🏆 Zafer!' : '💀 Yenildin!')
      .setDescription(`${enemy.emoji} **${enemy.name}** ile savaştın!`)
      .addFields(
        { name: '📜 Savaş', value: lastLogs || 'Savaş çok hızlı bitti!', inline: false },
        { name: '🎯 Sonuç', value: won ? `Düşman yenildi! (${round} tur)` : `Takımın yenildi! (${round} tur)`, inline: true },
        { name: '✨ XP', value: `+${xpReward}`, inline: true },
        { name: '💰 Para', value: `+${moneyReward}`, inline: true }
      )
      .setFooter({ text: 'Takımını güçlendirmek için daha fazla hayvan ekle!' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
