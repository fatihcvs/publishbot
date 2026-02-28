const { EmbedBuilder } = require('discord.js');

class Scheduler {
  constructor(client, storage) {
    this.client = client;
    this.storage = storage;
    this.intervals = [];
  }

  start() {
    this.intervals.push(setInterval(() => this.checkReminders(), 30000));
    this.intervals.push(setInterval(() => this.checkGiveaways(), 30000));
    this.intervals.push(setInterval(() => this.checkScheduledMessages(), 60000));
    this.intervals.push(setInterval(() => this.checkBirthdays(), 3600000));
    this.intervals.push(setInterval(() => this.checkPolls(), 60000));
    this.intervals.push(setInterval(() => this.checkSocials(), 300000));
    // Faz 6
    this.intervals.push(setInterval(() => this.checkTwitch(), 180000));    // 3 dakika
    this.intervals.push(setInterval(() => this.checkRSSFeeds(), 900000));  // 15 dakika
    this.intervals.push(setInterval(() => this.checkSteamDeals(), 3600000)); // 1 saat
    this.twitchToken = null;
    this.twitchTokenExp = 0;
    this.rssLastChecked = new Map(); // feedId → timestamp
    this.announcedBirthdays = new Set();
    this.lastBirthdayCheck = null;
    setTimeout(() => this.checkBirthdays(), 10000);
    setTimeout(() => this.checkSocials(), 15000);
    console.log('Scheduler started');
  }

  async checkSocials() {
    try {
      const { db } = require('../database/db');
      const { socialNotifications } = require('../../shared/schema');
      const { eq } = require('drizzle-orm');
      const axios = require('axios');
      const xml2js = require('xml2js');

      const socials = await db.select().from(socialNotifications).where(eq(socialNotifications.enabled, true));

      for (const social of socials) {
        const guild = await this.client.guilds.fetch(social.guildId).catch(() => null);
        if (!guild) continue;

        const channel = await guild.channels.fetch(social.channelId).catch(() => null);
        if (!channel) continue;

        try {
          let latestPostId = null;
          let postUrl = '';
          let postTitle = '';

          if (social.platform === 'youtube') {
            // Fetch YouTube RSS feed
            const res = await axios.default.get(`https://www.youtube.com/feeds/videos.xml?channel_id=${social.username}`);
            const parser = new xml2js.Parser();
            const result = await parser.parseStringPromise(res.data);

            const entry = result.feed.entry?.[0];
            if (!entry) continue;

            latestPostId = entry.id[0];
            postUrl = entry.link[0].$.href;
            postTitle = entry.title[0];
          }
          else if (social.platform === 'reddit') {
            // Fetch Reddit JSON
            const res = await axios.default.get(`https://www.reddit.com/r/${social.username}/new.json?limit=1`);
            const post = res.data?.data?.children?.[0]?.data;
            if (!post) continue;

            latestPostId = post.id;
            postUrl = `https://reddit.com${post.permalink}`;
            postTitle = post.title;
          }

          // If there's a new post we haven't seen before
          if (latestPostId && social.lastPostId !== latestPostId) {
            const msgContent = (social.customMessage || "Yeni bir gönderi paylaşıldı!\n{url}")
              .replace('{author}', social.username)
              .replace('{url}', postUrl)
              .replace('{title}', postTitle);

            await channel.send(msgContent);

            await db.update(socialNotifications)
              .set({ lastPostId: latestPostId })
              .where(eq(socialNotifications.id, social.id));
          }
        } catch (err) {
          console.error(`Error checking social ${social.platform} for ${social.username}:`, err.message);
        }
      }
    } catch (error) {
      console.error('Check socials error:', error);
    }
  }

  async checkPolls() {
    try {
      const { db } = require('../database/db');
      const { polls } = require('../../shared/schema');
      const { eq, and, lte } = require('drizzle-orm');
      const djs = require('discord.js');

      const expiredPolls = await db.select().from(polls)
        .where(and(eq(polls.ended, false), lte(polls.endsAt, new Date())));

      for (const poll of expiredPolls) {
        const guild = await this.client.guilds.fetch(poll.guildId).catch(() => null);
        if (!guild) continue;

        const channel = await guild.channels.fetch(poll.channelId).catch(() => null);
        if (!channel) continue;

        const message = await channel.messages.fetch(poll.messageId).catch(() => null);
        if (!message) continue;

        const reactions = message.reactions.cache;

        let resultsText = '**🗳️ Anket Sonuçları:**\n\n';
        const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

        let maxVotes = -1;
        let winnerTexts = [];

        poll.options.forEach((opt, idx) => {
          const rInfo = reactions.get(numberEmojis[idx]);
          const count = rInfo ? Math.max(0, rInfo.count - 1) : 0; // -1 for bot's own reaction
          resultsText += `${numberEmojis[idx]} ${opt} — **${count} Oy**\n`;

          if (count > maxVotes) {
            maxVotes = count;
            winnerTexts = [opt];
          } else if (count === maxVotes) {
            winnerTexts.push(opt);
          }
        });

        if (maxVotes === 0) {
          resultsText += '\n*Hiç kimse oy kullanmadı.*';
        } else {
          resultsText += `\n🏅 **Kazanan:** ${winnerTexts.join(', ')} (${maxVotes} Oy)`;
        }

        const resultEmbed = new djs.EmbedBuilder()
          .setColor('#00FF00')
          .setTitle(`📊 Anket Bitti: ${poll.question}`)
          .setDescription(resultsText)
          .setTimestamp();

        await channel.send({ embeds: [resultEmbed] });

        // Mark done
        await db.update(polls).set({ ended: true }).where(eq(polls.id, poll.id));
      }
    } catch (e) {
      console.error('Check polls error:', e);
    }
  }

  async checkScheduledMessages() {
    try {
      const messages = await this.storage.getPendingScheduledMessages();

      for (const msg of messages) {
        // One-shot: intervalMinutes === 0, gönderilince sil
        if (msg.intervalMinutes === 0) {
          await this.sendScheduledMessage(msg);
          await this.storage.deleteScheduledMessage(msg.id).catch(() => { });
          continue;
        }
        if (!msg.intervalMinutes || msg.intervalMinutes < 1) continue;

        await this.sendScheduledMessage(msg);

        const nextRun = new Date(Date.now() + msg.intervalMinutes * 60 * 1000);
        await this.storage.updateScheduledMessageNextRun(msg.id, nextRun);
      }
    } catch (error) {
      console.error('Scheduled message check error:', error);
    }
  }

  async sendScheduledMessage(msg) {
    try {
      const channel = await this.client.channels.fetch(msg.channelId).catch(() => null);
      if (!channel) return;

      // Embed JSON formatı kontrolü
      let parsed = null;
      try { parsed = JSON.parse(msg.message); } catch { }

      if (parsed?.__embed) {
        const embed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle(parsed.title || '')
          .setTimestamp();
        if (parsed.description) embed.setDescription(parsed.description);
        await channel.send({ embeds: [embed] });
      } else {
        await channel.send(msg.message);
      }
    } catch (error) {
      console.error('Send scheduled message error:', error);
    }
  }

  // ── IF-THEN Otomasyon Motor ────────────────────────────────────────────────
  async runAutomation(triggerType, guild, member, extra = {}) {
    try {
      const { db } = require('../database/db');
      const { automationRules } = require('../../shared/schema');
      const { eq, and } = require('drizzle-orm');

      const rules = await db.select().from(automationRules)
        .where(and(eq(automationRules.guildId, guild.id), eq(automationRules.enabled, true)));

      // Priority sırasına göre sırala (yüksek önce)
      rules.sort((a, b) => (b.priority || 0) - (a.priority || 0));

      for (const rule of rules) {
        const trigger = rule.trigger || {};
        if (trigger.type !== triggerType) continue;

        // Koşul: mesaj_iceriyor
        if (triggerType === 'mesaj_iceriyor' && trigger.keyword) {
          if (!extra.content?.toLowerCase().includes(trigger.keyword.toLowerCase())) continue;
        }

        // Koşul kontrolü (ek conditions varsa)
        const conditions = Array.isArray(rule.conditions) ? rule.conditions : [];
        let pass = true;
        for (const cond of conditions) {
          if (cond.type === 'rol_sahibi_mi') {
            if (!member?.roles?.cache?.has(cond.roleId)) { pass = false; break; }
          } else if (cond.type === 'hesap_yasi_ustu') {
            const ageDays = (Date.now() - member?.user?.createdTimestamp) / 86400000;
            if (ageDays < (cond.days || 0)) { pass = false; break; }
          }
        }
        if (!pass) continue;

        // Aksiyonları çalıştır
        const actions = Array.isArray(rule.actions) ? rule.actions : [];
        for (const action of actions) {
          await this._execAction(action, guild, member, extra).catch(e =>
            console.error(`[Automation] Action hata (rule ${rule.id}):`, e.message)
          );
        }
      }
    } catch (err) {
      console.error('[runAutomation] Hata:', err.message);
    }
  }

  async _execAction(action, guild, member, extra) {
    switch (action.type) {
      case 'rol_ver': {
        const role = guild.roles.cache.get(action.roleId);
        if (role && member?.roles) await member.roles.add(role);
        break;
      }
      case 'rol_al': {
        const role = guild.roles.cache.get(action.roleId);
        if (role && member?.roles) await member.roles.remove(role);
        break;
      }
      case 'mesaj_gonder': {
        const ch = guild.channels.cache.get(action.channelId);
        if (ch) await ch.send(this._renderVars(action.text || '', member, guild));
        break;
      }
      case 'dm_gonder': {
        if (member?.user) {
          await member.user.send(this._renderVars(action.text || '', member, guild)).catch(() => { });
        }
        break;
      }
    }
  }

  _renderVars(text, member, guild) {
    return text
      .replace(/\{user\}/g, member?.toString() || '')
      .replace(/\{username\}/g, member?.user?.username || '')
      .replace(/\{server\}/g, guild?.name || '')
      .replace(/\{member_count\}/g, guild?.memberCount || '');
  }


  // ── Faz 6: Twitch Bildirimleri ────────────────────────────────────────────
  async _getTwitchToken() {
    if (this.twitchToken && Date.now() < this.twitchTokenExp) return this.twitchToken;
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSec = process.env.TWITCH_CLIENT_SECRET;
    if (!clientId || !clientSec) return null;
    try {
      const axios = require('axios');
      const res = await axios.post(`https://id.twitch.tv/oauth2/token`, null, {
        params: { client_id: clientId, client_secret: clientSec, grant_type: 'client_credentials' }
      });
      this.twitchToken = res.data.access_token;
      this.twitchTokenExp = Date.now() + (res.data.expires_in - 60) * 1000;
      return this.twitchToken;
    } catch { return null; }
  }

  async checkTwitch() {
    try {
      const token = await this._getTwitchToken();
      if (!token) return;

      const { db } = require('../database/db');
      if (!db) return;
      const { twitchNotifications } = require('../../shared/schema');
      const { eq } = require('drizzle-orm');
      const axios = require('axios');

      const rows = await db.select().from(twitchNotifications).where(eq(twitchNotifications.enabled, true));
      if (!rows.length) return;

      const users = rows.map(r => r.twitchUser).join('&login=');
      const streamRes = await axios.get(`https://api.twitch.tv/helix/streams?login=${users}`, {
        headers: { 'Client-ID': process.env.TWITCH_CLIENT_ID, Authorization: `Bearer ${token}` }
      });
      const liveMap = new Map(streamRes.data.data.map(s => [s.user_login.toLowerCase(), s]));

      const { EmbedBuilder } = require('discord.js');
      for (const row of rows) {
        const stream = liveMap.get(row.twitchUser.toLowerCase());
        const wasLive = row.isLive;

        if (stream && !wasLive) {
          // Yeni yayın başladı
          const guild = await this.client.guilds.fetch(row.guildId).catch(() => null);
          const channel = guild?.channels.cache.get(row.channelId);
          if (channel) {
            const msg = (row.customMessage || '🔴 **{user}** yayına başladı! Oyun: **{game}** — {url}')
              .replace(/{user}/g, stream.user_name)
              .replace(/{game}/g, stream.game_name || '?')
              .replace(/{url}/g, `https://twitch.tv/${stream.user_login}`)
              .replace(/{viewers}/g, stream.viewer_count);

            await channel.send({
              content: msg, embeds: [new EmbedBuilder()
                .setColor('#9147FF')
                .setTitle(`🔴 ${stream.user_name} — ${stream.title || 'Yayın Başladı'}`)
                .setURL(`https://twitch.tv/${stream.user_login}`)
                .addFields(
                  { name: '🎮 Oyun', value: stream.game_name || '?', inline: true },
                  { name: '👀 İzleyici', value: String(stream.viewer_count), inline: true }
                )
                .setImage(stream.thumbnail_url?.replace('{width}', '640').replace('{height}', '360'))
                .setTimestamp()]
            }).catch(() => { });
          }
          await db.update(twitchNotifications).set({ isLive: true, lastGameId: stream.game_id }).where(eq(twitchNotifications.id, row.id)).catch(() => { });
        } else if (!stream && wasLive) {
          // Yayın bitti
          await db.update(twitchNotifications).set({ isLive: false }).where(eq(twitchNotifications.id, row.id)).catch(() => { });
        }
      }
    } catch (err) {
      console.error('[checkTwitch]', err.message);
    }
  }

  // ── Faz 6: RSS Feed Kontrol ───────────────────────────────────────────────
  async checkRSSFeeds() {
    try {
      const { db } = require('../database/db');
      if (!db) return;
      const { rssFeeds } = require('../../shared/schema');
      const { eq } = require('drizzle-orm');
      const { fetchLatestEntry } = require('../utils/rssUtils');
      const { EmbedBuilder } = require('discord.js');

      const feeds = await db.select().from(rssFeeds).where(eq(rssFeeds.enabled, true));
      const now = Date.now();

      for (const feed of feeds) {
        const lastCheck = this.rssLastChecked.get(feed.id) || 0;
        if (now - lastCheck < (feed.intervalMinutes || 15) * 60 * 1000) continue;
        this.rssLastChecked.set(feed.id, now);

        try {
          const entry = await fetchLatestEntry(feed.url);
          if (!entry || entry.id === feed.lastEntryId) continue;

          const guild = await this.client.guilds.fetch(feed.guildId).catch(() => null);
          const channel = guild?.channels.cache.get(feed.channelId);
          if (!channel) continue;

          await channel.send({
            embeds: [new EmbedBuilder()
              .setColor('#FF6600')
              .setTitle(`📰 ${entry.title}`)
              .setURL(entry.link)
              .setDescription(entry.summary?.replace(/<[^>]+>/g, '').slice(0, 300) || '')
              .setTimestamp()]
          }).catch(() => { });

          await db.update(rssFeeds).set({ lastEntryId: entry.id }).where(eq(rssFeeds.id, feed.id)).catch(() => { });
        } catch (err) {
          console.error(`[checkRSSFeeds] feed ${feed.id}:`, err.message);
        }
      }
    } catch (err) {
      console.error('[checkRSSFeeds]', err.message);
    }
  }

  // ── Faz 6: Steam İndirim Kontrolü ─────────────────────────────────────────
  async checkSteamDeals() {
    try {
      const { db } = require('../database/db');
      if (!db) return;
      const { socialNotifications } = require('../../shared/schema');
      const { eq } = require('drizzle-orm');
      const axios = require('axios');

      // steamWatch tipindeki kayıtları al (platform = 'steam_price')
      const watches = await db.select().from(socialNotifications)
        .where(eq(socialNotifications.platform, 'steam_price'));

      for (const watch of watches) {
        try {
          const res = await axios.get(
            `https://store.steampowered.com/api/appdetails?appids=${watch.username}&cc=tr&l=tr`,
            { timeout: 8000 }
          );
          const data = res.data?.[watch.username]?.data;
          if (!data || !data.price_overview) continue;

          const { discount_percent, final_formatted, initial_formatted } = data.price_overview;
          if (discount_percent <= 0) continue; // İndirim yok

          const lastPostId = watch.lastPostId;
          const key = `${discount_percent}%_${data.price_overview.final}`;
          if (lastPostId === key) continue; // Zaten bildirim verildi

          const guild = await this.client.guilds.fetch(watch.guildId).catch(() => null);
          const channel = guild?.channels.cache.get(watch.channelId);
          if (!channel) continue;

          const { EmbedBuilder } = require('discord.js');
          await channel.send({
            embeds: [new EmbedBuilder()
              .setColor('#1B2838')
              .setTitle(`🎮 Steam İndirimi: ${data.name}`)
              .setURL(`https://store.steampowered.com/app/${watch.username}`)
              .setThumbnail(data.header_image)
              .addFields(
                { name: '💸 Eski Fiyat', value: initial_formatted, inline: true },
                { name: '✅ Yeni Fiyat', value: final_formatted, inline: true },
                { name: '🔖 İndirim', value: `%${discount_percent}`, inline: true }
              )
              .setTimestamp()]
          }).catch(() => { });

          await db.update(socialNotifications).set({ lastPostId: key }).where(eq(socialNotifications.id, watch.id)).catch(() => { });
        } catch (err) {
          console.error(`[checkSteamDeals] watch ${watch.id}:`, err.message);
        }
      }
    } catch (err) {
      console.error('[checkSteamDeals]', err.message);
    }
  }

  stop() {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
  }

  async checkReminders() {
    try {
      const reminders = await this.storage.getPendingReminders();
      const now = new Date();

      for (const reminder of reminders) {
        const remindAt = new Date(reminder.remindAt);
        if (remindAt <= now) {
          await this.sendReminder(reminder);
          await this.storage.completeReminder(reminder.id);
        }
      }
    } catch (error) {
      console.error('Reminder check error:', error);
    }
  }

  async sendReminder(reminder) {
    try {
      const channel = await this.client.channels.fetch(reminder.channelId).catch(() => null);
      if (!channel) return;

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('⏰ Hatırlatıcı')
        .setDescription(reminder.message)
        .setTimestamp();

      await channel.send({ content: `<@${reminder.userId}>`, embeds: [embed] });
    } catch (error) {
      console.error('Send reminder error:', error);
    }
  }

  async checkGiveaways() {
    try {
      const giveaways = await this.storage.getActiveGiveaways();
      const now = new Date();

      for (const giveaway of giveaways) {
        const endsAt = new Date(giveaway.endsAt);
        if (endsAt <= now) {
          await this.endGiveaway(giveaway);
        }
      }
    } catch (error) {
      console.error('Giveaway check error:', error);
    }
  }

  async endGiveaway(giveaway) {
    try {
      const channel = await this.client.channels.fetch(giveaway.channelId).catch(() => null);
      if (!channel) {
        await this.storage.updateGiveaway(giveaway.id, { ended: true });
        return;
      }

      const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
      if (!message) {
        await this.storage.updateGiveaway(giveaway.id, { ended: true });
        return;
      }

      const reaction = message.reactions.cache.get('🎉');
      if (!reaction) {
        await this.storage.updateGiveaway(giveaway.id, { ended: true });
        await channel.send('Çekilişe kimse katılmadı!');
        return;
      }

      const users = await reaction.users.fetch();
      const participants = users.filter(u => !u.bot);

      if (participants.size === 0) {
        await this.storage.updateGiveaway(giveaway.id, { ended: true });
        await channel.send('Çekilişe kimse katılmadı!');
        return;
      }

      const winnersArray = participants.random(Math.min(giveaway.winners, participants.size));
      const winnerMentions = Array.isArray(winnersArray)
        ? winnersArray.map(u => u.toString()).join(', ')
        : winnersArray.toString();

      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('🎉 Çekiliş Sona Erdi!')
        .setDescription(`**Ödül:** ${giveaway.prize}`)
        .addFields({ name: 'Kazananlar', value: winnerMentions })
        .setTimestamp();

      await channel.send({ content: `Tebrikler ${winnerMentions}!`, embeds: [embed] });
      await this.storage.updateGiveaway(giveaway.id, { ended: true });

      const endedEmbed = EmbedBuilder.from(message.embeds[0])
        .setColor('#808080')
        .setTitle('🎉 Çekiliş Sona Erdi');

      await message.edit({ embeds: [endedEmbed] });
    } catch (error) {
      console.error('End giveaway error:', error);
      await this.storage.updateGiveaway(giveaway.id, { ended: true });
    }
  }

  async checkBirthdays() {
    try {
      const today = new Date();
      const todayKey = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;

      if (this.lastBirthdayCheck === todayKey) {
        return;
      }

      this.lastBirthdayCheck = todayKey;
      this.announcedBirthdays.clear();

      const birthdays = await this.storage.getAllTodaysBirthdays();
      const configs = await this.storage.getAllBirthdayConfigs();
      const configMap = new Map(configs.map(c => [c.guildId, c]));

      const guildBirthdays = {};
      for (const birthday of birthdays) {
        if (!guildBirthdays[birthday.guildId]) {
          guildBirthdays[birthday.guildId] = [];
        }
        guildBirthdays[birthday.guildId].push(birthday);
      }

      for (const [guildId, userBirthdays] of Object.entries(guildBirthdays)) {
        const config = configMap.get(guildId);
        if (!config?.channelId) continue;

        await this.announceBirthdays(guildId, userBirthdays, config);
      }
    } catch (error) {
      console.error('Birthday check error:', error);
    }
  }

  async announceBirthdays(guildId, birthdays, config) {
    try {
      const guild = await this.client.guilds.fetch(guildId).catch(() => null);
      if (!guild) return;

      const channel = await guild.channels.fetch(config.channelId).catch(() => null);
      if (!channel) return;

      for (const birthday of birthdays) {
        const key = `${guildId}-${birthday.userId}`;
        if (this.announcedBirthdays.has(key)) continue;
        this.announcedBirthdays.add(key);

        const member = await guild.members.fetch(birthday.userId).catch(() => null);
        if (!member) continue;

        if (config.roleId) {
          const role = guild.roles.cache.get(config.roleId);
          if (role && !member.roles.cache.has(config.roleId)) {
            await member.roles.add(role).catch(() => { });
            setTimeout(async () => {
              await member.roles.remove(role).catch(() => { });
            }, 24 * 60 * 60 * 1000);
          }
        }

        const customMessage = config.message || '🎂 Bugün {user} kullanıcısının doğum günü! Mutlu yıllar!';
        const message = customMessage.replace('{user}', member.toString());

        const embed = new EmbedBuilder()
          .setColor('#e91e63')
          .setTitle('🎂 Doğum Günü Kutlaması!')
          .setDescription(message)
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .setTimestamp();

        await channel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Announce birthdays error:', error);
    }
  }
}

module.exports = { Scheduler };
