const { EmbedBuilder } = require('discord.js');

const ACHIEVEMENT_LIST = {
  first_message: { name: 'İlk Adım', description: 'İlk mesajını gönder', emoji: '👋' },
  level_5: { name: 'Yeni Başlayan', description: 'Seviye 5\'e ulaş', emoji: '⭐' },
  level_10: { name: 'Aktif Üye', description: 'Seviye 10\'a ulaş', emoji: '🌟' },
  level_25: { name: 'Deneyimli', description: 'Seviye 25\'e ulaş', emoji: '💫' },
  level_50: { name: 'Efsane', description: 'Seviye 50\'ye ulaş', emoji: '🏆' },
  messages_100: { name: 'Konuşkan', description: '100 mesaj gönder', emoji: '💬' },
  messages_1000: { name: 'Sohbet Ustası', description: '1000 mesaj gönder', emoji: '🗣️' },
  week_streak: { name: 'Haftalık Seri', description: '7 gün üst üste aktif ol', emoji: '🔥' },
  inviter: { name: 'Davetçi', description: '5 kişiyi sunucuya davet et', emoji: '📨' },
  helper: { name: 'Yardımsever', description: '10 kişiye yardım et', emoji: '🤝' }
};

module.exports = {
  name: 'başarımlar',
  aliases: ['achievements', 'basarimlar', 'rozetler'],
  description: 'Başarımlarını görüntüler',
  async execute(message, args, client) {
    const { storage } = require('../database/storage');
    const target = message.mentions.users.first() || message.author;

    const userAchievements = await storage.getUserAchievements(message.guild.id, target.id) || [];
    const userLevel = await storage.getUserLevel(message.guild.id, target.id);

    // Otomatik başarım kontrolü
    const earnedAchievements = new Set(
      Array.isArray(userAchievements) 
        ? userAchievements.map(a => typeof a === 'string' ? a : a.achievementId)
        : []
    );

    // Seviye başarımları kontrolü
    if (userLevel) {
      if (userLevel.level >= 5 && !earnedAchievements.has('level_5')) {
        await storage.addAchievement(message.guild.id, target.id, 'level_5');
        earnedAchievements.add('level_5');
      }
      if (userLevel.level >= 10 && !earnedAchievements.has('level_10')) {
        await storage.addAchievement(message.guild.id, target.id, 'level_10');
        earnedAchievements.add('level_10');
      }
      if (userLevel.level >= 25 && !earnedAchievements.has('level_25')) {
        await storage.addAchievement(message.guild.id, target.id, 'level_25');
        earnedAchievements.add('level_25');
      }
      if (userLevel.level >= 50 && !earnedAchievements.has('level_50')) {
        await storage.addAchievement(message.guild.id, target.id, 'level_50');
        earnedAchievements.add('level_50');
      }
      if (userLevel.totalMessages >= 100 && !earnedAchievements.has('messages_100')) {
        await storage.addAchievement(message.guild.id, target.id, 'messages_100');
        earnedAchievements.add('messages_100');
      }
      if (userLevel.totalMessages >= 1000 && !earnedAchievements.has('messages_1000')) {
        await storage.addAchievement(message.guild.id, target.id, 'messages_1000');
        earnedAchievements.add('messages_1000');
      }
    }

    let achievementsText = '';
    let lockedText = '';

    for (const [key, achievement] of Object.entries(ACHIEVEMENT_LIST)) {
      if (earnedAchievements.has(key)) {
        achievementsText += `${achievement.emoji} **${achievement.name}**\n${achievement.description}\n\n`;
      } else {
        lockedText += `🔒 ~~${achievement.name}~~\n`;
      }
    }

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle(`🏅 ${target.username}'in Başarımları`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(achievementsText || 'Henüz başarım kazanılmadı!')
      .setFooter({ text: `${earnedAchievements.size}/${Object.keys(ACHIEVEMENT_LIST).length} başarım` })
      .setTimestamp();

    if (lockedText) {
      embed.addFields({ name: 'Kilitli Başarımlar', value: lockedText });
    }

    message.reply({ embeds: [embed] });
  }
};
