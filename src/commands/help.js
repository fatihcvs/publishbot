const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'yardım',
  aliases: ['help', 'komutlar'],
  description: 'Tüm komutları gösterir',
  async execute(message, args, client) {
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Publisher Bot - Komutlar')
      .setDescription('Aşağıda tüm kullanılabilir komutları görebilirsiniz.')
      .addFields(
        { 
          name: '🛡️ Moderasyon', 
          value: '`!kick` `!ban` `!unban` `!mute` `!unmute` `!warn` `!uyarılar` `!temizle`',
          inline: false 
        },
        { 
          name: '⚙️ Ayarlar', 
          value: '`!otorol` `!hoşgeldin` `!log`',
          inline: false 
        },
        { 
          name: '🎭 Rol Yönetimi', 
          value: '`!rolekle` `!rolçıkar` `!roller`',
          inline: false 
        },
        { 
          name: '📝 Özel Komutlar', 
          value: '`!komutekle` `!komutsil` `!komutlar`',
          inline: false 
        },
        { 
          name: 'ℹ️ Bilgi', 
          value: '`!sunucu` `!kullanıcı` `!avatar` `!ping`',
          inline: false 
        }
      )
      .setFooter({ text: 'Publisher Bot | Dyno Benzeri Discord Botu' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
