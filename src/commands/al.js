const { EmbedBuilder } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');

module.exports = {
  name: 'al',
  aliases: ['satınal', 'satinal', 'buy'],
  description: 'Lethe mağazasından eşya satın al',
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
    
    const itemType = args[0]?.toLowerCase();
    const itemId = args[1];

    if (!itemType || !itemId) {
      return message.reply('❌ Kullanım: `!al <kategori> <eşya_id>`\n' +
        'Kategoriler: `silah`, `zırh`, `aksesuar`, `iksir`, `yem`\n' +
        'Örnek: `!al silah iron_sword`');
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

    const result = await letheStorage.buyItem(message.author.id, mappedType, itemId);

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
      .setFooter({ text: 'Envanterini görmek için: !e veya !envanter' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
