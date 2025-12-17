const { EmbedBuilder } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');

const crateContents = {
  bronze_crate: {
    weapons: ['wooden_sword', 'iron_sword'],
    armors: ['cloth_armor', 'leather_armor'],
    accessories: ['luck_ring']
  },
  silver_crate: {
    weapons: ['iron_sword', 'steel_dagger', 'longbow'],
    armors: ['leather_armor', 'chain_armor'],
    accessories: ['luck_ring', 'power_necklace', 'protection_talisman', 'speed_bracelet']
  },
  gold_crate: {
    weapons: ['magic_wand', 'lightning_whip', 'steel_dagger', 'longbow'],
    armors: ['chain_armor', 'steel_armor'],
    accessories: ['power_necklace', 'protection_talisman', 'speed_bracelet', 'magic_earring']
  },
  diamond_crate: {
    weapons: ['fire_sword', 'ice_axe', 'dark_scythe'],
    armors: ['fire_armor', 'ice_armor', 'diamond_armor'],
    accessories: ['magic_earring', 'kings_crown']
  },
  cosmic_crate: {
    weapons: ['dark_scythe', 'dragon_sword'],
    armors: ['diamond_armor', 'dragon_armor'],
    accessories: ['kings_crown']
  }
};

module.exports = {
  name: 'sandik',
  aliases: ['sandık', 'crate', 'crates', 'lootbox'],
  description: 'Sandıkları görüntüle veya aç',
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
    
    const { db } = require('../database/db');
    const { letheCrates, userLetheInventory, letheWeapons, letheArmors, letheAccessories } = require('../../shared/schema');
    const { eq, and, sql } = require('drizzle-orm');

    const crates = await db.select().from(letheCrates);
    const subCommand = args[0]?.toLowerCase();

    if (!subCommand || subCommand === 'liste' || subCommand === 'list') {
      const inventory = await letheStorage.getInventory(message.author.id);
      const userCrates = inventory.filter(i => i.itemType === 'crate');
      
      let inventorySection = '';
      if (userCrates.length > 0) {
        inventorySection = '\n\n**📦 Envanterimdeki Sandıklar:**\n' + userCrates.map(c => {
          const crateInfo = crates.find(cr => cr.crateId === c.itemId);
          return crateInfo 
            ? `${crateInfo.emoji} ${crateInfo.name} x${c.quantity} (\`${c.itemId}\`)`
            : `📦 ${c.itemId} x${c.quantity}`;
        }).join('\n');
      }

      const description = crates.map(c => {
        return `${c.emoji} **${c.name}**\n` +
               `   Nadirlik: ${c.minRarity} - ${c.maxRarity}\n` +
               `   💰 ${c.price} | ID: \`${c.crateId}\``;
      }).join('\n\n');

      const embed = new EmbedBuilder()
        .setColor('#8b5cf6')
        .setTitle('📦 Sandıklar')
        .setDescription(description + inventorySection || 'Henüz sandık yok.')
        .setFooter({ text: 'Satın al: !letheal sandık <id> | Aç: !sandık aç <id>' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (subCommand === 'aç' || subCommand === 'ac' || subCommand === 'open') {
      const crateId = args[1];

      if (!crateId) {
        return message.reply('❌ Kullanım: `!sandık aç <sandık_id>`');
      }

      const crate = crates.find(c => c.crateId === crateId);
      if (!crate) {
        return message.reply('❌ Bu sandık bulunamadı!');
      }

      const inventory = await letheStorage.getInventory(message.author.id);
      const userCrate = inventory.find(i => i.itemType === 'crate' && i.itemId === crateId);
      
      if (userCrate && userCrate.quantity > 0) {
        if (userCrate.quantity === 1) {
          await db.delete(userLetheInventory)
            .where(eq(userLetheInventory.id, userCrate.id));
        } else {
          await db.update(userLetheInventory)
            .set({ quantity: sql`${userLetheInventory.quantity} - 1` })
            .where(eq(userLetheInventory.id, userCrate.id));
        }
      } else {
        const profile = await letheStorage.getProfile(message.author.id);
        if (profile.coins < crate.price) {
          return message.reply(`❌ Bu sandık envanterinde yok ve satın almak için yeterli paran da yok! Gereken: 💰 ${crate.price}`);
        }
        await letheStorage.addCoins(message.author.id, -crate.price);
      }

      const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'hidden'];
      const minIndex = rarityOrder.indexOf(crate.minRarity);
      const maxIndex = rarityOrder.indexOf(crate.maxRarity);
      
      const roll = Math.random();
      let selectedRarityIndex;
      if (roll < 0.5) {
        selectedRarityIndex = minIndex;
      } else if (roll < 0.8) {
        selectedRarityIndex = Math.min(minIndex + 1, maxIndex);
      } else if (roll < 0.95) {
        selectedRarityIndex = Math.min(minIndex + 2, maxIndex);
      } else {
        selectedRarityIndex = maxIndex;
      }
      const selectedRarity = rarityOrder[selectedRarityIndex];

      const itemTypes = ['weapon', 'armor', 'accessory'];
      let selectedType = itemTypes[Math.floor(Math.random() * itemTypes.length)];

      let items = [];
      let itemIdField = '';
      let wonItem = null;
      
      const crateContent = crateContents[crateId];
      
      switch (selectedType) {
        case 'weapon':
          items = await db.select().from(letheWeapons).where(eq(letheWeapons.rarity, selectedRarity));
          itemIdField = 'weaponId';
          if (crateContent?.weapons) {
            const filteredItems = items.filter(i => crateContent.weapons.includes(i.weaponId));
            if (filteredItems.length > 0) items = filteredItems;
          }
          break;
        case 'armor':
          items = await db.select().from(letheArmors).where(eq(letheArmors.rarity, selectedRarity));
          itemIdField = 'armorId';
          if (crateContent?.armors) {
            const filteredItems = items.filter(i => crateContent.armors.includes(i.armorId));
            if (filteredItems.length > 0) items = filteredItems;
          }
          break;
        case 'accessory':
          items = await db.select().from(letheAccessories).where(eq(letheAccessories.rarity, selectedRarity));
          itemIdField = 'accessoryId';
          if (crateContent?.accessories) {
            const filteredItems = items.filter(i => crateContent.accessories.includes(i.accessoryId));
            if (filteredItems.length > 0) items = filteredItems;
          }
          break;
      }

      if (items.length === 0) {
        switch (selectedType) {
          case 'weapon':
            items = await db.select().from(letheWeapons);
            break;
          case 'armor':
            items = await db.select().from(letheArmors);
            break;
          case 'accessory':
            items = await db.select().from(letheAccessories);
            break;
        }
        if (items.length === 0) {
          items = await db.select().from(letheWeapons);
          selectedType = 'weapon';
          itemIdField = 'weaponId';
        }
      }

      wonItem = items[Math.floor(Math.random() * items.length)];

      const existingItems = await db.select().from(userLetheInventory)
        .where(eq(userLetheInventory.visitorId, message.author.id));
      
      const existingItem = existingItems.find(i => i.itemType === selectedType && i.itemId === wonItem[itemIdField]);

      if (existingItem) {
        await db.update(userLetheInventory)
          .set({ quantity: sql`${userLetheInventory.quantity} + 1` })
          .where(eq(userLetheInventory.id, existingItem.id));
      } else {
        await db.insert(userLetheInventory).values({
          visitorId: message.author.id,
          itemType: selectedType,
          itemId: wonItem[itemIdField],
          quantity: 1
        });
      }

      const rarityColors = {
        common: '#9ca3af',
        uncommon: '#10b981',
        rare: '#3b82f6',
        epic: '#8b5cf6',
        legendary: '#f59e0b',
        mythic: '#f97316',
        hidden: '#ef4444'
      };

      const rarityEmojis = {
        common: '⬜',
        uncommon: '🟩',
        rare: '🟦',
        epic: '🟪',
        legendary: '🟨',
        mythic: '🟧',
        hidden: '❓'
      };

      const typeEmojis = {
        weapon: '⚔️',
        armor: '🛡️',
        accessory: '💍'
      };

      const embed = new EmbedBuilder()
        .setColor(rarityColors[wonItem.rarity || selectedRarity] || '#8b5cf6')
        .setTitle(`📦 ${crate.name} Açıldı!`)
        .setDescription(`${rarityEmojis[wonItem.rarity || selectedRarity]} **${(wonItem.rarity || selectedRarity).toUpperCase()}** eşya kazandın!`)
        .addFields(
          { name: `${typeEmojis[selectedType]} Kazanılan`, value: `${wonItem.emoji} **${wonItem.name}**`, inline: false }
        )
        .setFooter({ text: 'Envanterini görmek için: !letheenv' })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    }
  }
};
