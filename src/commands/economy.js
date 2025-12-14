const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'para',
  aliases: ['bal', 'balance', 'bakiye', 'money'],
  description: 'Ekonomi sistemi - bakiye görüntüleme',
  async execute(message, args, client) {
    const { storage } = require('../database/storage');
    
    const user = message.mentions.users.first() || message.author;
    let economy = await storage.getUserEconomy(message.guild.id, user.id);
    
    if (!economy) {
      economy = await storage.createUserEconomy(message.guild.id, user.id);
    }
    
    const config = await storage.getEconomyConfig(message.guild.id) || {};
    const symbol = config.currencySymbol || '💰';
    
    const embed = new EmbedBuilder()
      .setColor('#f1c40f')
      .setTitle(`${user.username} - Bakiye`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '💵 Cüzdan', value: `${symbol} ${economy.balance || 0}`, inline: true },
        { name: '🏦 Banka', value: `${symbol} ${economy.bank || 0}`, inline: true },
        { name: '💰 Toplam', value: `${symbol} ${(economy.balance || 0) + (economy.bank || 0)}`, inline: true }
      )
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};
