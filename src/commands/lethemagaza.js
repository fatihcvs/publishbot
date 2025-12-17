const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');

const rarityColors = {
  common: '#9ca3af',
  uncommon: '#10b981',
  rare: '#3b82f6',
  epic: '#8b5cf6',
  legendary: '#f59e0b',
  mythic: '#f97316'
};

const rarityEmojis = {
  common: '⬜',
  uncommon: '🟩',
  rare: '🟦',
  epic: '🟪',
  legendary: '🟨',
  mythic: '🟧'
};

module.exports = {
  name: 'lethemagaza',
  aliases: ['lethemağaza', 'letheshop', 'silahlar', 'zirhlar'],
  description: 'Lethe Game mağazasını aç',
  category: 'lethe',
  async execute(message, args, client, storage) {
    const category = args[0]?.toLowerCase() || 'silahlar';

    let items = [];
    let title = '';
    let itemType = '';

    switch (category) {
      case 'silahlar':
      case 'silah':
      case 'weapons':
        items = await letheStorage.getAllWeapons();
        title = '⚔️ Silahlar';
        itemType = 'weapon';
        break;
      case 'zirhlar':
      case 'zırh':
      case 'zirh':
      case 'armors':
        items = await letheStorage.getAllArmors();
        title = '🛡️ Zırhlar';
        itemType = 'armor';
        break;
      case 'aksesuarlar':
      case 'aksesuar':
      case 'accessories':
        items = await letheStorage.getAllAccessories();
        title = '💍 Aksesuarlar';
        itemType = 'accessory';
        break;
      case 'iksirler':
      case 'iksir':
      case 'potions':
        items = await letheStorage.getAllConsumables();
        title = '🧪 İksirler';
        itemType = 'consumable';
        break;
      default:
        const embed = new EmbedBuilder()
          .setColor('#8b5cf6')
          .setTitle('🏪 Lethe Game Mağazası')
          .setDescription('Bir kategori seçin:')
          .addFields(
            { name: '⚔️ Silahlar', value: '`!lethemağaza silahlar`', inline: true },
            { name: '🛡️ Zırhlar', value: '`!lethemağaza zırhlar`', inline: true },
            { name: '💍 Aksesuarlar', value: '`!lethemağaza aksesuarlar`', inline: true },
            { name: '🧪 İksirler', value: '`!lethemağaza iksirler`', inline: true }
          )
          .setFooter({ text: 'Satın almak için: !letheal <kategori> <eşya_id>' })
          .setTimestamp();
        return message.reply({ embeds: [embed] });
    }

    if (items.length === 0) {
      return message.reply('❌ Bu kategoride ürün bulunamadı.');
    }

    const description = items.map((item, i) => {
      const rarityEmoji = rarityEmojis[item.rarity] || '⬜';
      const idField = item.weaponId || item.armorId || item.accessoryId || item.consumableId;
      let stats = '';
      
      if (item.damage) stats = `⚔️ +${item.damage} hasar`;
      else if (item.defense) stats = `🛡️ +${item.defense} savunma`;
      else if (item.effect) stats = `✨ ${item.effect}: +${item.effectValue}`;
      
      let special = '';
      if (item.specialEffect) {
        special = ` | 🌟 ${item.specialEffect}`;
      }

      return `${rarityEmoji} **${item.emoji} ${item.name}**\n` +
             `   ${stats}${special}\n` +
             `   💰 ${item.price} | ID: \`${idField}\``;
    }).join('\n\n');

    const embed = new EmbedBuilder()
      .setColor('#8b5cf6')
      .setTitle(`🏪 ${title}`)
      .setDescription(description)
      .setFooter({ text: `Satın almak için: !letheal ${itemType} <eşya_id>` })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
