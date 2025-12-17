const { EmbedBuilder } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');

module.exports = {
  name: 'sandik',
  aliases: ['sandık', 'crate', 'crates', 'lootbox'],
  description: 'Sandıkları görüntüle veya aç',
  category: 'lethe',
  async execute(message, args, client, storage) {
    const { db } = require('../database/db');
    const { letheCrates, userLetheInventory, letheWeapons, letheArmors, letheAccessories } = require('../../shared/schema');
    const { eq, and, sql } = require('drizzle-orm');

    const crates = await db.select().from(letheCrates);
    const subCommand = args[0]?.toLowerCase();

    if (!subCommand || subCommand === 'liste' || subCommand === 'list') {
      const description = crates.map(c => {
        return `${c.emoji} **${c.name}**\n` +
               `   Nadirlik: ${c.minRarity} - ${c.maxRarity}\n` +
               `   💰 ${c.price} | ID: \`${c.crateId}\``;
      }).join('\n\n');

      const embed = new EmbedBuilder()
        .setColor('#8b5cf6')
        .setTitle('📦 Sandıklar')
        .setDescription(description || 'Henüz sandık yok.')
        .setFooter({ text: 'Açmak için: !sandık aç <sandık_id>' })
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

      const economy = await letheStorage.ensureEconomy(message.guild.id, message.author.id);

      if (economy.balance < crate.price) {
        return message.reply(`❌ Yeterli paran yok! Gereken: 💰 ${crate.price}`);
      }

      await letheStorage.addMoney(message.guild.id, message.author.id, -crate.price);

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
      
      switch (selectedType) {
        case 'weapon':
          items = await db.select().from(letheWeapons).where(eq(letheWeapons.rarity, selectedRarity));
          itemIdField = 'weaponId';
          break;
        case 'armor':
          items = await db.select().from(letheArmors).where(eq(letheArmors.rarity, selectedRarity));
          itemIdField = 'armorId';
          break;
        case 'accessory':
          items = await db.select().from(letheAccessories).where(eq(letheAccessories.rarity, selectedRarity));
          itemIdField = 'accessoryId';
          break;
      }

      if (items.length === 0) {
        items = await db.select().from(letheWeapons).where(eq(letheWeapons.rarity, 'common'));
        selectedType = 'weapon';
        itemIdField = 'weaponId';
      }

      const wonItem = items[Math.floor(Math.random() * items.length)];

      const existingItem = await db.select().from(userLetheInventory)
        .where(and(
          eq(userLetheInventory.guildId, message.guild.id),
          eq(userLetheInventory.visitorId, message.author.id),
          eq(userLetheInventory.itemType, selectedType),
          eq(userLetheInventory.itemId, wonItem[itemIdField])
        ))
        .limit(1);

      if (existingItem.length > 0) {
        await db.update(userLetheInventory)
          .set({ quantity: sql`${userLetheInventory.quantity} + 1` })
          .where(eq(userLetheInventory.id, existingItem[0].id));
      } else {
        await db.insert(userLetheInventory).values({
          guildId: message.guild.id,
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

      const embed = new EmbedBuilder()
        .setColor(rarityColors[selectedRarity] || '#8b5cf6')
        .setTitle(`📦 ${crate.name} Açıldı!`)
        .setDescription(`${rarityEmojis[selectedRarity]} **${selectedRarity.toUpperCase()}** eşya kazandın!`)
        .addFields(
          { name: '🎁 Kazanılan', value: `${wonItem.emoji} **${wonItem.name}**`, inline: false }
        )
        .setFooter({ text: 'Envanterini görmek için: !letheenv' })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    }
  }
};
