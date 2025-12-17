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
    this.announcedBirthdays = new Set();
    this.lastBirthdayCheck = null;
    setTimeout(() => this.checkBirthdays(), 10000);
    console.log('Scheduler started');
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
            await member.roles.add(role).catch(() => {});
            setTimeout(async () => {
              await member.roles.remove(role).catch(() => {});
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
