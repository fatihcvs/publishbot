const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'uyarılar',
  aliases: ['warnings', 'warns'],
  description: 'Bir üyenin uyarılarını gösterir',
  permissions: [PermissionFlagsBits.ModerateMembers],
  async execute(message, args, client) {
    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
    
    const guildWarnings = client.warnings[message.guild.id] || {};
    const userWarnings = guildWarnings[target.id] || [];
    
    if (userWarnings.length === 0) {
      return message.reply(`${target.user.tag} kullanıcısının hiç uyarısı yok.`);
    }
    
    const embed = new EmbedBuilder()
      .setColor('#ffff00')
      .setTitle(`${target.user.tag} - Uyarılar`)
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
      .setDescription(`Toplam ${userWarnings.length} uyarı`)
      .setTimestamp();
    
    userWarnings.slice(-10).forEach((warn, index) => {
      const moderator = message.guild.members.cache.get(warn.moderator);
      embed.addFields({
        name: `Uyarı #${index + 1}`,
        value: `**Sebep:** ${warn.reason}\n**Moderatör:** ${moderator?.user.tag || 'Bilinmiyor'}\n**Tarih:** <t:${Math.floor(new Date(warn.date).getTime() / 1000)}:R>`
      });
    });
    
    await message.reply({ embeds: [embed] });
  }
};
