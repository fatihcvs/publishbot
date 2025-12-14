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
}

module.exports = { Scheduler };
