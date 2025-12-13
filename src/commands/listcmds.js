const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'komutlar',
  aliases: ['customcommands', 'listcmds', 'özelkomutlar'],
  description: 'Özel komutları listeler',
  async execute(message, args, client) {
    const guildCommands = client.customCommands[message.guild.id] || {};
    const commandList = Object.keys(guildCommands);
    
    if (commandList.length === 0) {
      return message.reply('Bu sunucuda özel komut bulunmuyor. `!komutekle` ile ekleyebilirsiniz.');
    }
    
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Özel Komutlar')
      .setDescription(commandList.map(cmd => `\`${cmd}\``).join(', '))
      .setFooter({ text: `Toplam ${commandList.length} özel komut` })
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};
