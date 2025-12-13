const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'unmute',
  aliases: ['sustururkaldır'],
  description: 'Bir üyenin susturmasını kaldırır',
  permissions: [PermissionFlagsBits.ModerateMembers],
  async execute(message, args, client) {
    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    
    if (!target) {
      return message.reply('Lütfen susturması kaldırılacak bir kullanıcı belirtin!');
    }
    
    try {
      await target.timeout(null);
      
      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('Susturma Kaldırıldı')
        .addFields(
          { name: 'Kullanıcı', value: target.user.tag, inline: true },
          { name: 'Moderatör', value: message.author.tag, inline: true }
        )
        .setTimestamp();
      
      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      message.reply('Susturma kaldırılırken bir hata oluştu!');
    }
  }
};
