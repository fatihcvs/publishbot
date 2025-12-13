const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'ban',
  aliases: ['yasakla'],
  description: 'Bir üyeyi sunucudan yasaklar',
  permissions: [PermissionFlagsBits.BanMembers],
  async execute(message, args, client) {
    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    
    if (!target) {
      return message.reply('Lütfen yasaklanacak bir kullanıcı belirtin!');
    }
    
    if (!target.bannable) {
      return message.reply('Bu kullanıcıyı yasaklayamıyorum!');
    }
    
    const reason = args.slice(1).join(' ') || 'Sebep belirtilmedi';
    
    try {
      await target.ban({ reason });
      
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('Kullanıcı Yasaklandı')
        .addFields(
          { name: 'Kullanıcı', value: target.user.tag, inline: true },
          { name: 'Moderatör', value: message.author.tag, inline: true },
          { name: 'Sebep', value: reason }
        )
        .setTimestamp();
      
      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      message.reply('Kullanıcı yasaklanırken bir hata oluştu!');
    }
  }
};
