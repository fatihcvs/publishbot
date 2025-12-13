const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

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
    
    const guildCommands = client.customCommands[message.guild.id];
    
    if (!guildCommands || !guildCommands[cmdName]) {
      return message.reply('Bu komut bulunamadı!');
    }
    
    delete client.customCommands[message.guild.id][cmdName];
    client.saveCustomCommands();
    
    const embed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('Özel Komut Silindi')
      .setDescription(`**${cmdName}** komutu silindi.`)
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};
