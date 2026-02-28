const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'çekiliş',
  aliases: ['giveaway', 'cekilis', 'gw'],
  description: 'Gelişmiş çekiliş sistemi: koşullar, yeniden çekme, DM bildirimi.',
  usage: '!çekiliş başlat <süre> <kazanan> <ödül> [--rol @rol] [--seviye <n>]',
  permissions: [PermissionFlagsBits.ManageMessages],

  async execute(message, args, client) {
    const { storage } = require('../database/storage');
    const sub = args[0]?.toLowerCase();

    switch (sub) {
      case 'başlat': case 'basla': case 'start': case 'oluştur': case 'olustur':
        return this.start(message, args.slice(1), storage);
      case 'bitir': case 'end':
        return this.end(message, args.slice(1), storage, client);
      case 'yeniden': case 'reroll':
        return this.reroll(message, args.slice(1), storage, client);
      case 'liste': case 'list':
        return this.list(message, storage);
      default:
        return this.sendHelp(message);
    }
  },

  async start(message, args, storage) {
    // Parse flags: --rol, --seviye
    const rawArgs = args.join(' ');
    const rolMatch = rawArgs.match(/--rol\s+<@&?(\d+)>/);
    const levelMatch = rawArgs.match(/--seviye\s+(\d+)/);
    const reqRoleId = rolMatch?.[1] || null;
    const reqLevel = levelMatch ? parseInt(levelMatch[1]) : null;

    // Strip flags from args for duration/winners/prize parsing
    const cleanArgs = rawArgs
      .replace(/--rol\s+<@&?\d+>/, '')
      .replace(/--seviye\s+\d+/, '')
      .trim().split(/\s+/).filter(Boolean);

    const [duration, winnerArg, ...prizeArr] = cleanArgs;
    const winners = parseInt(winnerArg) || 1;
    const prize = prizeArr.join(' ');

    if (!duration || !prize) {
      return message.reply('❌ Kullanım: `!çekiliş başlat <süre> <kazanan_sayısı> <ödül>`\nÖrnek: `!çekiliş başlat 1h 2 Discord Nitro --rol @Member --seviye 5`').catch(() => { });
    }

    const timeMatch = duration.match(/^(\d+)([smhd])$/i);
    if (!timeMatch) return message.reply('❌ Geçersiz süre! Örnek: 30m, 1h, 2d').catch(() => { });

    const amount = parseInt(timeMatch[1]);
    const unit = timeMatch[2].toLowerCase();
    const ms = ({ s: 1000, m: 6e4, h: 36e5, d: 864e5 })[unit] * amount;
    const endsAt = new Date(Date.now() + ms);

    // Koşul metni
    const conditions = [];
    if (reqRoleId) conditions.push(`<@&${reqRoleId}> rolüne sahip ol`);
    if (reqLevel) conditions.push(`Seviye ${reqLevel}+ ol`);
    const condText = conditions.length ? '\n**Koşullar:** ' + conditions.join(', ') : '';

    const embed = new EmbedBuilder()
      .setColor('#ff69b4')
      .setTitle('🎉 ÇEKİLİŞ!')
      .setDescription(`**Ödül:** ${prize}\n**Kazanan:** ${winners} kişi\n**Bitiş:** <t:${Math.floor(endsAt.getTime() / 1000)}:R>${condText}`)
      .addFields({ name: 'Katılmak için', value: '🎉 tepkisine tıklayın!' })
      .setFooter({ text: `${message.author.tag} tarafından` })
      .setTimestamp();

    const gwMsg = await message.channel.send({ embeds: [embed] });
    await gwMsg.react('🎉');

    const gw = await storage.createGiveaway(
      message.guild.id, message.channel.id, prize, winners, endsAt, message.author.id
    );
    await storage.updateGiveaway(gw.id, {
      messageId: gwMsg.id,
      // Koşulları JSON extra alanında sakla (giveaways tablosunda yoksa prize alanı prefix ile)
    });

    // Koşulları giveaway prize alanına prefix olarak sakla (geriye uyumlu)
    if (reqRoleId || reqLevel) {
      const condJson = JSON.stringify({ reqRoleId, reqLevel });
      await storage.updateGiveaway(gw.id, { prize: `__COND__${condJson}__${prize}` });
    }

    await message.delete().catch(() => { });
  },

  async end(message, args, storage, client) {
    const messageId = args[0];
    if (!messageId) return message.reply('❌ Kullanım: `!çekiliş bitir <mesaj_id>`').catch(() => { });

    const gw = await storage.getGiveawayByMessageId(messageId);
    if (!gw) return message.reply('Çekiliş bulunamadı!').catch(() => { });
    if (gw.ended) return message.reply('Bu çekiliş zaten bitti.').catch(() => { });

    await this.pickWinners(message.guild, gw, storage, client, message.channel);
  },

  async reroll(message, args, storage, client) {
    const messageId = args[0];
    if (!messageId) return message.reply('❌ Kullanım: `!çekiliş yeniden <mesaj_id>`').catch(() => { });

    const gw = await storage.getGiveawayByMessageId(messageId);
    if (!gw) return message.reply('Çekiliş bulunamadı!').catch(() => { });

    await this.pickWinners(message.guild, gw, storage, client, message.channel, true);
  },

  async pickWinners(guild, gw, storage, client, channel, isReroll = false) {
    try {
      const ch = guild.channels.cache.get(gw.channelId) || channel;
      if (!ch) return;

      let gwMsg = await ch.messages.fetch(gw.messageId).catch(() => null);

      // Kazanan koşul parse
      let reqRoleId = null, reqLevel = null, realPrize = gw.prize;
      if (gw.prize?.startsWith('__COND__')) {
        const m = gw.prize.match(/^__COND__(.+?)__(.+)$/s);
        if (m) {
          try { const c = JSON.parse(m[1]); reqRoleId = c.reqRoleId; reqLevel = c.reqLevel; } catch { }
          realPrize = m[2];
        }
      }

      // Tepki yapanları topla
      const reaction = gwMsg?.reactions?.cache.get('🎉');
      const users = reaction ? (await reaction.users.fetch()).filter(u => !u.bot) : new Map();

      // Koşul filtresi
      let eligible = [];
      for (const [, user] of users) {
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) continue;
        if (reqRoleId && !member.roles.cache.has(reqRoleId)) continue;
        if (reqLevel) {
          const lvl = await storage.getUserLevel(guild.id, user.id);
          if ((lvl?.level || 0) < reqLevel) continue;
        }
        eligible.push(user);
      }

      const count = Math.min(gw.winners, eligible.length);
      const winners = [];
      const pool = [...eligible];
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        winners.push(pool.splice(idx, 1)[0]);
      }

      if (winners.length === 0) {
        await ch.send(`🎉 **${realPrize}** çekilişi bitti ama koşulları karşılayan kimse yok!`);
      } else {
        const winTxt = winners.map(u => `<@${u.id}>`).join(', ');
        const label = isReroll ? '🔄 Yeniden Çekiliş' : '🎉 Çekiliş Bitti';
        await ch.send({
          embeds: [new EmbedBuilder()
            .setColor('#ffd700')
            .setTitle(`${label}: ${realPrize}`)
            .setDescription(`Kazanan${winners.length > 1 ? 'lar' : ''}: ${winTxt} 🎊`)
            .setTimestamp()]
        });

        // DM bildirimi
        for (const w of winners) {
          await w.send({
            embeds: [new EmbedBuilder()
              .setColor('#ffd700')
              .setTitle('🎉 Tebrikler!')
              .setDescription(`**${guild.name}** sunucusunda **${realPrize}** çekilişini kazandın!\nYetkili ile iletişime geç.`)
              .setTimestamp()]
          }).catch(() => { });
        }
      }

      if (!isReroll) await storage.updateGiveaway(gw.id, { ended: true });
    } catch (err) {
      console.error('[Giveaway.pickWinners]', err);
    }
  },

  async list(message, storage) {
    const gws = await storage.getActiveGiveawaysByGuild(message.guild.id);
    if (!gws.length) return message.reply('Bu sunucuda aktif çekiliş yok.').catch(() => { });

    const lines = gws.map(g => {
      const prize = g.prize?.startsWith('__COND__') ? g.prize.replace(/^__COND__.+?__/, '') : g.prize;
      return `🎉 **${prize}** — <t:${Math.floor(new Date(g.endsAt).getTime() / 1000)}:R> — ID: \`${g.messageId || '?'}\``;
    });

    return message.reply({
      embeds: [new EmbedBuilder()
        .setColor('#ff69b4')
        .setTitle('🎉 Aktif Çekilişler')
        .setDescription(lines.join('\n'))
        .setTimestamp()]
    }).catch(() => { });
  },

  sendHelp(message) {
    const embed = new EmbedBuilder().setColor('#ff69b4').setTitle('🎉 Çekiliş Sistemi')
      .addFields(
        { name: 'Başlat', value: '`!çekiliş başlat <süre> <kazanan> <ödül> [--rol @rol] [--seviye N]`' },
        { name: 'Bitir', value: '`!çekiliş bitir <mesaj_id>`' },
        { name: 'Yeniden', value: '`!çekiliş yeniden <mesaj_id>`' },
        { name: 'Listele', value: '`!çekiliş liste`' }
      );
    return message.reply({ embeds: [embed] }).catch(() => { });
  }
};
