const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { db } = require('../database/db');
const { polls } = require('../../shared/schema');
const { eq } = require('drizzle-orm');

const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
const BAR = (filled, total, len = 16) => {
  const fill = total > 0 ? Math.round((filled / total) * len) : 0;
  return '█'.repeat(fill) + '░'.repeat(len - fill);
};

module.exports = {
  name: 'anket',
  aliases: ['poll', 'oylama'],
  description: 'Gelişmiş anket: anonim, rol kısıtlı, süreli, sonuç görüntüleme.',
  usage: '!anket "Soru" "Seçenek1" "Seçenek2" [1h] [--anonim] [--rol @rol]',
  permissions: [PermissionFlagsBits.ManageMessages],

  async execute(message, args, client) {
    const rawContent = args.join(' ');
    const sub = args[0]?.toLowerCase();

    // ── Alt komutlar ──────────────────────────────────────────────────────
    if (sub === 'sonuç' || sub === 'sonuc' || sub === 'result') {
      return this.showResult(message, args[1], client);
    }
    if (sub === 'kapat' || sub === 'close') {
      return this.closePoll(message, args[1]);
    }

    // ── Yeni anket oluştur ─────────────────────────────────────────────────
    const matches = rawContent.match(/"([^"]+)"/g);
    if (!matches || matches.length < 2) {
      return message.reply([
        '❌ Kullanım: `!anket "Soru" "Seçenek 1" "Seçenek 2" [süre] [--anonim] [--rol @rol]`',
        '💡 Örnek: `!anket "Favori renk?" "Mavi" "Kırmızı" 30m --anonim`',
        '📊 Sonuç: `!anket sonuç <mesaj_id>`'
      ].join('\n')).catch(() => { });
    }

    // Flags
    const isAnon = /--anonim/i.test(rawContent);
    const rolMatch = rawContent.match(/--rol\s+<@&?(\d+)>/);
    const reqRoleId = rolMatch?.[1] || null;

    // Süre
    const cleaned = rawContent.replace(/"([^"]+)"/g, '').replace(/--anonim/i, '').replace(/--rol\s+<@&?\d+>/, '').trim();
    const timeArg = cleaned.split(/\s+/).find(a => /^\d+[smhd]$/i.test(a));
    let durationMs = 0;
    if (timeArg) {
      const n = parseInt(timeArg), u = timeArg.slice(-1).toLowerCase();
      durationMs = ({ s: 1e3, m: 6e4, h: 36e5, d: 864e5 })[u] * n;
    }

    const question = matches[0].replace(/"/g, '');
    const options = matches.slice(1, 11).map(o => o.replace(/"/g, ''));
    if (options.length < 2) return message.reply('❌ En az 2 seçenek belirtmelisiniz!').catch(() => { });

    const endsAt = durationMs > 0 ? new Date(Date.now() + durationMs) : null;

    const condLines = [];
    if (isAnon) condLines.push('🔒 Anonim');
    if (reqRoleId) condLines.push(`🎭 Sadece <@&${reqRoleId}>`);

    const optionsText = options.map((opt, i) => `${numberEmojis[i]} ${opt}`).join('\n\n');
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`📊 ${question}`)
      .setDescription(optionsText + (condLines.length ? `\n\n${condLines.join(' • ')}` : ''))
      .setFooter({ text: `${message.author.tag} tarafından${endsAt ? ` • Bitiş: <t:${Math.floor(endsAt.getTime() / 1000)}:R>` : ''}` })
      .setTimestamp();

    try {
      const pollMessage = await message.channel.send({ embeds: [embed] });
      for (let i = 0; i < options.length; i++) await pollMessage.react(numberEmojis[i]);

      await db.insert(polls).values({
        guildId: message.guild.id,
        channelId: message.channel.id,
        messageId: pollMessage.id,
        question,
        options,
        votes: { anonymous: isAnon, reqRoleId: reqRoleId || null },
        endsAt,
        ended: false,
        createdBy: message.author.id
      });

      await message.delete().catch(() => { });
    } catch (err) {
      console.error('[Poll] Hata:', err);
      message.reply('❌ Anket oluşturulurken bir hata oluştu!').catch(() => { });
    }
  },

  async showResult(message, messageId, client) {
    if (!messageId) return message.reply('❌ Kullanım: `!anket sonuç <mesaj_id>`').catch(() => { });

    const [poll] = await db.select().from(polls).where(eq(polls.messageId, messageId));
    if (!poll) return message.reply('Anket bulunamadı!').catch(() => { });

    const ch = message.guild.channels.cache.get(poll.channelId);
    if (!ch) return message.reply('Anket kanalı bulunamadı.').catch(() => { });

    const pollMsg = await ch.messages.fetch(messageId).catch(() => null);
    if (!pollMsg) return message.reply('Anket mesajı silinmiş.').catch(() => { });

    // Tepki sayıları
    const options = Array.isArray(poll.options) ? poll.options : JSON.parse(poll.options || '[]');
    const counts = [];
    for (let i = 0; i < options.length; i++) {
      const r = pollMsg.reactions.cache.get(numberEmojis[i]);
      counts.push(r ? Math.max(0, r.count - 1) : 0); // botu çıkar
    }
    const total = counts.reduce((a, b) => a + b, 0);

    const desc = options.map((opt, i) => {
      const cnt = counts[i];
      const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
      return `${numberEmojis[i]} **${opt}**\n\`${BAR(cnt, total)}\` ${cnt} oy (${pct}%)`;
    }).join('\n\n');

    const embed = new EmbedBuilder()
      .setColor('#57F287')
      .setTitle(`📊 Sonuç: ${poll.question}`)
      .setDescription(desc)
      .setFooter({ text: `Toplam ${total} oy` })
      .setTimestamp();

    return message.reply({ embeds: [embed] }).catch(() => { });
  },

  async closePoll(message, messageId) {
    if (!messageId) return message.reply('❌ Kullanım: `!anket kapat <mesaj_id>`').catch(() => { });
    const [poll] = await db.select().from(polls).where(eq(polls.messageId, messageId));
    if (!poll) return message.reply('Anket bulunamadı!').catch(() => { });
    if (poll.createdBy !== message.author.id && !message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply('Bu anketi kapatma yetkiniz yok.').catch(() => { });
    }
    await db.update(polls).set({ ended: true }).where(eq(polls.messageId, messageId));
    return message.reply('✅ Anket kapatıldı.').catch(() => { });
  }
};
