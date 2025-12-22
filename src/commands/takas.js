const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');

module.exports = {
  name: 'takas',
  aliases: ['trade', 'tk'],
  description: 'Diğer oyuncularla hayvan veya altın takası yap',
  usage: '!takas @kullanıcı <teklif> veya !takas liste/kabul/reddet',
  category: 'lethe',
  
  async execute(message, args, client, storage) {
    const userId = message.author.id;
    
    if (!args[0]) {
      return this.showHelp(message);
    }
    
    const subcommand = args[0].toLowerCase();
    
    switch(subcommand) {
      case 'liste':
      case 'list':
        return this.listTrades(message, userId);
      
      case 'kabul':
      case 'accept':
        return this.acceptTrade(message, args[1], userId);
      
      case 'reddet':
      case 'reject':
        return this.rejectTrade(message, args[1], userId);
      
      case 'iptal':
      case 'cancel':
        return this.cancelTrade(message, args[1], userId);
      
      default:
        const targetUser = message.mentions.users.first();
        if (!targetUser) {
          return this.showHelp(message);
        }
        return this.createTrade(message, targetUser, args.slice(1), userId);
    }
  },
  
  showHelp(message) {
    const embed = new EmbedBuilder()
      .setColor('#9b59b6')
      .setTitle('🔄 Takas Sistemi')
      .setDescription('Diğer oyuncularla hayvan ve altın takası yap!')
      .addFields(
        { name: '📤 Takas Teklifi', value: '`!takas @kullanıcı hayvan:<id> para:<miktar>`\nÖrnek: `!takas @Ali hayvan:5 para:100`', inline: false },
        { name: '📥 İstenen Karşılık', value: '`!takas @kullanıcı hayvan:<id> için:hayvan:<id>`\nÖrnek: `!takas @Ali hayvan:5 için:para:500`', inline: false },
        { name: '📋 Bekleyen Takaslar', value: '`!takas liste`', inline: true },
        { name: '✅ Kabul Et', value: '`!takas kabul <id>`', inline: true },
        { name: '❌ Reddet', value: '`!takas reddet <id>`', inline: true },
        { name: '🚫 İptal Et', value: '`!takas iptal <id>`', inline: true },
        { name: '⏰ Süre', value: 'Teklifler 24 saat geçerlidir', inline: true }
      )
      .setFooter({ text: 'Takas yapmadan önce koleksiyonunuzu kontrol edin: !k' });
    
    return message.reply({ embeds: [embed] });
  },
  
  async listTrades(message, userId) {
    const trades = await letheStorage.getPendingTrades(userId);
    
    if (trades.length === 0) {
      return message.reply('📭 Bekleyen takas teklifiniz yok.');
    }
    
    const embed = new EmbedBuilder()
      .setColor('#9b59b6')
      .setTitle('📋 Bekleyen Takaslar')
      .setDescription('Aşağıdaki takas teklifleri sizi bekliyor:');
    
    for (const trade of trades.slice(0, 10)) {
      const isSender = trade.senderId === userId;
      const otherUser = isSender ? trade.receiverId : trade.senderId;
      const status = isSender ? '📤 Gönderilen' : '📥 Gelen';
      
      let offerText = '';
      if (trade.senderCoins > 0) offerText += `💰 ${trade.senderCoins} altın `;
      if (trade.senderAnimalId) offerText += `🐾 Hayvan #${trade.senderAnimalId} `;
      
      let requestText = '';
      if (trade.receiverCoins > 0) requestText += `💰 ${trade.receiverCoins} altın `;
      if (trade.receiverAnimalId) requestText += `🐾 Hayvan #${trade.receiverAnimalId} `;
      
      const expiresIn = Math.max(0, Math.ceil((new Date(trade.expiresAt) - Date.now()) / (1000 * 60 * 60)));
      
      embed.addFields({
        name: `${status} | ID: ${trade.id}`,
        value: `<@${otherUser}>\n**Teklif:** ${offerText || 'Yok'}\n**İstek:** ${requestText || 'Yok'}\n⏰ ${expiresIn} saat kaldı`,
        inline: true
      });
    }
    
    if (!trades.find(t => t.senderId !== userId)) {
      embed.setFooter({ text: 'Gelen teklifi kabul etmek için: !takas kabul <id>' });
    }
    
    return message.reply({ embeds: [embed] });
  },
  
  async createTrade(message, targetUser, args, userId) {
    if (targetUser.id === userId) {
      return message.reply('❌ Kendinizle takas yapamazsınız!');
    }
    
    if (targetUser.bot) {
      return message.reply('❌ Botlarla takas yapamazsınız!');
    }
    
    const offer = {
      senderAnimalId: null,
      receiverAnimalId: null,
      senderCoins: 0,
      receiverCoins: 0
    };
    
    const argText = args.join(' ').toLowerCase();
    
    const animalMatch = argText.match(/hayvan:(\d+)/);
    if (animalMatch) {
      const animalId = parseInt(animalMatch[1]);
      const animals = await letheStorage.getUserAnimals(userId);
      const animal = animals.find(a => a.id === animalId);
      
      if (!animal) {
        return message.reply(`❌ #${animalId} ID'li hayvana sahip değilsiniz!`);
      }
      
      if (animal.inTeam) {
        return message.reply('❌ Takımdaki hayvanları takas edemezsiniz! Önce takımdan çıkarın: `!tc <slot>`');
      }
      
      offer.senderAnimalId = animalId;
    }
    
    const coinsMatch = argText.match(/para:(\d+)/);
    if (coinsMatch) {
      const coins = parseInt(coinsMatch[1]);
      const profile = await letheStorage.getProfile(userId);
      
      if (profile.coins < coins) {
        return message.reply(`❌ Yeterli altınınız yok! (${profile.coins}💰)`);
      }
      
      offer.senderCoins = coins;
    }
    
    const forAnimalMatch = argText.match(/için:hayvan:(\d+)/);
    if (forAnimalMatch) {
      offer.receiverAnimalId = parseInt(forAnimalMatch[1]);
    }
    
    const forCoinsMatch = argText.match(/için:para:(\d+)/);
    if (forCoinsMatch) {
      offer.receiverCoins = parseInt(forCoinsMatch[1]);
    }
    
    if (!offer.senderAnimalId && !offer.senderCoins) {
      return message.reply('❌ En az bir şey teklif etmelisiniz! (hayvan veya altın)');
    }
    
    const trade = await letheStorage.createTrade(userId, targetUser.id, offer);
    
    let offerText = '';
    if (offer.senderAnimalId) offerText += `🐾 Hayvan #${offer.senderAnimalId} `;
    if (offer.senderCoins > 0) offerText += `💰 ${offer.senderCoins} altın`;
    
    let requestText = '';
    if (offer.receiverAnimalId) requestText += `🐾 Hayvan #${offer.receiverAnimalId} `;
    if (offer.receiverCoins > 0) requestText += `💰 ${offer.receiverCoins} altın`;
    
    const embed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle('📤 Takas Teklifi Gönderildi!')
      .setDescription(`${targetUser} kullanıcısına takas teklifi gönderildi.`)
      .addFields(
        { name: '🎁 Teklifiniz', value: offerText || 'Yok', inline: true },
        { name: '📥 İsteğiniz', value: requestText || 'Yok', inline: true },
        { name: '🆔 Takas ID', value: `#${trade.id}`, inline: true }
      )
      .setFooter({ text: '⏰ Bu teklif 24 saat geçerlidir' });
    
    await message.reply({ embeds: [embed] });
    
    try {
      const notifyEmbed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle('📥 Yeni Takas Teklifi!')
        .setDescription(`${message.author} sana takas teklifi gönderdi!`)
        .addFields(
          { name: '🎁 Teklif', value: offerText || 'Yok', inline: true },
          { name: '📥 İstek', value: requestText || 'Yok', inline: true },
          { name: '🆔 Takas ID', value: `#${trade.id}`, inline: true }
        )
        .setFooter({ text: 'Kabul: !takas kabul ' + trade.id + ' | Reddet: !takas reddet ' + trade.id });
      
      await targetUser.send({ embeds: [notifyEmbed] }).catch(() => {});
    } catch (e) {}
  },
  
  async acceptTrade(message, tradeIdStr, userId) {
    if (!tradeIdStr) {
      return message.reply('❌ Takas ID belirtmelisiniz: `!takas kabul <id>`');
    }
    
    const tradeId = parseInt(tradeIdStr);
    const trade = await letheStorage.getTrade(tradeId);
    
    if (!trade) {
      return message.reply('❌ Takas bulunamadı!');
    }
    
    if (trade.receiverId !== userId) {
      return message.reply('❌ Bu teklif size gelmedi!');
    }
    
    const result = await letheStorage.acceptTrade(tradeId);
    
    if (!result.success) {
      return message.reply(`❌ ${result.error}`);
    }
    
    const embed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle('✅ Takas Tamamlandı!')
      .setDescription(`<@${trade.senderId}> ile takas başarıyla tamamlandı!`)
      .setFooter({ text: 'Yeni hayvanlarınızı görmek için: !k' });
    
    return message.reply({ embeds: [embed] });
  },
  
  async rejectTrade(message, tradeIdStr, userId) {
    if (!tradeIdStr) {
      return message.reply('❌ Takas ID belirtmelisiniz: `!takas reddet <id>`');
    }
    
    const tradeId = parseInt(tradeIdStr);
    const trade = await letheStorage.getTrade(tradeId);
    
    if (!trade) {
      return message.reply('❌ Takas bulunamadı!');
    }
    
    if (trade.receiverId !== userId) {
      return message.reply('❌ Bu teklifi sadece alıcı reddedebilir!');
    }
    
    await letheStorage.rejectTrade(tradeId);
    
    return message.reply('❌ Takas teklifi reddedildi.');
  },
  
  async cancelTrade(message, tradeIdStr, userId) {
    if (!tradeIdStr) {
      return message.reply('❌ Takas ID belirtmelisiniz: `!takas iptal <id>`');
    }
    
    const tradeId = parseInt(tradeIdStr);
    const result = await letheStorage.cancelTrade(tradeId, userId);
    
    if (!result.success) {
      return message.reply(`❌ ${result.error}`);
    }
    
    return message.reply('🚫 Takas teklifi iptal edildi.');
  }
};
