const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { storage } = require('../database/storage');

module.exports = {
  name: 'komutekle',
  aliases: ['addcommand', 'addcmd'],
  description: 'Özel komut ekler',
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(message, args, client) {
    const cmdName = args[0]?.toLowerCase();
    const response = args.slice(1).join(' ');
    
    if (!cmdName || !response) {
      return message.reply('Kullanım: `!komutekle <komut> <yanıt>`\nÖrnek: `!komutekle selam Merhaba!`');
    }
    
    const existing = await storage.getCustomCommand(message.guild.id, cmdName);
    if (existing) {
      await storage.deleteCustomCommand(message.guild.id, cmdName);
    }
    
    await storage.addCustomCommand(message.guild.id, cmdName, response, message.author.id);
    
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('Özel Komut Eklendi')
      .addFields(
        { name: 'Komut', value: `!${cmdName}`, inline: true },
        { name: 'Yanıt', value: response.slice(0, 100), inline: true }
      )
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};
