const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'mute',
  aliases: ['sustur', 'timeout'],
  description: 'Bir üyeyi susturur',
  permissions: [PermissionFlagsBits.ModerateMembers],
  async execute(message, args, client) {
    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    
    if (!target) {
      return message.reply('Lütfen susturulacak bir kullanıcı belirtin!');
    }
    
    if (!target.moderatable) {
      return message.reply('Bu kullanıcıyı susturamıyorum!');
    }
    
    let duration = parseInt(args[1]) || 10;
    const unit = args[2] || 'd';
    
    let ms;
    switch (unit.toLowerCase()) {
      case 's':
      case 'saniye':
        ms = duration * 1000;
        break;
      case 'm':
      case 'dakika':
        ms = duration * 60 * 1000;
        break;
      case 'h':
      case 'saat':
        ms = duration * 60 * 60 * 1000;
        break;
      case 'd':
      case 'gün':
      default:
        ms = duration * 24 * 60 * 60 * 1000;
        break;
    }
    
    if (ms > 28 * 24 * 60 * 60 * 1000) {
      ms = 28 * 24 * 60 * 60 * 1000;
    }
    
    const reason = args.slice(3).join(' ') || 'Sebep belirtilmedi';
    
    try {
      await target.timeout(ms, reason);
      
      const embed = new EmbedBuilder()
        .setColor('#ff9900')
        .setTitle('Kullanıcı Susturuldu')
        .addFields(
          { name: 'Kullanıcı', value: target.user.tag, inline: true },
          { name: 'Süre', value: `${duration} ${unit}`, inline: true },
          { name: 'Moderatör', value: message.author.tag, inline: true },
          { name: 'Sebep', value: reason }
        )
        .setTimestamp();
      
      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      message.reply('Kullanıcı susturulurken bir hata oluştu!');
    }
  }
};
