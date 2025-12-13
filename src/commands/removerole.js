const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'rolçıkar',
  aliases: ['removerole', 'takerole', 'rolcikar'],
  description: 'Bir kullanıcıdan rol çıkarır',
  permissions: [PermissionFlagsBits.ManageRoles],
  async execute(message, args, client) {
    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    
    if (!target) {
      return message.reply('Lütfen bir kullanıcı belirtin: `!rolçıkar @kullanıcı @rol`');
    }
    
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
    
    if (!role) {
      return message.reply('Lütfen bir rol belirtin: `!rolçıkar @kullanıcı @rol`');
    }
    
    if (role.position >= message.guild.members.me.roles.highest.position) {
      return message.reply('Bu rolü çıkaramıyorum, çünkü benim rolümden yüksek!');
    }
    
    if (role.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
      return message.reply('Bu rolü çıkaramazsınız, çünkü sizin rolünüzden yüksek!');
    }
    
    try {
      await target.roles.remove(role);
      
      const embed = new EmbedBuilder()
        .setColor('#ff9900')
        .setTitle('Rol Çıkarıldı')
        .addFields(
          { name: 'Kullanıcı', value: target.user.tag, inline: true },
          { name: 'Rol', value: role.name, inline: true },
          { name: 'İşlemi Yapan', value: message.author.tag, inline: true }
        )
        .setTimestamp();
      
      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      message.reply('Rol çıkarılırken bir hata oluştu!');
    }
  }
};
