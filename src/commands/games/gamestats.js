const { EmbedBuilder } = require('discord.js');
const { storage } = require('../../database/storage');

module.exports = {
  name: 'gamestats',
  aliases: ['oyunistatistik', 'gstats', 'mystats'],
  description: 'Oyun istatistiklerini gösterir',
  usage: '!gamestats [@kullanici]',
  
  async execute(message, args, client) {
    const target = message.mentions.users.first() || message.author;
    
    const stats = await storage.getUserStats(message.guild.id, target.id);
    const eco = await storage.getUserEconomy(message.guild.id, target.id);

    if (!stats && !eco) {
      return message.reply(`${target.id === message.author.id ? 'Henüz' : `${target.username} henüz`} hiç oyun oynamamış!`);
    }

    const gamesPlayed = stats?.gamesPlayed || 0;
    const gamesWon = stats?.gamesWon || 0;
    const gamesLost = stats?.gamesLost || 0;
    const winRate = gamesPlayed > 0 ? ((gamesWon / gamesPlayed) * 100).toFixed(1) : 0;
    const totalWon = stats?.totalWon || 0;
    const totalLost = stats?.totalLost || 0;
    const netProfit = totalWon - totalLost;
    const biggestWin = stats?.biggestWin || 0;

    const embed = new EmbedBuilder()
      .setTitle(`🎮 ${target.username} - Oyun İstatistikleri`)
      .setColor('#5865F2')
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: '🎯 Oyunlar', value: `
Oynanan: **${gamesPlayed}**
Kazanılan: **${gamesWon}** ✅
Kaybedilen: **${gamesLost}** ❌
Kazanma Oranı: **${winRate}%**
        `, inline: true },
        { name: '💰 Para', value: `
Toplam Kazanç: **${totalWon}** coin
Toplam Kayıp: **${totalLost}** coin
Net Kar/Zarar: **${netProfit >= 0 ? '+' : ''}${netProfit}** coin
En Büyük Kazanç: **${biggestWin}** coin
        `, inline: true }
      );

    const fishCaught = stats?.fishCaught || 0;
    const oresMined = stats?.oresMined || 0;
    const animalsHunted = stats?.animalsHunted || 0;
    const robberyAttempts = stats?.robberyAttempts || 0;
    const robberySuccess = stats?.robberySuccess || 0;

    if (fishCaught > 0 || oresMined > 0 || animalsHunted > 0 || robberyAttempts > 0) {
      embed.addFields({
        name: '🌟 Aktiviteler',
        value: `
🎣 Balık: **${fishCaught}**
⛏️ Maden: **${oresMined}**
🏹 Av: **${animalsHunted}**
💰 Soygun: **${robberySuccess}/${robberyAttempts}**
        `,
        inline: false
      });
    }

    const streak = await storage.getDailyStreak(message.guild.id, target.id);
    if (streak) {
      embed.addFields({
        name: '🔥 Streak',
        value: `Mevcut: **${streak.currentStreak}** gün | En Uzun: **${streak.longestStreak}** gün`,
        inline: false
      });
    }

    embed.setFooter({ text: `Bakiye: ${(eco?.balance || 0) + (eco?.bank || 0)} coin` });

    message.reply({ embeds: [embed] });
  }
};
