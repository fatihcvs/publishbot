const { EmbedBuilder } = require('discord.js');
const { analyzeImage } = require('../modules/chatgpt');

module.exports = {
  name: 'analiz',
  aliases: ['analyze', 'görselanaliz', 'imageanalysis', 'bak'],
  description: 'Görselleri yapay zeka ile analiz eder',
  async execute(message, args, client) {
    if (!process.env.OPENAI_API_KEY) {
      return message.reply('Görsel analizi özelliği şu anda kullanılamıyor. API anahtarı ayarlanmamış.');
    }

    let imageUrl = null;
    let question = args.join(' ');

    if (message.attachments.size > 0) {
      const attachment = message.attachments.first();
      if (attachment.contentType?.startsWith('image/')) {
        imageUrl = attachment.url;
      }
    }

    if (!imageUrl && message.reference) {
      try {
        const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
        if (referencedMessage.attachments.size > 0) {
          const attachment = referencedMessage.attachments.first();
          if (attachment.contentType?.startsWith('image/')) {
            imageUrl = attachment.url;
          }
        }
      } catch (err) {
        console.error('Failed to fetch referenced message:', err);
      }
    }

    const urlMatch = args.find(arg => arg.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/i));
    if (!imageUrl && urlMatch) {
      imageUrl = urlMatch;
      question = args.filter(arg => arg !== urlMatch).join(' ');
    }

    if (!imageUrl) {
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🔍 Görsel Analizi')
        .setDescription('Yapay zeka ile görselleri analiz edin!')
        .addFields(
          { 
            name: '📝 Kullanım', 
            value: '**Yöntem 1:** Görseli mesaja ekleyerek\n`!analiz [soru]` + görsel eki\n\n**Yöntem 2:** Görsel URL\'si ile\n`!analiz <görsel_url> [soru]`\n\n**Yöntem 3:** Görselli mesajı yanıtlayarak\n`!analiz [soru]` (görselli mesajı yanıtla)', 
            inline: false 
          },
          { 
            name: '💡 Örnek Sorular', 
            value: '• `!analiz Bu görselde ne var?`\n• `!analiz Bu kıyafetler hangi marka?`\n• `!analiz Bu yemek nasıl yapılır?`\n• `!analiz Bu metin ne diyor?`', 
            inline: false 
          }
        )
        .setFooter({ text: 'GPT-4o Vision ile desteklenmektedir' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    const loadingEmbed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('🔍 Görsel Analiz Ediliyor...')
      .setDescription('Lütfen bekleyin...')
      .setThumbnail(imageUrl)
      .setTimestamp();

    const loadingMsg = await message.reply({ embeds: [loadingEmbed] });

    try {
      const result = await analyzeImage(imageUrl, question || null);

      if (!result.success) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Analiz Yapılamadı')
          .setDescription(result.error)
          .setTimestamp();

        return loadingMsg.edit({ embeds: [errorEmbed] });
      }

      const successEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🔍 Görsel Analizi')
        .setThumbnail(imageUrl)
        .setDescription(result.analysis.substring(0, 4000))
        .setFooter({ text: `İstenen: ${message.author.tag} | GPT-4o Vision` })
        .setTimestamp();

      if (question) {
        successEmbed.addFields({ name: '❓ Soru', value: question.substring(0, 256), inline: false });
      }

      await loadingMsg.edit({ embeds: [successEmbed] });
    } catch (error) {
      console.error('Image analysis command error:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Hata')
        .setDescription('Görsel analizi yapılırken beklenmeyen bir hata oluştu!')
        .setTimestamp();

      await loadingMsg.edit({ embeds: [errorEmbed] });
    }
  }
};
