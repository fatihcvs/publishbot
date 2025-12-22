const { EmbedBuilder } = require('discord.js');
const { eventSystem, EVENT_EMOJIS } = require('../lethe/eventSystem');

module.exports = {
  name: 'etkinlik',
  aliases: ['event', 'events', 'etkinlikler'],
  description: 'Aktif etkinlikleri ve topluluk hedeflerini görüntüle',
  category: 'lethe',
  
  async execute(message, args, client) {
    const subCommand = args[0]?.toLowerCase();
    
    if (subCommand === 'topluluk' || subCommand === 'community' || subCommand === 'hedef') {
      return this.showCommunityGoals(message, client);
    }
    
    if (subCommand === 'ödül' || subCommand === 'odul' || subCommand === 'claim') {
      const goalId = args[1];
      if (!goalId) {
        return message.reply('❌ Kullanım: `!etkinlik ödül <hedef_id>`');
      }
      return this.claimReward(message, goalId, client);
    }
    
    return this.showActiveEvents(message, client);
  },

  async showActiveEvents(message, client) {
    const events = eventSystem.getActiveEvents();
    const goals = eventSystem.getActiveCommunityGoals();
    
    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle('🎉 Lethe Game Etkinlikleri')
      .setDescription('Aktif etkinlikler ve bonuslar')
      .setTimestamp();

    if (events.length === 0 && goals.length === 0) {
      embed.addFields({
        name: '📭 Aktif Etkinlik Yok',
        value: 'Şu an aktif bir etkinlik bulunmuyor.\nHafta sonları ve özel günlerde etkinlikler aktif olur!',
        inline: false
      });
    } else {
      if (events.length > 0) {
        let eventText = '';
        for (const event of events) {
          const emoji = EVENT_EMOJIS[event.type] || '🎊';
          const timeLeft = eventSystem.formatTimeRemaining(new Date(event.endTime));
          const bonus = event.multiplier > 100 ? `+${event.multiplier - 100}%` : '';
          eventText += `${emoji} **${event.name}** ${bonus}\n`;
          eventText += `└ ${event.description}\n`;
          eventText += `└ ⏱️ Kalan: ${timeLeft}\n\n`;
        }
        embed.addFields({
          name: '🎊 Aktif Etkinlikler',
          value: eventText || 'Yok',
          inline: false
        });
      }

      if (goals.length > 0) {
        let goalText = '';
        for (const goal of goals) {
          const progress = Math.floor((goal.currentValue / goal.targetValue) * 100);
          const progressBar = this.createProgressBar(progress);
          const timeLeft = eventSystem.formatTimeRemaining(new Date(goal.endTime));
          
          goalText += `🌍 **${goal.name}**\n`;
          goalText += `└ ${goal.description}\n`;
          goalText += `└ ${progressBar} ${progress}%\n`;
          goalText += `└ ${goal.currentValue.toLocaleString()} / ${goal.targetValue.toLocaleString()}\n`;
          goalText += `└ 🎁 Ödül: ${goal.rewardCoins} 💰 + ${goal.rewardGems} 💎\n`;
          goalText += `└ ⏱️ Kalan: ${timeLeft}\n\n`;
        }
        embed.addFields({
          name: '🌍 Topluluk Hedefleri',
          value: goalText || 'Yok',
          inline: false
        });
      }
    }

    const xpBonus = eventSystem.getXPMultiplier();
    const goldBonus = eventSystem.getGoldMultiplier();
    const rareBonus = eventSystem.getRareMultiplier();
    
    let bonusText = '';
    if (xpBonus > 1) bonusText += `✨ XP: x${xpBonus}\n`;
    if (goldBonus > 1) bonusText += `💰 Altın: x${goldBonus}\n`;
    if (rareBonus > 1) bonusText += `🎯 Nadir Şans: x${rareBonus}\n`;
    
    if (bonusText) {
      embed.addFields({
        name: '📊 Aktif Bonuslar',
        value: bonusText,
        inline: false
      });
    }

    embed.addFields({
      name: '📋 Komutlar',
      value: '`!etkinlik` - Etkinlikleri göster\n`!etkinlik topluluk` - Topluluk hedeflerini detaylı gör\n`!etkinlik ödül <id>` - Tamamlanan hedef ödülünü al',
      inline: false
    });

    embed.setFooter({ text: 'Hafta sonları otomatik bonuslar aktif olur!' });
    
    return message.reply({ embeds: [embed] });
  },

  async showCommunityGoals(message, client) {
    const goals = eventSystem.getActiveCommunityGoals();
    
    const embed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setTitle('🌍 Topluluk Hedefleri')
      .setDescription('Tüm oyuncular birlikte çalışarak bu hedeflere ulaşabilir!')
      .setTimestamp();

    if (goals.length === 0) {
      embed.addFields({
        name: '📭 Aktif Hedef Yok',
        value: 'Şu an aktif bir topluluk hedefi bulunmuyor.\nYakında yeni hedefler eklenecek!',
        inline: false
      });
    } else {
      for (const goal of goals) {
        const progress = Math.floor((goal.currentValue / goal.targetValue) * 100);
        const progressBar = this.createProgressBar(progress);
        const timeLeft = eventSystem.formatTimeRemaining(new Date(goal.endTime));
        
        let fieldValue = `${goal.description}\n\n`;
        fieldValue += `**İlerleme:**\n${progressBar} ${progress}%\n`;
        fieldValue += `${goal.currentValue.toLocaleString()} / ${goal.targetValue.toLocaleString()}\n\n`;
        fieldValue += `**Ödüller:**\n`;
        fieldValue += `💰 ${goal.rewardCoins.toLocaleString()} Altın\n`;
        fieldValue += `💎 ${goal.rewardGems} Taş\n\n`;
        fieldValue += `⏱️ **Kalan Süre:** ${timeLeft}\n`;
        fieldValue += `🆔 **ID:** \`${goal.goalId}\``;
        
        embed.addFields({
          name: `🎯 ${goal.name}`,
          value: fieldValue,
          inline: false
        });
      }
    }

    const topContributors = [];
    for (const goal of goals) {
      const contributors = await eventSystem.getTopContributors(goal.goalId, 5);
      if (contributors.length > 0) {
        let topText = '';
        for (let i = 0; i < contributors.length; i++) {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '▫️';
          try {
            const user = await client.users.fetch(contributors[i].userId);
            topText += `${medal} ${user.username}: ${contributors[i].contribution.toLocaleString()}\n`;
          } catch {
            topText += `${medal} Bilinmeyen: ${contributors[i].contribution.toLocaleString()}\n`;
          }
        }
        if (topText) {
          embed.addFields({
            name: '🏆 En Çok Katkıda Bulunanlar',
            value: topText,
            inline: false
          });
        }
      }
    }

    embed.setFooter({ text: 'Avlanarak, savaşarak ve boss öldürerek katkıda bulun!' });
    
    return message.reply({ embeds: [embed] });
  },

  async claimReward(message, goalId, client) {
    const result = await eventSystem.claimCommunityReward(message.author.id, goalId);
    
    if (!result) {
      return message.reply('❌ Bir hata oluştu!');
    }
    
    if (result.error) {
      return message.reply(`❌ ${result.error}`);
    }
    
    const embed = new EmbedBuilder()
      .setColor(0x2ECC71)
      .setTitle('🎁 Topluluk Ödülü Alındı!')
      .setDescription(`Topluluk hedefine katkın: **${result.contribution.toLocaleString()}**`)
      .addFields(
        { name: '💰 Altın', value: `+${result.coins.toLocaleString()}`, inline: true },
        { name: '💎 Taş', value: `+${result.gems}`, inline: true }
      )
      .setFooter({ text: 'Katkın için teşekkürler!' })
      .setTimestamp();
    
    return message.reply({ embeds: [embed] });
  },

  createProgressBar(percentage) {
    const filled = Math.floor(percentage / 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }
};
