const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'kick',
  aliases: ['at'],
  description: 'Bir üyeyi sunucudan atar',
  permissions: [PermissionFlagsBits.KickMembers],
  async execute(message, args, client) {
    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    
    if (!target) {
      return message.reply('Lütfen atılacak bir kullanıcı belirtin!');
    }
    
    if (!target.kickable) {
      return message.reply('Bu kullanıcıyı atamıyorum!');
    }
    
    const reason = args.slice(1).join(' ') || 'Sebep belirtilmedi';
    
    try {
      await target.kick(reason);
      
      const embed = new EmbedBuilder()
        .setColor('#ff9900')
        .setTitle('Kullanıcı Atıldı')
        .addFields(
          { name: 'Kullanıcı', value: target.user.tag, inline: true },
          { name: 'Moderatör', value: message.author.tag, inline: true },
          { name: 'Sebep', value: reason }
        )
        .setTimestamp();
      
      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      message.reply('Kullanıcı atılırken bir hata oluştu!');
    }
  }
};
