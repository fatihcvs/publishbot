const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'uyarısil',
  aliases: ['clearwarns', 'uyariSil', 'warnclear'],
  description: 'Kullanıcının tüm uyarılarını siler',
  permissions: [PermissionFlagsBits.ModerateMembers],
  async execute(message, args, client) {
    const { storage } = require('../database/storage');
    
    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    
    if (!target) {
      return message.reply('Lütfen bir kullanıcı belirtin: `!uyarısil @kullanıcı`');
    }
    
    const warningCount = await storage.getWarningCount(message.guild.id, target.id);
    
    if (warningCount === 0) {
      return message.reply(`${target.user.tag} kullanıcısının uyarısı bulunmuyor.`);
    }
    
    await storage.clearWarnings(message.guild.id, target.id);
    
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('Uyarılar Temizlendi')
      .addFields(
        { name: 'Kullanıcı', value: target.user.tag, inline: true },
        { name: 'Silinen Uyarı', value: `${warningCount}`, inline: true },
        { name: 'Moderatör', value: message.author.tag, inline: true }
      )
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};
