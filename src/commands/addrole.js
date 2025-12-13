const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'rolekle',
  aliases: ['addrole', 'giverole'],
  description: 'Bir kullanıcıya rol ekler',
  permissions: [PermissionFlagsBits.ManageRoles],
  async execute(message, args, client) {
    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    
    if (!target) {
      return message.reply('Lütfen bir kullanıcı belirtin: `!rolekle @kullanıcı @rol`');
    }
    
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
    
    if (!role) {
      return message.reply('Lütfen bir rol belirtin: `!rolekle @kullanıcı @rol`');
    }
    
    if (role.position >= message.guild.members.me.roles.highest.position) {
      return message.reply('Bu rolü veremiyorum, çünkü benim rolümden yüksek!');
    }
    
    if (role.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
      return message.reply('Bu rolü veremezsiniz, çünkü sizin rolünüzden yüksek!');
    }
    
    try {
      await target.roles.add(role);
      
      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('Rol Eklendi')
        .addFields(
          { name: 'Kullanıcı', value: target.user.tag, inline: true },
          { name: 'Rol', value: role.name, inline: true },
          { name: 'İşlemi Yapan', value: message.author.tag, inline: true }
        )
        .setTimestamp();
      
      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      message.reply('Rol eklenirken bir hata oluştu!');
    }
  }
};
