const { EmbedBuilder } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');

module.exports = {
  name: 'görev',
  aliases: ['gorev', 'quest', 'quests', 'görevler'],
  description: 'Günlük ve haftalık görevleri görüntüle',
  usage: '!görev [günlük/haftalık/ödül <görev_id>]',
  category: 'lethe',
  
  async execute(message, args, client) {
    const userId = message.author.id;
    
    try {
      const subCommand = args[0]?.toLowerCase();
      
      if (subCommand === 'ödül' || subCommand === 'odul' || subCommand === 'claim') {
        const questId = args[1];
        if (!questId) {
          return message.reply('Hangi görevin ödülünü almak istediğini belirt! Örnek: `!görev ödül daily_first_hunt`');
        }
        
        const result = await letheStorage.claimQuestReward(userId, questId);
        
        if (!result.success) {
          return message.reply(result.error);
        }
        
        const embed = new EmbedBuilder()
          .setColor('#10B981')
          .setTitle('🎁 Görev Ödülü Alındı!')
          .setDescription(`**${result.quest.emoji} ${result.quest.name}** görevi tamamlandı!`)
          .addFields(
            { name: '💰 Para', value: `+${result.quest.rewardMoney.toLocaleString()}`, inline: true },
            { name: '✨ XP', value: `+${result.quest.rewardXp}`, inline: true }
          );
        
        if (result.quest.rewardItem) {
          embed.addFields({ name: '🎁 Bonus Eşya', value: result.quest.rewardItem, inline: true });
        }
        
        return message.reply({ embeds: [embed] });
      }
      
      const quests = await letheStorage.getUserQuests(userId);
      
      if (quests.length === 0) {
        return message.reply('Henüz görev bulunmuyor. Birazdan tekrar dene!');
      }
      
      const dailyQuests = quests.filter(q => q.questInfo.type === 'daily' && !q.completed && !q.claimed);
      const weeklyQuests = quests.filter(q => q.questInfo.type === 'weekly' && !q.completed && !q.claimed);
      
      const showDaily = !subCommand || subCommand === 'günlük' || subCommand === 'gunluk' || subCommand === 'daily';
      const showWeekly = !subCommand || subCommand === 'haftalık' || subCommand === 'haftalik' || subCommand === 'weekly';
      
      const allDaily = quests.filter(q => q.questInfo.type === 'daily');
      const allWeekly = quests.filter(q => q.questInfo.type === 'weekly');
      const completedDaily = allDaily.filter(q => q.completed || q.claimed).length;
      const completedWeekly = allWeekly.filter(q => q.completed || q.claimed).length;
      
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('📋 Lethe Game - Görevler')
        .setDescription(`✅ **Tamamlanan:** Günlük ${completedDaily}/${allDaily.length} | Haftalık ${completedWeekly}/${allWeekly.length}`)
        .setThumbnail(message.author.displayAvatarURL())
        .setFooter({ text: 'Görevler tamamlandığında ödüller otomatik verilir!' });
      
      if (showDaily) {
        if (dailyQuests.length === 0) {
          embed.addFields({
            name: `📅 Günlük Görevler`,
            value: completedDaily === allDaily.length ? '🎉 Tüm günlük görevler tamamlandı!' : 'Aktif görev yok',
            inline: false
          });
          
          if (completedDaily === allDaily.length) {
            embed.addFields({
              name: '🎊 Günlük Bonus',
              value: '**1,000 💰 + 50 XP + 1 Gümüş Sandık** kazandın!',
              inline: false
            });
          }
        } else {
          const dailyList = dailyQuests.map(q => {
            const qi = q.questInfo;
            const progress = `${q.progress}/${qi.targetValue}`;
            const progressBar = createProgressBar(q.progress, qi.targetValue);
            return `⏳ ${qi.emoji} **${qi.name}**\n${qi.description}\n${progressBar} ${progress}\n💰 ${qi.rewardMoney.toLocaleString()} | ✨ ${qi.rewardXp} XP`;
          }).join('\n\n');
          
          embed.addFields({
            name: `📅 Günlük Görevler (${dailyQuests.length} kalan)`,
            value: dailyList,
            inline: false
          });
        }
      }
      
      if (showWeekly) {
        if (weeklyQuests.length === 0) {
          embed.addFields({
            name: `📆 Haftalık Görevler`,
            value: completedWeekly === allWeekly.length ? '🎉 Tüm haftalık görevler tamamlandı!' : 'Aktif görev yok',
            inline: false
          });
          
          if (completedWeekly === allWeekly.length) {
            embed.addFields({
              name: '🎊 Haftalık Bonus',
              value: '**15,000 💰 + 500 XP + 1 Elmas Sandık** kazandın!',
              inline: false
            });
          }
        } else {
          const weeklyList = weeklyQuests.map(q => {
            const qi = q.questInfo;
            const progress = `${q.progress}/${qi.targetValue}`;
            const progressBar = createProgressBar(q.progress, qi.targetValue);
            return `⏳ ${qi.emoji} **${qi.name}**\n${qi.description}\n${progressBar} ${progress}\n💰 ${qi.rewardMoney.toLocaleString()} | ✨ ${qi.rewardXp} XP`;
          }).join('\n\n');
          
          embed.addFields({
            name: `📆 Haftalık Görevler (${weeklyQuests.length} kalan)`,
            value: weeklyList,
            inline: false
          });
        }
      }
      
      const nextDailyReset = getNextReset('daily');
      const nextWeeklyReset = getNextReset('weekly');
      
      embed.addFields({
        name: '⏰ Sıfırlanma Zamanları',
        value: `Günlük: <t:${Math.floor(nextDailyReset.getTime() / 1000)}:R>\nHaftalık: <t:${Math.floor(nextWeeklyReset.getTime() / 1000)}:R>`,
        inline: false
      });
      
      return message.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Quest command error:', error);
      return message.reply('Görevler yüklenirken bir hata oluştu!');
    }
  }
};

function createProgressBar(current, max) {
  const percentage = Math.min(current / max, 1);
  const filled = Math.round(percentage * 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function getNextReset(type) {
  const now = new Date();
  if (type === 'daily') {
    const tomorrow = new Date(now);
    tomorrow.setUTCHours(0, 0, 0, 0);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    return tomorrow;
  } else {
    const nextMonday = new Date(now);
    nextMonday.setUTCHours(0, 0, 0, 0);
    const daysUntilMonday = (8 - nextMonday.getUTCDay()) % 7 || 7;
    nextMonday.setUTCDate(nextMonday.getUTCDate() + daysUntilMonday);
    return nextMonday;
  }
}
