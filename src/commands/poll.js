const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { db } = require('../../database/db');
const { polls } = require('../../../shared/schema');
const { eq } = require('drizzle-orm');

const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

module.exports = {
  name: 'anket',
  aliases: ['poll', 'oylama'],
  description: 'Gelişmiş süreli ve çoktan seçmeli anket oluşturur.',
  permissions: [PermissionFlagsBits.ManageMessages],
  usage: '!anket "[Soru]" "[Seçenek1]" "[Seçenek2]" ... [Süre: 1h/30m]',
  async execute(message, args, client) {
    const content = args.join(' ');
    const matches = content.match(/"([^"]+)"/g);

    if (!matches || matches.length < 2) {
      return message.reply('❌ Kullanım: `!anket "Soru" "Seçenek 1" "Seçenek 2" ...`\n💡 Örnek: `!anket "Favori renginiz?" "Mavi" "Kırmızı"`\nSüre eklemek isterseniz en sona `1h` veya `30m` yazabilirsiniz.');
    }

    let durationArgs = content.replace(/"([^"]+)"/g, '').trim().split(' ');
    let durationMs = 0;

    // Parse duration if exists (e.g. 1h, 30m, 1d)
    const timeArg = durationArgs.find(arg => arg.match(/^\d+[hmd]$/i));
    if (timeArg) {
      const val = parseInt(timeArg.slice(0, -1));
      const unit = timeArg.slice(-1).toLowerCase();
      if (unit === 'm') durationMs = val * 60 * 1000;
      else if (unit === 'h') durationMs = val * 60 * 60 * 1000;
      else if (unit === 'd') durationMs = val * 24 * 60 * 60 * 1000;
    }

    const question = matches[0].replace(/"/g, '');
    const options = matches.slice(1, 11).map(o => o.replace(/"/g, ''));

    if (options.length < 2) {
      return message.reply('❌ En az 2 seçenek belirtmelisiniz!');
    }

    const optionsText = options.map((opt, i) => `${numberEmojis[i]} ${opt}`).join('\n\n');
    let endsAt = null;

    if (durationMs > 0) {
      endsAt = new Date(Date.now() + durationMs);
    }

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`📊 Anket: ${question}`)
      .setDescription(optionsText)
      .setFooter({ text: `${message.author.tag} tarafından oluşturuldu${endsAt ? ` • Bitiş: ${endsAt.toLocaleString()}` : ''}` })
      .setTimestamp();

    try {
      const pollMessage = await message.channel.send({ embeds: [embed] });

      for (let i = 0; i < options.length; i++) {
        await pollMessage.react(numberEmojis[i]);
      }

      // Save to database for active tracking
      await db.insert(polls).values({
        guildId: message.guild.id,
        channelId: message.channel.id,
        messageId: pollMessage.id,
        question: question,
        options: options,
        votes: {},
        endsAt: endsAt,
        ended: false,
        createdBy: message.author.id
      });

      await message.delete().catch(() => { });
    } catch (error) {
      console.error('Anket hatası:', error);
      message.reply('❌ Anket oluşturulurken bir hata oluştu!');
    }
  }
};
