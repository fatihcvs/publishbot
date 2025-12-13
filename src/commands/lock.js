const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'lock',
  aliases: ['kilitle', 'kapat'],
  description: 'Kanalı kilitler',
  permissions: [PermissionFlagsBits.ManageChannels],
  async execute(message, args, client) {
    const channel = message.mentions.channels.first() || message.channel;
    
    try {
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: false
      });
      
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('🔒 Kanal Kilitlendi')
        .setDescription(`${channel} kanalı kilitlendi.`)
        .addFields({ name: 'Moderatör', value: message.author.tag })
        .setTimestamp();
      
      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      message.reply('Kanal kilitlenirken bir hata oluştu!');
    }
  }
};
