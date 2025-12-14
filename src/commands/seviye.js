const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'seviye',
  aliases: ['level', 'rank', 'xp'],
  description: 'Seviye ve XP bilgini gösterir',
  async execute(message, args, client) {
    const target = message.mentions.users.first() || message.author;
    const storage = client.storage;

    try {
      const userData = await storage.getUserLevel(message.guild.id, target.id);
      
      if (!userData) {
        return message.reply(`${target.id === message.author.id ? 'Henüz' : `${target.username} henüz`} hiç XP kazanmamış!`);
      }

      const rank = await storage.getUserRank(message.guild.id, target.id);
      const currentLevelXp = storage.getXpForLevel(userData.level);
      const nextLevelXp = storage.getXpForLevel(userData.level + 1);
      const xpInCurrentLevel = userData.xp - currentLevelXp;
      const xpNeeded = nextLevelXp - currentLevelXp;
      const progress = Math.round((xpInCurrentLevel / xpNeeded) * 100);

      const progressBar = createProgressBar(xpInCurrentLevel, xpNeeded, 15);

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setAuthor({ 
          name: target.username, 
          iconURL: target.displayAvatarURL({ dynamic: true }) 
        })
        .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 256 }))
        .addFields(
          { name: '📊 Sıralama', value: `#${rank || '?'}`, inline: true },
          { name: '⭐ Seviye', value: `${userData.level}`, inline: true },
          { name: '✨ Toplam XP', value: `${userData.xp.toLocaleString()}`, inline: true },
          { name: '📈 İlerleme', value: `${progressBar}\n${xpInCurrentLevel}/${xpNeeded} XP (${progress}%)`, inline: false },
          { name: '💬 Mesaj Sayısı', value: `${userData.totalMessages?.toLocaleString() || 0}`, inline: true }
        )
        .setFooter({ text: `Sonraki seviye için ${xpNeeded - xpInCurrentLevel} XP gerekli` })
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Level command error:', error);
      message.reply('Seviye bilgisi alınırken bir hata oluştu!');
    }
  }
};

function createProgressBar(current, max, length = 10) {
  const progress = Math.round((current / max) * length);
  const filled = '█'.repeat(Math.min(progress, length));
  const empty = '░'.repeat(Math.max(length - progress, 0));
  return `[${filled}${empty}]`;
}
