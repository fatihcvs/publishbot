const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'mağaza',
  aliases: ['shop', 'magaza', 'dükkan'],
  description: 'Sunucu mağazasını görüntüle veya yönet',
  async execute(message, args, client) {
    const { storage } = require('../database/storage');
    const subCommand = args[0]?.toLowerCase();
    
    const config = await storage.getEconomyConfig(message.guild.id) || {};
    const symbol = config.currencySymbol || '💰';
    
    if (subCommand === 'ekle' || subCommand === 'add') {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return message.reply('Bu komutu kullanmak için yetkiniz yok!');
      }
      
      const name = args[1];
      const price = parseInt(args[2]);
      const role = message.mentions.roles.first();
      const description = args.slice(role ? 4 : 3).join(' ') || 'Açıklama yok';
      
      if (!name || !price || isNaN(price)) {
        return message.reply('Kullanım: `!mağaza ekle <isim> <fiyat> [@rol] [açıklama]`');
      }
      
      await storage.addShopItem(message.guild.id, name, description, price, role?.id, -1);
      
      const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('✅ Ürün Eklendi!')
        .addFields(
          { name: 'İsim', value: name, inline: true },
          { name: 'Fiyat', value: `${symbol} ${price}`, inline: true },
          { name: 'Rol', value: role ? role.toString() : 'Yok', inline: true }
        )
        .setTimestamp();
      
      return message.reply({ embeds: [embed] });
    }
    
    if (subCommand === 'sil' || subCommand === 'remove') {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return message.reply('Bu komutu kullanmak için yetkiniz yok!');
      }
      
      const itemId = parseInt(args[1]);
      if (!itemId) {
        return message.reply('Kullanım: `!mağaza sil <ürün_id>`');
      }
      
      await storage.deleteShopItem(itemId);
      return message.reply('Ürün silindi!');
    }
    
    const items = await storage.getShopItems(message.guild.id);
    
    if (items.length === 0) {
      return message.reply('Mağazada henüz ürün yok! Yöneticiler `!mağaza ekle` komutuyla ürün ekleyebilir.');
    }
    
    const embed = new EmbedBuilder()
      .setColor('#9b59b6')
      .setTitle('🛒 Sunucu Mağazası')
      .setDescription(items.map((item, i) => {
        const role = item.roleId ? message.guild.roles.cache.get(item.roleId) : null;
        return `**${i + 1}.** ${item.name} - ${symbol} ${item.price}\n${item.description}${role ? `\n🎭 Rol: ${role}` : ''}\n*ID: ${item.id}*`;
      }).join('\n\n'))
      .setFooter({ text: 'Satın almak için: !satınal <ürün_id>' })
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};
