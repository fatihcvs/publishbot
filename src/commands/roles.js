const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'roller',
  aliases: ['roles', 'rollist'],
  description: 'Sunucudaki tüm rolleri listeler',
  async execute(message, args, client) {
    const roles = message.guild.roles.cache
      .filter(role => role.id !== message.guild.id)
      .sort((a, b) => b.position - a.position)
      .map(role => `${role} - ${role.members.size} üye`);
    
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`${message.guild.name} - Roller`)
      .setDescription(roles.slice(0, 25).join('\n') || 'Rol bulunamadı')
      .setFooter({ text: `Toplam ${roles.length} rol` })
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};
