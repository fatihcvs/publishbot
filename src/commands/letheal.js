const { EmbedBuilder } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');

module.exports = {
  name: 'letheal',
  aliases: ['lethesatınal', 'lethebuy', 'equipbuy'],
  description: 'Lethe mağazasından eşya satın al',
  category: 'lethe',
  async execute(message, args, client, storage) {
    const itemType = args[0]?.toLowerCase();
    const itemId = args[1];

    if (!itemType || !itemId) {
      return message.reply('❌ Kullanım: `!letheal <kategori> <eşya_id>`\n' +
        'Kategoriler: `weapon`, `armor`, `accessory`, `consumable`, `bait`\n' +
        'Örnek: `!letheal weapon wooden_sword`');
    }

    const typeMap = {
      'silah': 'weapon',
      'weapon': 'weapon',
      'zirh': 'armor',
      'zırh': 'armor',
      'armor': 'armor',
      'aksesuar': 'accessory',
      'accessory': 'accessory',
      'iksir': 'consumable',
      'consumable': 'consumable',
      'yem': 'bait',
      'bait': 'bait'
    };

    const mappedType = typeMap[itemType];
    if (!mappedType) {
      return message.reply('❌ Geçersiz kategori! Kullanılabilir: weapon, armor, accessory, consumable, bait');
    }

    const result = await letheStorage.buyItem(message.guild.id, message.author.id, mappedType, itemId);

    if (!result.success) {
      const errorMessages = {
        'Invalid item type': '❌ Geçersiz eşya türü!',
        'Item not found': '❌ Bu eşya bulunamadı!',
        'Not enough money': '❌ Yeterli paran yok!'
      };
      return message.reply(errorMessages[result.error] || '❌ Bir hata oluştu.');
    }

    const embed = new EmbedBuilder()
      .setColor('#10b981')
      .setTitle('✅ Satın Alma Başarılı!')
      .setDescription(`${result.item.emoji} **${result.item.name}** satın alındı!`)
      .addFields(
        { name: '💰 Ödenen', value: `${result.price}`, inline: true }
      )
      .setFooter({ text: 'Envanterini görmek için: !letheenv' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
