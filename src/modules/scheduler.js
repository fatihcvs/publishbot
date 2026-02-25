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
    this.intervals.push(setInterval(() => this.checkPolls(), 60000)); // Added Polls
    this.intervals.push(setInterval(() => this.checkSocials(), 300000)); // Every 5 minutes
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
        if (!msg.intervalMinutes || msg.intervalMinutes < 1) {
          console.warn(`Invalid interval for scheduled message ${msg.id}, skipping`);
          continue;
        }

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

      await channel.send(msg.message);
    } catch (error) {
      console.error('Send scheduled message error:', error);
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
