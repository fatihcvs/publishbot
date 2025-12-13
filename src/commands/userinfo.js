const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'kullanıcı',
  aliases: ['userinfo', 'user', 'kullanici', 'whois'],
  description: 'Kullanıcı bilgilerini gösterir',
  async execute(message, args, client) {
    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
    
    const roles = target.roles.cache
      .filter(role => role.id !== message.guild.id)
      .sort((a, b) => b.position - a.position)
      .map(role => role.toString())
      .slice(0, 10);
    
    const embed = new EmbedBuilder()
      .setColor(target.displayHexColor || '#5865F2')
      .setTitle(target.user.tag)
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true, size: 512 }))
      .addFields(
        { name: 'Kullanıcı ID', value: target.id, inline: true },
        { name: 'Takma Ad', value: target.nickname || 'Yok', inline: true },
        { name: 'Bot', value: target.user.bot ? 'Evet' : 'Hayır', inline: true },
        { name: 'Hesap Oluşturulma', value: `<t:${Math.floor(target.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Sunucuya Katılma', value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>`, inline: true },
        { name: 'En Yüksek Rol', value: target.roles.highest.toString(), inline: true },
        { name: `Roller [${target.roles.cache.size - 1}]`, value: roles.length > 0 ? roles.join(', ') : 'Rol yok' }
      )
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};
