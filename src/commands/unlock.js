const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'unlock',
  aliases: ['kilidiAç', 'aç'],
  description: 'Kanal kilidini açar',
  permissions: [PermissionFlagsBits.ManageChannels],
  async execute(message, args, client) {
    const channel = message.mentions.channels.first() || message.channel;
    
    try {
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: null
      });
      
      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('🔓 Kanal Kilidi Açıldı')
        .setDescription(`${channel} kanalının kilidi açıldı.`)
        .addFields({ name: 'Moderatör', value: message.author.tag })
        .setTimestamp();
      
      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      message.reply('Kanal kilidi açılırken bir hata oluştu!');
    }
  }
};
