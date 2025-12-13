const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'afk',
  aliases: ['uzakta'],
  description: 'AFK durumunu ayarlar',
  async execute(message, args, client) {
    const { storage } = require('../database/storage');
    const reason = args.join(' ') || 'Sebep belirtilmedi';
    
    await storage.setAfk(message.guild.id, message.author.id, reason);
    
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('💤 AFK Modu')
      .setDescription(`${message.author.tag} artık AFK.\n**Sebep:** ${reason}`)
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};
