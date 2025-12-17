const { EmbedBuilder } = require('discord.js');

class SocialNotificationSystem {
  constructor(client, storage) {
    this.client = client;
    this.storage = storage;
    this.liveStatus = new Map();
    this.checkInterval = 3 * 60 * 1000;
    
    this.startChecker();
  }

  startChecker() {
    setInterval(() => this.checkAllStreams(), this.checkInterval);
    setTimeout(() => this.checkAllStreams(), 10000);
  }

  async checkAllStreams() {
    try {
      for (const guild of this.client.guilds.cache.values()) {
        const notifications = await this.storage.getSocialNotifications(guild.id);
        
        for (const notification of notifications) {
          if (!notification.enabled) continue;
          
          if (notification.platform === 'twitch') {
            await this.checkTwitch(notification, guild);
          } else if (notification.platform === 'kick') {
            await this.checkKick(notification, guild);
          }
        }
      }
    } catch (error) {
      console.error('Social notification check error:', error);
    }
  }

  async checkTwitch(notification, guild) {
    const key = `twitch:${notification.username}:${guild.id}`;
    
    try {
      const response = await fetch(`https://decapi.me/twitch/uptime/${notification.username}`);
      const text = await response.text();
      
      const isLive = !text.includes('offline') && !text.includes('not found');
      const wasLive = this.liveStatus.get(key) || false;
      
      if (isLive && !wasLive) {
        await this.sendNotification(notification, guild, 'twitch', {
          username: notification.username,
          uptime: text
        });
      }
      
      this.liveStatus.set(key, isLive);
    } catch (error) {
      console.error(`Twitch check error for ${notification.username}:`, error);
    }
  }

  async checkKick(notification, guild) {
    const key = `kick:${notification.username}:${guild.id}`;
    
    try {
      const response = await fetch(`https://kick.com/api/v2/channels/${notification.username}`);
      
      if (!response.ok) {
        return;
      }
      
      const data = await response.json();
      const isLive = data.livestream !== null;
      const wasLive = this.liveStatus.get(key) || false;
      
      if (isLive && !wasLive) {
        await this.sendNotification(notification, guild, 'kick', {
          username: notification.username,
          title: data.livestream?.session_title || 'Yayın',
          category: data.livestream?.categories?.[0]?.name || 'Bilinmiyor',
          viewers: data.livestream?.viewer_count || 0,
          thumbnail: data.livestream?.thumbnail?.url || data.user?.profile_pic
        });
      }
      
      this.liveStatus.set(key, isLive);
    } catch (error) {
      console.error(`Kick check error for ${notification.username}:`, error);
    }
  }

  async sendNotification(notification, guild, platform, streamData) {
    try {
      const channel = guild.channels.cache.get(notification.channelId);
      if (!channel) return;

      const platformConfig = {
        twitch: {
          color: '#9146FF',
          emoji: '🟣',
          name: 'Twitch',
          url: `https://twitch.tv/${streamData.username}`
        },
        kick: {
          color: '#53FC18',
          emoji: '🟢',
          name: 'Kick',
          url: `https://kick.com/${streamData.username}`
        }
      };

      const config = platformConfig[platform];

      const embed = new EmbedBuilder()
        .setColor(config.color)
        .setTitle(`${config.emoji} ${streamData.username} Yayında!`)
        .setURL(config.url)
        .setTimestamp();

      if (platform === 'kick' && streamData.title) {
        embed.setDescription(streamData.title);
        embed.addFields(
          { name: 'Kategori', value: streamData.category, inline: true },
          { name: 'İzleyici', value: `${streamData.viewers}`, inline: true }
        );
        if (streamData.thumbnail) {
          embed.setThumbnail(streamData.thumbnail);
        }
      } else if (platform === 'twitch') {
        embed.setDescription(`${streamData.username} Twitch'te yayın yapıyor!`);
        if (streamData.uptime) {
          embed.addFields({ name: 'Yayın Süresi', value: streamData.uptime, inline: true });
        }
      }

      embed.addFields({ name: 'Platform', value: config.name, inline: true });

      let content = notification.customMessage || `🔴 **${streamData.username}** yayında!`;
      content = content
        .replace(/{user}/g, streamData.username)
        .replace(/{platform}/g, config.name)
        .replace(/{url}/g, config.url);

      await channel.send({ content, embeds: [embed] });
    } catch (error) {
      console.error('Send notification error:', error);
    }
  }
}

module.exports = { SocialNotificationSystem };
