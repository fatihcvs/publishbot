const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'avatar',
  aliases: ['av', 'pp', 'profil'],
  description: 'Kullanıcının avatarını gösterir',
  async execute(message, args, client) {
    const target = message.mentions.users.first() || client.users.cache.get(args[0]) || message.author;
    
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`${target.tag} - Avatar`)
      .setImage(target.displayAvatarURL({ dynamic: true, size: 1024 }))
      .addFields(
        { 
          name: 'Bağlantılar', 
          value: `[PNG](${target.displayAvatarURL({ format: 'png', size: 1024 })}) | [JPG](${target.displayAvatarURL({ format: 'jpg', size: 1024 })}) | [WEBP](${target.displayAvatarURL({ format: 'webp', size: 1024 })})` 
        }
      )
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};
