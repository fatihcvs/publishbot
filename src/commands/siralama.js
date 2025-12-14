const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'siralama',
  aliases: ['leaderboard', 'lb', 'top', 'sıralama'],
  description: 'Sunucunun XP sıralamasını gösterir',
  async execute(message, args, client) {
    const storage = client.storage;
    const limit = Math.min(parseInt(args[0]) || 10, 25);

    try {
      const leaderboard = await storage.getLeaderboard(message.guild.id, limit);

      if (!leaderboard || leaderboard.length === 0) {
        return message.reply('Henüz sıralamada kimse yok! Mesaj yazarak XP kazanmaya başlayın.');
      }

      const medals = ['🥇', '🥈', '🥉'];
      let description = '';

      for (let i = 0; i < leaderboard.length; i++) {
        const user = leaderboard[i];
        const member = await message.guild.members.fetch(user.userId).catch(() => null);
        const username = member ? member.user.username : 'Bilinmeyen Kullanıcı';
        const medal = medals[i] || `**${i + 1}.**`;

        description += `${medal} ${username}\n`;
        description += `   ⭐ Seviye ${user.level} • ✨ ${user.xp.toLocaleString()} XP\n\n`;
      }

      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle(`🏆 ${message.guild.name} Sıralaması`)
        .setDescription(description)
        .setThumbnail(message.guild.iconURL({ dynamic: true }))
        .setFooter({ text: `Top ${leaderboard.length} üye gösteriliyor` })
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Leaderboard command error:', error);
      message.reply('Sıralama alınırken bir hata oluştu!');
    }
  }
};
