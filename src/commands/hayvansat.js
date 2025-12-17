const { EmbedBuilder } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');

module.exports = {
  name: 'hayvansat',
  aliases: ['hayvansatver', 'animalsell', 'sathayvan', 'sat'],
  description: 'Bir hayvanı sat',
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
    
    if (args[0]?.toLowerCase() === 'hepsi' || args[0]?.toLowerCase() === 'all') {
      const result = await letheStorage.sellDuplicateAnimals(message.author.id);
      
      if (!result.success) {
        return message.reply('❌ ' + (result.error || 'Bir hata oluştu.'));
      }
      
      if (result.soldCount === 0) {
        return message.reply('❌ Satılacak fazla hayvan yok! Her hayvandan en fazla 1 tane var.');
      }
      
      const completedQuests = await letheStorage.updateQuestProgress(message.author.id, 'sell', result.soldCount);
      await letheStorage.updateQuestProgress(message.author.id, 'earn_money', result.totalEarned);
      
      const embed = new EmbedBuilder()
        .setColor('#f59e0b')
        .setTitle('💰 Toplu Satış Tamamlandı!')
        .setDescription(`Her hayvandan 1 tane bırakılarak fazlalar satıldı.`)
        .addFields(
          { name: '📦 Satılan', value: `${result.soldCount} hayvan`, inline: true },
          { name: '💰 Kazanılan', value: `${result.totalEarned.toLocaleString()} coin`, inline: true }
        )
        .setTimestamp();
      
      if (result.soldDetails && result.soldDetails.length > 0) {
        const detailsText = result.soldDetails.slice(0, 10).map(d => 
          `${d.emoji} ${d.name} x${d.count} = ${d.earned}💰`
        ).join('\n');
        embed.addFields({ name: '📋 Detay', value: detailsText + (result.soldDetails.length > 10 ? '\n...' : ''), inline: false });
      }
      
      if (completedQuests.length > 0) {
        for (const q of completedQuests) {
          let rewardText = [];
          if (q.rewards?.coins > 0) rewardText.push(`+${q.rewards.coins}💰`);
          if (q.rewards?.xp > 0) rewardText.push(`+${q.rewards.xp}✨`);
          if (q.rewards?.item) rewardText.push(`+1 ${q.rewards.item.type}`);
          embed.addFields({ 
            name: `🎯 ${q.questInfo.emoji} ${q.questInfo.name} Tamamlandı!`, 
            value: rewardText.length > 0 ? `Ödül: ${rewardText.join(' ')}` : 'Tamamlandı!', 
            inline: false 
          });
        }
      }
      
      return message.reply({ embeds: [embed] });
    }
    
    const animalId = parseInt(args[0]);

    if (!animalId) {
      return message.reply('❌ Kullanım:\n`!hayvansat <hayvan_id>` - Tek hayvan sat\n`!hayvansat hepsi` - Fazla hayvanları sat (her türden 1 tane kalır)\nHayvan ID\'lerini görmek için: `!koleksiyon`');
    }

    const result = await letheStorage.sellAnimal(message.author.id, animalId);

    if (!result.success) {
      const errorMessages = {
        'Animal not found': '❌ Bu ID\'ye sahip bir hayvanın yok!',
        'Cannot sell animal in team': '❌ Takımdaki hayvanları satamazsın! Önce takımdan çıkar.'
      };
      return message.reply(errorMessages[result.error] || '❌ Bir hata oluştu.');
    }

    const completedQuests = await letheStorage.updateQuestProgress(message.author.id, 'sell', 1);
    await letheStorage.updateQuestProgress(message.author.id, 'earn_money', result.price);

    const embed = new EmbedBuilder()
      .setColor('#f59e0b')
      .setTitle('💰 Hayvan Satıldı!')
      .setDescription(`${result.animal.emoji} **${result.animal.name}** satıldı!`)
      .addFields(
        { name: 'Kazanılan', value: `💰 ${result.price}`, inline: true }
      )
      .setTimestamp();

    if (completedQuests.length > 0) {
      for (const q of completedQuests) {
        let rewardText = [];
        if (q.rewards?.coins > 0) rewardText.push(`+${q.rewards.coins}💰`);
        if (q.rewards?.xp > 0) rewardText.push(`+${q.rewards.xp}✨`);
        if (q.rewards?.item) rewardText.push(`+1 ${q.rewards.item.type}`);
        embed.addFields({ 
          name: `🎯 ${q.questInfo.emoji} ${q.questInfo.name} Tamamlandı!`, 
          value: rewardText.length > 0 ? `Ödül: ${rewardText.join(' ')}` : 'Tamamlandı!', 
          inline: false 
        });
      }
    }

    await message.reply({ embeds: [embed] });
  }
};
