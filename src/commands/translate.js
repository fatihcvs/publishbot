const { EmbedBuilder } = require('discord.js');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const languages = {
  tr: { name: 'Türkçe', emoji: '🇹🇷' },
  en: { name: 'İngilizce', emoji: '🇬🇧' },
  de: { name: 'Almanca', emoji: '🇩🇪' },
  fr: { name: 'Fransızca', emoji: '🇫🇷' },
  es: { name: 'İspanyolca', emoji: '🇪🇸' },
  it: { name: 'İtalyanca', emoji: '🇮🇹' },
  pt: { name: 'Portekizce', emoji: '🇵🇹' },
  ru: { name: 'Rusça', emoji: '🇷🇺' },
  ja: { name: 'Japonca', emoji: '🇯🇵' },
  ko: { name: 'Korece', emoji: '🇰🇷' },
  zh: { name: 'Çince', emoji: '🇨🇳' },
  ar: { name: 'Arapça', emoji: '🇸🇦' },
  nl: { name: 'Felemenkçe', emoji: '🇳🇱' },
  pl: { name: 'Lehçe', emoji: '🇵🇱' },
  sv: { name: 'İsveççe', emoji: '🇸🇪' },
  no: { name: 'Norveççe', emoji: '🇳🇴' },
  fi: { name: 'Fince', emoji: '🇫🇮' },
  da: { name: 'Danca', emoji: '🇩🇰' },
  el: { name: 'Yunanca', emoji: '🇬🇷' },
  uk: { name: 'Ukraynaca', emoji: '🇺🇦' }
};

async function translateText(text, targetLang) {
  const langInfo = languages[targetLang];
  if (!langInfo) return null;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the following text to ${langInfo.name}. Only provide the translation, nothing else. Preserve the original meaning and tone.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      max_tokens: 1024
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Translation error:', error);
    return null;
  }
}

module.exports = {
  name: 'çevir',
  aliases: ['translate', 'ceviri', 'çeviri'],
  description: 'Metni farklı dillere çevirir',
  async execute(message, args, client) {
    if (!process.env.OPENAI_API_KEY) {
      return message.reply('Çeviri özelliği şu anda kullanılamıyor. API anahtarı ayarlanmamış.');
    }

    if (args.length < 2) {
      const langList = Object.entries(languages)
        .map(([code, info]) => `${info.emoji} \`${code}\` - ${info.name}`)
        .join('\n');

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🌍 Çeviri Komutu')
        .setDescription('Metinleri farklı dillere çevirebilirsiniz!')
        .addFields(
          { 
            name: '📝 Kullanım', 
            value: '`!çevir <dil_kodu> <metin>`\nÖrnek: `!çevir en Merhaba dünya!`', 
            inline: false 
          },
          { 
            name: '🌐 Desteklenen Diller', 
            value: langList, 
            inline: false 
          }
        )
        .setFooter({ text: 'OpenAI GPT-4o ile desteklenmektedir' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    const targetLang = args[0].toLowerCase();
    const textToTranslate = args.slice(1).join(' ');

    if (!languages[targetLang]) {
      return message.reply(`Geçersiz dil kodu! Desteklenen diller için \`!çevir\` yazın.`);
    }

    if (textToTranslate.length > 2000) {
      return message.reply('Çevrilecek metin çok uzun! Maksimum 2000 karakter.');
    }

    const loadingMsg = await message.reply('🔄 Çeviriliyor...');

    try {
      const translation = await translateText(textToTranslate, targetLang);

      if (!translation) {
        return loadingMsg.edit('❌ Çeviri yapılırken bir hata oluştu!');
      }

      const langInfo = languages[targetLang];
      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle(`${langInfo.emoji} ${langInfo.name} Çevirisi`)
        .addFields(
          { name: '📝 Orijinal Metin', value: textToTranslate.substring(0, 1024), inline: false },
          { name: '🌐 Çeviri', value: translation.substring(0, 1024), inline: false }
        )
        .setFooter({ text: `İstenen: ${message.author.tag}` })
        .setTimestamp();

      await loadingMsg.edit({ content: null, embeds: [embed] });
    } catch (error) {
      console.error('Translation command error:', error);
      await loadingMsg.edit('❌ Çeviri yapılırken bir hata oluştu!');
    }
  }
};
