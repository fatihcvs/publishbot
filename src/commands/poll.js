const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

module.exports = {
  name: 'anket',
  aliases: ['poll', 'oylama'],
  description: 'Anket oluşturur',
  permissions: [PermissionFlagsBits.ManageMessages],
  async execute(message, args, client) {
    const content = args.join(' ');
    const matches = content.match(/"([^"]+)"/g);
    
    if (!matches || matches.length < 2) {
      return message.reply('Kullanım: `!anket "Soru" "Seçenek 1" "Seçenek 2" ...`\nÖrnek: `!anket "Favori renginiz?" "Mavi" "Kırmızı" "Yeşil"`');
    }
    
    const question = matches[0].replace(/"/g, '');
    const options = matches.slice(1, 11).map(o => o.replace(/"/g, ''));
    
    if (options.length < 2) {
      return message.reply('En az 2 seçenek belirtmelisiniz!');
    }
    
    const optionsText = options.map((opt, i) => `${numberEmojis[i]} ${opt}`).join('\n');
    
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`📊 ${question}`)
      .setDescription(optionsText)
      .setFooter({ text: `${message.author.tag} tarafından oluşturuldu` })
      .setTimestamp();
    
    try {
      const pollMessage = await message.channel.send({ embeds: [embed] });
      
      for (let i = 0; i < options.length; i++) {
        await pollMessage.react(numberEmojis[i]);
      }
      
      await message.delete().catch(() => {});
    } catch (error) {
      console.error(error);
      message.reply('Anket oluşturulurken bir hata oluştu!');
    }
  }
};
