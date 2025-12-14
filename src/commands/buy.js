const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'satınal',
  aliases: ['buy', 'satinal', 'al'],
  description: 'Mağazadan ürün satın al',
  async execute(message, args, client) {
    const { storage } = require('../database/storage');
    
    const itemId = parseInt(args[0]);
    if (!itemId) {
      return message.reply('Kullanım: `!satınal <ürün_id>`\nÜrün ID\'lerini görmek için: `!mağaza`');
    }
    
    const items = await storage.getShopItems(message.guild.id);
    const item = items.find(i => i.id === itemId);
    
    if (!item) {
      return message.reply('Ürün bulunamadı!');
    }
    
    let economy = await storage.getUserEconomy(message.guild.id, message.author.id);
    if (!economy) {
      economy = await storage.createUserEconomy(message.guild.id, message.author.id);
    }
    
    const config = await storage.getEconomyConfig(message.guild.id) || {};
    const symbol = config.currencySymbol || '💰';
    
    if (economy.balance < item.price) {
      return message.reply(`Yeterli bakiyeniz yok! Gerekli: ${symbol} ${item.price}, Mevcut: ${symbol} ${economy.balance}`);
    }
    
    if (item.stock === 0) {
      return message.reply('Bu ürün stokta kalmadı!');
    }
    
    await storage.updateUserBalance(message.guild.id, message.author.id, -item.price, false);
    
    if (item.stock > 0) {
      const { db } = require('../database/db');
      const { shopItems } = require('../../shared/schema');
      const { eq } = require('drizzle-orm');
      
      await db.update(shopItems).set({ stock: item.stock - 1 }).where(eq(shopItems.id, itemId));
    }
    
    if (item.roleId) {
      const role = message.guild.roles.cache.get(item.roleId);
      if (role) {
        try {
          await message.member.roles.add(role);
        } catch (error) {
          console.error('Rol ekleme hatası:', error);
        }
      }
    }
    
    const embed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle('✅ Satın Alma Başarılı!')
      .setDescription(`**${item.name}** satın aldınız!`)
      .addFields(
        { name: 'Ödenen', value: `${symbol} ${item.price}`, inline: true },
        { name: 'Kalan Bakiye', value: `${symbol} ${economy.balance - item.price}`, inline: true }
      )
      .setTimestamp();
    
    if (item.roleId) {
      const role = message.guild.roles.cache.get(item.roleId);
      if (role) {
        embed.addFields({ name: 'Alınan Rol', value: role.toString(), inline: true });
      }
    }
    
    await message.reply({ embeds: [embed] });
  }
};
