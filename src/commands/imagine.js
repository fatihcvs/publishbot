const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { generateImage } = require('../modules/chatgpt');
const https = require('https');

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: Failed to download image`));
        return;
      }

      const contentLength = parseInt(response.headers['content-length'] || '0', 10);
      if (contentLength > MAX_IMAGE_SIZE) {
        reject(new Error('Image too large'));
        return;
      }

      const chunks = [];
      let totalSize = 0;

      response.on('data', (chunk) => {
        totalSize += chunk.length;
        if (totalSize > MAX_IMAGE_SIZE) {
          request.destroy();
          reject(new Error('Image too large'));
          return;
        }
        chunks.push(chunk);
      });

      response.on('end', () => {
        if (chunks.length === 0) {
          reject(new Error('Empty response'));
          return;
        }
        resolve(Buffer.concat(chunks));
      });

      response.on('error', reject);
    });

    request.on('error', reject);
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

module.exports = {
  name: 'görsel',
  aliases: ['imagine', 'resim', 'image', 'dall-e', 'dalle', 'çiz', 'oluştur'],
  description: 'Yapay zeka ile görsel oluşturur',
  async execute(message, args, client) {
    if (!process.env.OPENAI_API_KEY) {
      return message.reply('Görsel oluşturma özelliği şu anda kullanılamıyor. API anahtarı ayarlanmamış.');
    }

    if (args.length === 0) {
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🎨 Görsel Oluşturma')
        .setDescription('DALL-E 3 ile hayal ettiğiniz görselleri oluşturun!')
        .addFields(
          { 
            name: '📝 Kullanım', 
            value: '`!görsel <açıklama>`\nÖrnek: `!görsel güneş batımında sahilde yürüyen bir kedi`', 
            inline: false 
          },
          { 
            name: '💡 İpuçları', 
            value: '• Detaylı açıklamalar daha iyi sonuçlar verir\n• Stil belirtebilirsiniz (yağlı boya, dijital art, anime vb.)\n• Renk ve ışık detayları ekleyin', 
            inline: false 
          },
          {
            name: '⚠️ Kurallar',
            value: '• Uygunsuz içerik oluşturulamaz\n• Telif hakkı olan karakterler sınırlıdır\n• Görsel oluşturma biraz zaman alabilir',
            inline: false
          }
        )
        .setFooter({ text: 'DALL-E 3 ile desteklenmektedir' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    const prompt = args.join(' ');

    if (prompt.length > 4000) {
      return message.reply('Açıklama çok uzun! Maksimum 4000 karakter kullanabilirsiniz.');
    }

    const loadingEmbed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('🎨 Görsel Oluşturuluyor...')
      .setDescription('Bu işlem 10-30 saniye sürebilir. Lütfen bekleyin...')
      .addFields({ name: '📝 İstek', value: prompt.substring(0, 1024) })
      .setTimestamp();

    const loadingMsg = await message.reply({ embeds: [loadingEmbed] });

    try {
      const result = await generateImage(prompt, message.author.id);

      if (!result.success) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Görsel Oluşturulamadı')
          .setDescription(result.error)
          .setTimestamp();

        return loadingMsg.edit({ embeds: [errorEmbed] });
      }

      let attachment;
      try {
        const imageBuffer = await downloadImage(result.url);
        attachment = new AttachmentBuilder(imageBuffer, { name: 'generated_image.png' });
      } catch (downloadError) {
        console.error('Image download failed, using URL fallback:', downloadError);
        const successEmbed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('🎨 Görsel Oluşturuldu!')
          .setImage(result.url)
          .addFields(
            { name: '📝 Orijinal İstek', value: prompt.substring(0, 1024), inline: false }
          )
          .setFooter({ text: `İstenen: ${message.author.tag} | DALL-E 3` })
          .setTimestamp();

        if (result.revisedPrompt && result.revisedPrompt !== prompt) {
          successEmbed.addFields({ 
            name: '🔄 Optimize Edilmiş Açıklama', 
            value: result.revisedPrompt.substring(0, 1024), 
            inline: false 
          });
        }

        return loadingMsg.edit({ embeds: [successEmbed] });
      }

      const successEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🎨 Görsel Oluşturuldu!')
        .setImage('attachment://generated_image.png')
        .addFields(
          { name: '📝 Orijinal İstek', value: prompt.substring(0, 1024), inline: false }
        )
        .setFooter({ text: `İstenen: ${message.author.tag} | DALL-E 3` })
        .setTimestamp();

      if (result.revisedPrompt && result.revisedPrompt !== prompt) {
        successEmbed.addFields({ 
          name: '🔄 Optimize Edilmiş Açıklama', 
          value: result.revisedPrompt.substring(0, 1024), 
          inline: false 
        });
      }

      await loadingMsg.edit({ embeds: [successEmbed], files: [attachment] });
    } catch (error) {
      console.error('Image generation command error:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Hata')
        .setDescription('Görsel oluşturulurken beklenmeyen bir hata oluştu!')
        .setTimestamp();

      await loadingMsg.edit({ embeds: [errorEmbed] });
    }
  }
};
