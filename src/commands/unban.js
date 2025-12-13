const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'unban',
  aliases: ['yasakkaldır'],
  description: 'Bir kullanıcının yasağını kaldırır',
  permissions: [PermissionFlagsBits.BanMembers],
  async execute(message, args, client) {
    const userId = args[0];
    
    if (!userId) {
      return message.reply('Lütfen yasağı kaldırılacak kullanıcının ID\'sini belirtin!');
    }
    
    try {
      await message.guild.members.unban(userId);
      
      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('Yasak Kaldırıldı')
        .addFields(
          { name: 'Kullanıcı ID', value: userId, inline: true },
          { name: 'Moderatör', value: message.author.tag, inline: true }
        )
        .setTimestamp();
      
      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      message.reply('Yasak kaldırılırken bir hata oluştu! Kullanıcı ID\'sini kontrol edin.');
    }
  }
};
