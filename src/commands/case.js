const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const TYPE_NAMES = { warn: 'Uyarı', mute: 'Susturma', kick: 'Atma', ban: 'Yasaklama', unban: 'Yasak Kaldırma' };
const TYPE_EMOJI = { warn: '⚠️', mute: '🔇', kick: '👢', ban: '🔨', unban: '✅' };
const TYPE_COLOR = { warn: '#ffff00', mute: '#ff6600', kick: '#ff4400', ban: '#ff0000', unban: '#00ff00' };

module.exports = {
  name: 'vaka',
  aliases: ['case', 'modlog'],
  description: 'Moderasyon vakalarını gösterir. Kullanıcı bazlı veya tek vaka.',
  usage: '!vaka [#numara | @kullanıcı | istatistik]',
  permissions: [PermissionFlagsBits.ModerateMembers],

  async execute(message, args, client) {
    const { storage } = require('../database/storage');

    const sub = args[0];

    // ── !vaka istatistik ────────────────────────────────────────────────────
    if (sub === 'istatistik' || sub === 'stats') {
      const stats = await storage.getModStats(message.guild.id);
      if (!stats.length) return message.reply('Bu sunucuda henüz moderasyon vakası yok.');

      const lines = await Promise.all(stats.slice(0, 10).map(async (s, i) => {
        const mod = await client.users.fetch(s.moderatorId).catch(() => null);
        return `**${i + 1}.** ${mod?.tag || s.moderatorId} — ${s.total} işlem (⚠️${s.warns} 🔇${s.mutes} 👢${s.kicks} 🔨${s.bans})`;
      }));

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('📊 Moderatör İstatistikleri')
        .setDescription(lines.join('\n'))
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    // ── !vaka @kullanıcı [sayfa] ───────────────────────────────────────────
    const mentionedUser = message.mentions.users.first();
    const targetMember = message.mentions.members.first() || (mentionedUser ? null : null);
    if (mentionedUser) {
      const page = parseInt(args[1]) || 1;
      const limit = 8;
      const offset = (page - 1) * limit;

      const cases = await storage.getModCasesByUser(message.guild.id, mentionedUser.id, limit, offset);
      const totalCases = await storage.getModCases(message.guild.id, 9999)
        .then(all => all.filter(c => c.userId === mentionedUser.id).length).catch(() => 0);
      const totalPages = Math.ceil(totalCases / limit) || 1;

      if (!cases.length) return message.reply(`${mentionedUser.tag} için moderasyon vakası bulunamadı.`);

      const warnPts = await storage.getWarnPoints(message.guild.id, mentionedUser.id);

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`📋 ${mentionedUser.tag} — Moderasyon Geçmişi`)
        .setThumbnail(mentionedUser.displayAvatarURL())
        .setDescription(
          cases.map(c => {
            const emoji = TYPE_EMOJI[c.type] || '📋';
            const date = `<t:${Math.floor(new Date(c.createdAt).getTime() / 1000)}:d>`;
            return `${emoji} **#${c.caseNumber}** ${date} — ${c.reason?.slice(0, 40) || 'Sebep yok'}`;
          }).join('\n')
        )
        .addFields({ name: '📊 Aktif Uyarı Puanı', value: `${warnPts}`, inline: true })
        .setFooter({ text: `Sayfa ${page}/${totalPages} • Toplam ${totalCases} vaka` })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // ── !vaka <numara> ─────────────────────────────────────────────────────
    const caseNumber = parseInt(sub);
    if (caseNumber) {
      const modCase = await storage.getModCase(message.guild.id, caseNumber);
      if (!modCase) return message.reply('Vaka bulunamadı!');

      const user = await client.users.fetch(modCase.userId).catch(() => null);
      const moderator = await client.users.fetch(modCase.moderatorId).catch(() => null);

      const embed = new EmbedBuilder()
        .setColor(TYPE_COLOR[modCase.type] || '#5865F2')
        .setTitle(`${TYPE_EMOJI[modCase.type] || '📋'} Vaka #${modCase.caseNumber}`)
        .addFields(
          { name: 'Tür', value: TYPE_NAMES[modCase.type] || modCase.type, inline: true },
          { name: 'Kullanıcı', value: user ? `${user.tag} (<@${user.id}>)` : modCase.userId, inline: true },
          { name: 'Moderatör', value: moderator?.tag || modCase.moderatorId, inline: true },
          { name: 'Sebep', value: modCase.reason || 'Belirtilmedi' },
          { name: 'Tarih', value: `<t:${Math.floor(new Date(modCase.createdAt).getTime() / 1000)}:F>` }
        )
        .setTimestamp();

      if (modCase.duration) embed.addFields({ name: 'Süre', value: `${modCase.duration} dakika`, inline: true });
      if (modCase.note) embed.addFields({ name: '🔒 Mod Notu', value: modCase.note });

      return message.reply({ embeds: [embed] });
    }

    // ── !vaka — Son 10 vaka ────────────────────────────────────────────────
    const cases = await storage.getModCases(message.guild.id, 10);
    if (!cases.length) return message.reply('Bu sunucuda henüz moderasyon vakası yok.');

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('📋 Son Moderasyon Vakaları')
      .setDescription(
        cases.map(c => {
          const emoji = TYPE_EMOJI[c.type] || '📋';
          return `${emoji} **#${c.caseNumber}** <@${c.userId}> — ${c.reason?.slice(0, 35) || 'Sebep yok'}`;
        }).join('\n')
      )
      .setFooter({ text: '!vaka <numara> • !vaka @kullanıcı • !vaka istatistik' })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }
};
