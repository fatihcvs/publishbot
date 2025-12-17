const { EmbedBuilder } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');

module.exports = {
  name: 'envanter',
  aliases: ['e', 'env', 'inventory', 'ekipman'],
  description: 'Lethe Game envanterini görüntüle',
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
    
    const inventory = await letheStorage.getInventory(message.author.id);
    const profile = await letheStorage.getProfile(message.author.id);

    const allWeapons = await letheStorage.getAllWeapons();
    const allArmors = await letheStorage.getAllArmors();
    const allAccessories = await letheStorage.getAllAccessories();
    const allConsumables = await letheStorage.getAllConsumables();
    const allCrates = await letheStorage.getAllCrates();

    const itemMap = {};
    allWeapons.forEach(w => itemMap[w.weaponId] = { ...w, type: 'weapon' });
    allArmors.forEach(a => itemMap[a.armorId] = { ...a, type: 'armor' });
    allAccessories.forEach(a => itemMap[a.accessoryId] = { ...a, type: 'accessory' });
    allConsumables.forEach(c => itemMap[c.consumableId] = { ...c, type: 'consumable' });
    allCrates.forEach(c => itemMap[c.crateId] = { ...c, type: 'crate' });

    const embed = new EmbedBuilder()
      .setColor('#8b5cf6')
      .setTitle(`🎒 ${message.author.username} - Envanter`)
      .setTimestamp();

    let equippedStr = '';
    if (profile.equippedWeapon) {
      const w = itemMap[profile.equippedWeapon];
      if (w) equippedStr += `⚔️ **Silah:** ${w.emoji} ${w.name} (+${w.damage} hasar)\n`;
    }
    if (profile.equippedArmor) {
      const a = itemMap[profile.equippedArmor];
      if (a) equippedStr += `🛡️ **Zırh:** ${a.emoji} ${a.name} (+${a.defense} savunma)\n`;
    }
    if (profile.equippedAccessory) {
      const a = itemMap[profile.equippedAccessory];
      if (a) equippedStr += `💍 **Aksesuar:** ${a.emoji} ${a.name} (${a.effect || a.bonus || 'Bonus'})\n`;
    }

    if (equippedStr) {
      embed.addFields({ name: '⭐ Kuşanılmış Ekipman', value: equippedStr, inline: false });
    }

    if (inventory.length === 0) {
      embed.setDescription('Envanterin boş! `!mağaza` veya `!m` ile eşya satın al.');
    } else {
      const weapons = inventory.filter(i => i.itemType === 'weapon');
      const armors = inventory.filter(i => i.itemType === 'armor');
      const accessories = inventory.filter(i => i.itemType === 'accessory');
      const consumables = inventory.filter(i => i.itemType === 'consumable');
      const baits = inventory.filter(i => i.itemType === 'bait');

      if (weapons.length > 0) {
        const weaponStr = weapons.map(w => {
          const item = itemMap[w.itemId];
          return item ? `${item.emoji} ${item.name} x${w.quantity}\n┗ ID: \`${w.itemId}\` | +${item.damage} hasar` : `${w.itemId} x${w.quantity}`;
        }).join('\n\n');
        embed.addFields({ name: '⚔️ Silahlar', value: weaponStr, inline: false });
      }

      if (armors.length > 0) {
        const armorStr = armors.map(a => {
          const item = itemMap[a.itemId];
          return item ? `${item.emoji} ${item.name} x${a.quantity}\n┗ ID: \`${a.itemId}\` | +${item.defense} savunma` : `${a.itemId} x${a.quantity}`;
        }).join('\n\n');
        embed.addFields({ name: '🛡️ Zırhlar', value: armorStr, inline: false });
      }

      if (accessories.length > 0) {
        const effectNames = {
          'hunt_bonus': '🎯 Avlanma Bonusu',
          'str_boost': '⚔️ Güç (STR)',
          'def_boost': '🛡️ Savunma (DEF)',
          'spd_boost': '⚡ Hız (SPD)',
          'hp_boost': '❤️ Can (HP)',
          'magic_boost': '🔮 Büyü Gücü',
          'all_stats': '✨ Tüm İstatistikler',
          'crit_boost': '💥 Kritik Şansı',
          'dodge_boost': '💨 Kaçınma Şansı'
        };
        
        const accStr = accessories.map(a => {
          const item = itemMap[a.itemId];
          if (!item) return `${a.itemId} x${a.quantity}`;
          const effectName = effectNames[item.effect] || item.effect;
          const effectValue = item.effectValue || 0;
          return `${item.emoji} ${item.name} x${a.quantity}\n┗ ID: \`${a.itemId}\` | ${effectName} **+${effectValue}**`;
        }).join('\n\n');
        embed.addFields({ name: '💍 Aksesuarlar', value: accStr, inline: false });
      }

      if (consumables.length > 0) {
        const consStr = consumables.map(c => {
          const item = itemMap[c.itemId];
          const effect = item?.effect || 'Kullanılabilir';
          return item ? `${item.emoji} ${item.name} x${c.quantity}\n┗ ID: \`${c.itemId}\` | ${effect}` : `${c.itemId} x${c.quantity}`;
        }).join('\n\n');
        embed.addFields({ name: '🧪 İksirler', value: consStr, inline: false });
      }

      if (baits.length > 0) {
        const baitStr = baits.map(b => `🍖 ${b.itemId} x${b.quantity}`).join('\n');
        embed.addFields({ name: '🍖 Yemler', value: baitStr, inline: false });
      }

      const crates = inventory.filter(i => i.itemType === 'crate');
      if (crates.length > 0) {
        const crateStr = crates.map(c => {
          const item = itemMap[c.itemId];
          if (!item) return `📦 ${c.itemId} x${c.quantity}`;
          return `${item.emoji} **${item.name}** x${c.quantity}\n┗ ID: \`${c.itemId}\` | Nadirlik: ${item.minRarity}-${item.maxRarity}`;
        }).join('\n\n');
        embed.addFields({ name: '📦 Sandıklar', value: crateStr, inline: false });
      }
    }

    embed.setFooter({ text: 'Kuşanmak: !kusan <kategori> <id> | Sandık açmak: !sandık aç <id>' });

    await message.reply({ embeds: [embed] });
  }
};
