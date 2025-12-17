const { EmbedBuilder } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');

module.exports = {
  name: 'günlük',
  aliases: ['gn', 'gunluk', 'daily', 'ödül'],
  description: 'Günlük ödülünü al',
  usage: '!günlük',
  category: 'lethe',
  
  async execute(message, args, client) {
    const userId = message.author.id;
    
    try {
      const subCommand = args[0]?.toLowerCase();
      
      if (subCommand === 'durum' || subCommand === 'status') {
        const status = await letheStorage.getDailyStatus(userId);
        
        const embed = new EmbedBuilder()
          .setColor('#F59E0B')
          .setTitle('📅 Günlük Ödül Durumu')
          .setThumbnail(message.author.displayAvatarURL())
          .addFields(
            { name: '🔥 Mevcut Seri', value: `${status.currentStreak} gün`, inline: true },
            { name: '🏆 En Uzun Seri', value: `${status.longestStreak} gün`, inline: true },
            { name: '📊 Toplam', value: `${status.totalClaims} kez`, inline: true }
          );
        
        if (status.canClaim) {
          embed.addFields({
            name: '✅ Durum',
            value: `**Ödülünü alabilirsin!** \`!günlük\` yaz.`,
            inline: false
          });
        } else {
          embed.addFields({
            name: '⏳ Durum',
            value: `**${status.hoursLeft} saat** sonra tekrar gel.`,
            inline: false
          });
        }
        
        const rewardsPreview = status.allRewards.map((r, i) => {
          const current = i === (status.currentStreak % 7) ? '➡️' : '';
          const bonus = r.bonus ? ' + 📦 Sandık' : '';
          return `${current} Gün ${r.day}: **${r.money} 💰**${bonus}`;
        }).join('\n');
        
        embed.addFields({
          name: '🎁 Ödül Takvimi',
          value: rewardsPreview,
          inline: false
        });
        
        return message.reply({ embeds: [embed] });
      }
      
      const result = await letheStorage.claimDailyReward(userId, message.guild.id);
      
      if (!result.success) {
        const status = await letheStorage.getDailyStatus(userId);
        
        const embed = new EmbedBuilder()
          .setColor('#EF4444')
          .setTitle('⏳ Günlük Ödül')
          .setDescription(result.error)
          .addFields(
            { name: '🔥 Mevcut Seri', value: `${status.currentStreak} gün`, inline: true },
            { name: '⏰ Kalan Süre', value: `${status.hoursLeft} saat`, inline: true }
          );
        
        return message.reply({ embeds: [embed] });
      }
      
      let moneyText = `+${result.money} 💰`;
      if (result.isVip && result.vipBonus > 0) {
        moneyText = `+${result.baseMoney} (+${result.vipBonus} VIP) 💰`;
      }
      
      const embed = new EmbedBuilder()
        .setColor(result.isVip ? '#FFD700' : '#10B981')
        .setTitle(result.isVip ? '🌟 VIP Günlük Ödül Alındı!' : '🎁 Günlük Ödül Alındı!')
        .setThumbnail(message.author.displayAvatarURL())
        .addFields(
          { name: '📅 Gün', value: `${result.day}/7`, inline: true },
          { name: '💰 Para', value: moneyText, inline: true },
          { name: '🔥 Seri', value: `${result.day} gün`, inline: true }
        );
      
      if (result.isVip) {
        embed.addFields({
          name: '🌟 VIP Bonus',
          value: `+%50 ekstra günlük ödül!`,
          inline: false
        });
      }
      
      if (result.bonus) {
        embed.addFields({
          name: '🎊 Bonus Ödül!',
          value: `📦 **${result.bonus.id}** x${result.bonus.quantity}`,
          inline: false
        });
      }
      
      if (result.nextReward) {
        const nextBonus = result.nextReward.bonus ? ' + 📦 Sandık' : '';
        embed.addFields({
          name: '📆 Yarınki Ödül',
          value: `**${result.nextReward.money} 💰**${nextBonus}`,
          inline: false
        });
      }
      
      embed.setFooter({ text: result.isVip ? '🌟 VIP Sunucu Bonusları Aktif!' : '7 gün üst üste gel ve bonus sandık kazan!' });
      
      return message.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Daily reward error:', error);
      return message.reply('Günlük ödül alınırken bir hata oluştu!');
    }
  }
};
