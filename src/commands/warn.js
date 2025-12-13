const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'warn',
  aliases: ['uyar'],
  description: 'Bir üyeyi uyarır',
  permissions: [PermissionFlagsBits.ModerateMembers],
  async execute(message, args, client) {
    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    
    if (!target) {
      return message.reply('Lütfen uyarılacak bir kullanıcı belirtin!');
    }
    
    const reason = args.slice(1).join(' ') || 'Sebep belirtilmedi';
    
    if (!client.warnings[message.guild.id]) {
      client.warnings[message.guild.id] = {};
    }
    
    if (!client.warnings[message.guild.id][target.id]) {
      client.warnings[message.guild.id][target.id] = [];
    }
    
    const warning = {
      moderator: message.author.id,
      reason: reason,
      date: new Date().toISOString()
    };
    
    client.warnings[message.guild.id][target.id].push(warning);
    client.saveWarnings();
    
    const warningCount = client.warnings[message.guild.id][target.id].length;
    
    const embed = new EmbedBuilder()
      .setColor('#ffff00')
      .setTitle('Kullanıcı Uyarıldı')
      .addFields(
        { name: 'Kullanıcı', value: target.user.tag, inline: true },
        { name: 'Toplam Uyarı', value: `${warningCount}`, inline: true },
        { name: 'Moderatör', value: message.author.tag, inline: true },
        { name: 'Sebep', value: reason }
      )
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};
