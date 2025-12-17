const { EmbedBuilder } = require('discord.js');
const { storage } = require('../../database/storage');

module.exports = {
  name: 'gleaderboard',
  aliases: ['glb', 'gsiralama', 'oyunsiralama', 'gameleaderboard'],
  description: 'Oyun sıralamasını gösterir',
  usage: '!gleaderboard',
  
  async execute(message, args, client) {
    const leaderboard = await storage.getGamingLeaderboard(message.guild.id, 10);

    if (leaderboard.length === 0) {
      return message.reply('Henüz kimse oyun oynamamış!');
    }

    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

    let description = '';
    for (let i = 0; i < leaderboard.length; i++) {
      const entry = leaderboard[i];
      let username = 'Bilinmeyen';
      
      try {
        const member = await message.guild.members.fetch(entry.userId);
        username = member.user.username;
      } catch (e) {}

      const netProfit = (entry.totalWon || 0) - (entry.totalLost || 0);
      const winRate = entry.gamesPlayed > 0 
        ? ((entry.gamesWon / entry.gamesPlayed) * 100).toFixed(0) 
        : 0;

      description += `${medals[i]} **${username}**\n`;
      description += `   💰 ${entry.totalWon || 0} kazanç | 📊 %${winRate} kazanma\n\n`;
    }

    const embed = new EmbedBuilder()
      .setTitle('🏆 Oyun Sıralaması')
      .setColor('#ffd700')
      .setDescription(description)
      .setFooter({ text: `${message.guild.name} • Toplam kazanca göre sıralanmış` });

    message.reply({ embeds: [embed] });
  }
};
