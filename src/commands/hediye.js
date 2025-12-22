const { EmbedBuilder } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');

module.exports = {
  name: 'hediye',
  aliases: ['gift', 'hd', 'ver'],
  description: 'Başka oyunculara altın veya hayvan hediye et',
  usage: '!hediye @kullanıcı <miktar/hayvan:id> [mesaj]',
  category: 'lethe',
  
  async execute(message, args, client, storage) {
    const userId = message.author.id;
    
    if (!args[0]) {
      return this.showHelp(message);
    }
    
    if (args[0].toLowerCase() === 'geçmiş' || args[0].toLowerCase() === 'history') {
      return this.showHistory(message, userId);
    }
    
    const targetUser = message.mentions.users.first();
    if (!targetUser) {
      return this.showHelp(message);
    }
    
    if (targetUser.id === userId) {
      return message.reply('❌ Kendinize hediye gönderemezsiniz!');
    }
    
    if (targetUser.bot) {
      return message.reply('❌ Botlara hediye gönderemezsiniz!');
    }
    
    const argText = args.slice(1).join(' ');
    
    const animalMatch = argText.match(/hayvan:(\d+)/i);
    if (animalMatch) {
      const animalId = parseInt(animalMatch[1]);
      return this.giftAnimal(message, targetUser, animalId, userId, argText);
    }
    
    const amount = parseInt(args[1]);
    if (!isNaN(amount) && amount > 0) {
      const giftMessage = args.slice(2).join(' ') || null;
      return this.giftCoins(message, targetUser, amount, userId, giftMessage);
    }
    
    return this.showHelp(message);
  },
  
  showHelp(message) {
    const embed = new EmbedBuilder()
      .setColor('#e91e63')
      .setTitle('🎁 Hediye Sistemi')
      .setDescription('Arkadaşlarına altın veya hayvan hediye et!')
      .addFields(
        { name: '💰 Altın Hediye', value: '`!hediye @kullanıcı <miktar> [mesaj]`\nÖrnek: `!hediye @Ali 500 Doğum günün kutlu olsun!`', inline: false },
        { name: '🐾 Hayvan Hediye', value: '`!hediye @kullanıcı hayvan:<id>`\nÖrnek: `!hediye @Ali hayvan:15`', inline: false },
        { name: '📜 Hediye Geçmişi', value: '`!hediye geçmiş`', inline: false },
        { name: '⏰ Bekleme Süresi', value: 'Aynı kişiye 1 saat arayla hediye gönderebilirsiniz', inline: false }
      )
      .setFooter({ text: 'Hayvan ID\'lerini görmek için: !k' });
    
    return message.reply({ embeds: [embed] });
  },
  
  async giftCoins(message, targetUser, amount, userId, giftMessage) {
    if (amount < 10) {
      return message.reply('❌ En az 10 altın hediye edebilirsiniz!');
    }
    
    if (amount > 100000) {
      return message.reply('❌ Tek seferde en fazla 100,000 altın hediye edebilirsiniz!');
    }
    
    const result = await letheStorage.sendGift(userId, targetUser.id, 'coins', amount, null, giftMessage);
    
    if (!result.success) {
      return message.reply(`❌ ${result.error}`);
    }
    
    const embed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle('🎁 Hediye Gönderildi!')
      .setDescription(`${targetUser} kullanıcısına **${amount}💰** altın hediye ettiniz!`)
      .setThumbnail(targetUser.displayAvatarURL());
    
    if (giftMessage) {
      embed.addFields({ name: '💌 Mesajınız', value: giftMessage });
    }
    
    await message.reply({ embeds: [embed] });
    
    try {
      const notifyEmbed = new EmbedBuilder()
        .setColor('#e91e63')
        .setTitle('🎁 Hediye Aldınız!')
        .setDescription(`${message.author} size **${amount}💰** altın hediye etti!`)
        .setThumbnail(message.author.displayAvatarURL());
      
      if (giftMessage) {
        notifyEmbed.addFields({ name: '💌 Mesaj', value: giftMessage });
      }
      
      await targetUser.send({ embeds: [notifyEmbed] }).catch(() => {});
    } catch (e) {}
  },
  
  async giftAnimal(message, targetUser, animalId, userId, argText) {
    const animals = await letheStorage.getUserAnimals(userId);
    const animal = animals.find(a => a.id === animalId);
    
    if (!animal) {
      return message.reply(`❌ #${animalId} ID'li hayvana sahip değilsiniz!`);
    }
    
    if (animal.inTeam) {
      return message.reply('❌ Takımdaki hayvanları hediye edemezsiniz! Önce takımdan çıkarın: `!tc <slot>`');
    }
    
    const giftMessage = argText.replace(/hayvan:\d+/i, '').trim() || null;
    
    const result = await letheStorage.sendGift(userId, targetUser.id, 'animal', 0, animalId, giftMessage);
    
    if (!result.success) {
      return message.reply(`❌ ${result.error}`);
    }
    
    const animalInfo = result.animal;
    const rarityEmojis = {
      'common': '⚪', 'uncommon': '🟢', 'rare': '🔵',
      'epic': '🟣', 'legendary': '🟡', 'mythic': '🔴', 'hidden': '⚫'
    };
    
    const embed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle('🎁 Hayvan Hediye Edildi!')
      .setDescription(`${targetUser} kullanıcısına **${animalInfo?.emoji || '🐾'} ${animalInfo?.name || 'Hayvan'}** hediye ettiniz!`)
      .addFields(
        { name: 'Nadirlik', value: `${rarityEmojis[animalInfo?.rarity] || '⚪'} ${animalInfo?.rarity?.toUpperCase() || 'COMMON'}`, inline: true }
      )
      .setThumbnail(targetUser.displayAvatarURL());
    
    if (giftMessage) {
      embed.addFields({ name: '💌 Mesajınız', value: giftMessage });
    }
    
    await message.reply({ embeds: [embed] });
    
    try {
      const notifyEmbed = new EmbedBuilder()
        .setColor('#e91e63')
        .setTitle('🎁 Hayvan Aldınız!')
        .setDescription(`${message.author} size **${animalInfo?.emoji || '🐾'} ${animalInfo?.name || 'Hayvan'}** hediye etti!`)
        .addFields(
          { name: 'Nadirlik', value: `${rarityEmojis[animalInfo?.rarity] || '⚪'} ${animalInfo?.rarity?.toUpperCase() || 'COMMON'}`, inline: true }
        )
        .setThumbnail(message.author.displayAvatarURL());
      
      if (giftMessage) {
        notifyEmbed.addFields({ name: '💌 Mesaj', value: giftMessage });
      }
      
      notifyEmbed.setFooter({ text: 'Yeni hayvanınızı görmek için: !k' });
      
      await targetUser.send({ embeds: [notifyEmbed] }).catch(() => {});
    } catch (e) {}
  },
  
  async showHistory(message, userId) {
    const history = await letheStorage.getGiftHistory(userId);
    
    const embed = new EmbedBuilder()
      .setColor('#e91e63')
      .setTitle('📜 Hediye Geçmişi')
      .setDescription(`Son gönderilen ve alınan hediyeler`);
    
    if (history.sent.length > 0) {
      const sentText = history.sent.slice(0, 5).map(g => {
        const type = g.giftType === 'coins' ? `💰 ${g.coins}` : `🐾 Hayvan #${g.animalId}`;
        return `→ <@${g.receiverId}>: ${type}`;
      }).join('\n');
      embed.addFields({ name: '📤 Gönderilen', value: sentText, inline: true });
    }
    
    if (history.received.length > 0) {
      const receivedText = history.received.slice(0, 5).map(g => {
        const type = g.giftType === 'coins' ? `💰 ${g.coins}` : `🐾 Hayvan #${g.animalId}`;
        return `← <@${g.senderId}>: ${type}`;
      }).join('\n');
      embed.addFields({ name: '📥 Alınan', value: receivedText, inline: true });
    }
    
    if (history.sent.length === 0 && history.received.length === 0) {
      embed.setDescription('Henüz hediye geçmişiniz yok. Arkadaşlarınıza hediye göndererek başlayın!');
    }
    
    return message.reply({ embeds: [embed] });
  }
};
