const { EmbedBuilder } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');

module.exports = {
  name: 'kusan',
  aliases: ['kuşan', 'equip', 'giy'],
  description: 'Eşya kuşan',
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
      return message.reply('❌ Kullanım: `!kuşan <kategori> <eşya_id>`\n' +
        'Kategoriler: `weapon`, `armor`, `accessory`\n' +
        'Örnek: `!kuşan weapon iron_sword`');
    }

    const typeMap = {
      'silah': 'weapon',
      'weapon': 'weapon',
      'zirh': 'armor',
      'zırh': 'armor',
      'armor': 'armor',
      'aksesuar': 'accessory',
      'accessory': 'accessory'
    };

    const mappedType = typeMap[itemType];
    if (!mappedType) {
      return message.reply('❌ Geçersiz kategori! Kullanılabilir: weapon, armor, accessory');
    }

    const result = await letheStorage.equipItem(message.author.id, mappedType, itemId);

    if (!result.success) {
      const errorMessages = {
        'Item not in inventory': '❌ Bu eşya envanterinde yok! Önce satın al.',
        'Cannot equip this item type': '❌ Bu tür eşyalar kuşanılamaz!'
      };
      return message.reply(errorMessages[result.error] || '❌ Bir hata oluştu.');
    }

    const typeNames = {
      'weapon': '⚔️ Silah',
      'armor': '🛡️ Zırh',
      'accessory': '💍 Aksesuar'
    };

    const embed = new EmbedBuilder()
      .setColor('#10b981')
      .setTitle('✅ Eşya Kuşanıldı!')
      .setDescription(`${typeNames[mappedType]} başarıyla kuşanıldı: **${itemId}**`)
      .setFooter({ text: 'Envanterini görmek için: !letheenv' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
