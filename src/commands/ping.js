const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'ping',
  aliases: ['gecikme', 'latency'],
  description: 'Bot gecikmesini gösterir',
  async execute(message, args, client) {
    const sent = await message.reply('Ping ölçülüyor...');
    
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🏓 Pong!')
      .addFields(
        { name: 'Bot Gecikmesi', value: `${sent.createdTimestamp - message.createdTimestamp}ms`, inline: true },
        { name: 'API Gecikmesi', value: `${Math.round(client.ws.ping)}ms`, inline: true }
      )
      .setTimestamp();
    
    await sent.edit({ content: null, embeds: [embed] });
  }
};
