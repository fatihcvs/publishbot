const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'sunucu',
  aliases: ['serverinfo', 'server', 'sunucubilgi'],
  description: 'Sunucu bilgilerini gösterir',
  async execute(message, args, client) {
    const guild = message.guild;
    
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(guild.name)
      .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
      .addFields(
        { name: 'Sunucu ID', value: guild.id, inline: true },
        { name: 'Sahip', value: `<@${guild.ownerId}>`, inline: true },
        { name: 'Oluşturulma Tarihi', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Üye Sayısı', value: `${guild.memberCount}`, inline: true },
        { name: 'Kanal Sayısı', value: `${guild.channels.cache.size}`, inline: true },
        { name: 'Rol Sayısı', value: `${guild.roles.cache.size}`, inline: true },
        { name: 'Emoji Sayısı', value: `${guild.emojis.cache.size}`, inline: true },
        { name: 'Boost Seviyesi', value: `${guild.premiumTier}`, inline: true },
        { name: 'Boost Sayısı', value: `${guild.premiumSubscriptionCount || 0}`, inline: true }
      )
      .setTimestamp();
    
    if (guild.description) {
      embed.setDescription(guild.description);
    }
    
    await message.reply({ embeds: [embed] });
  }
};
