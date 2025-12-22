const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { storage } = require('../database/storage');

module.exports = {
  name: 'komutsil',
  aliases: ['deletecommand', 'delcmd', 'removecmd'],
  description: 'Özel komutu siler',
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(message, args, client) {
    const cmdName = args[0]?.toLowerCase();
    
    if (!cmdName) {
      return message.reply('Kullanım: `!komutsil <komut>`');
    }
    
    const existing = await storage.getCustomCommand(message.guild.id, cmdName);
    if (!existing) {
      return message.reply('Bu komut bulunamadı!');
    }
    
    await storage.deleteCustomCommand(message.guild.id, cmdName);
    
    const embed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('Özel Komut Silindi')
      .setDescription(`**!${cmdName}** komutu silindi.`)
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};
