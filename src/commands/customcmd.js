const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

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
    
    if (!client.customCommands[message.guild.id]) {
      client.customCommands[message.guild.id] = {};
    }
    
    client.customCommands[message.guild.id][cmdName] = response;
    client.saveCustomCommands();
    
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('Özel Komut Eklendi')
      .addFields(
        { name: 'Komut', value: cmdName, inline: true },
        { name: 'Yanıt', value: response, inline: true }
      )
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};
