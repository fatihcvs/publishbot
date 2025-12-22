const { EmbedBuilder } = require('discord.js');
const { storage } = require('../database/storage');

module.exports = {
  name: 'komutlar',
  aliases: ['customcommands', 'listcmds', 'özelkomutlar'],
  description: 'Özel komutları listeler',
  async execute(message, args, client) {
    const commands = await storage.getCustomCommands(message.guild.id);
    
    if (!commands || commands.length === 0) {
      return message.reply('Bu sunucuda özel komut bulunmuyor. `!komutekle` ile ekleyebilirsiniz.');
    }
    
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Özel Komutlar')
      .setDescription(commands.map(cmd => `\`!${cmd.name}\``).join(', '))
      .setFooter({ text: `Toplam ${commands.length} özel komut` })
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};
