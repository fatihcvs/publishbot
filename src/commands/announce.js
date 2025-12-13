const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'duyuru',
  aliases: ['announce', 'duyur'],
  description: 'Duyuru gönderir',
  permissions: [PermissionFlagsBits.ManageMessages],
  async execute(message, args, client) {
    const channel = message.mentions.channels.first();
    let text;
    
    if (channel) {
      text = args.slice(1).join(' ');
    } else {
      text = args.join(' ');
    }
    
    if (!text) {
      return message.reply('Kullanım: `!duyuru #kanal Duyuru metni` veya `!duyuru Duyuru metni`');
    }
    
    const targetChannel = channel || message.channel;
    
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('📢 Duyuru')
      .setDescription(text)
      .setFooter({ text: `${message.author.tag} tarafından`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();
    
    try {
      await targetChannel.send({ embeds: [embed] });
      if (channel) {
        await message.reply(`Duyuru ${channel} kanalına gönderildi!`);
      }
    } catch (error) {
      console.error(error);
      message.reply('Duyuru gönderilirken bir hata oluştu!');
    }
  }
};
