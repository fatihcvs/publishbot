const { EmbedBuilder } = require('discord.js');

class SocialNotificationSystem {
  constructor(client, storage) {
    this.client = client;
    this.storage = storage;
    this.liveStatus = new Map();
    this.lastVideoIds = new Map();
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
          } else if (notification.platform === 'youtube') {
            await this.checkYouTube(notification, guild);
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
      const response = await fetch(`https://kick.com/api/v2/channels/${notification.username}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://kick.com/',
          'Origin': 'https://kick.com'
        }
      });
      
      if (!response.ok) {
        if (response.status === 403 || response.status === 503) {
          console.log(`Kick API blocked for ${notification.username} - Cloudflare protection`);
          await this.checkKickAlternative(notification, guild, key);
        }
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
      console.error(`Kick check error for ${notification.username}:`, error.message);
      await this.checkKickAlternative(notification, guild, key);
    }
  }

  async checkKickAlternative(notification, guild, key) {
    try {
      const response = await fetch(`https://kick.com/${notification.username}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      
      if (!response.ok) {
        return;
      }
      
      const html = await response.text();
      
      const isLive = html.includes('"is_live":true') || 
                     html.includes('"livestream":{') && !html.includes('"livestream":null');
      const wasLive = this.liveStatus.get(key) || false;
      
      if (isLive && !wasLive) {
        const titleMatch = html.match(/"session_title":"([^"]+)"/);
        const categoryMatch = html.match(/"category":\{"id":\d+,"name":"([^"]+)"/);
        
        await this.sendNotification(notification, guild, 'kick', {
          username: notification.username,
          title: titleMatch ? titleMatch[1] : 'Yayın',
          category: categoryMatch ? categoryMatch[1] : 'Bilinmiyor',
          viewers: 0,
          thumbnail: null
        });
      }
      
      this.liveStatus.set(key, isLive);
    } catch (error) {
      console.error(`Kick alternative check error for ${notification.username}:`, error.message);
    }
  }

  async checkYouTube(notification, guild) {
    const key = `youtube:${notification.username}:${guild.id}`;
    
    try {
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${notification.username}`;
      const response = await fetch(rssUrl);
      
      if (!response.ok) {
        return;
      }
      
      const text = await response.text();
      
      const videoIdMatch = text.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
      const titleMatch = text.match(/<media:title>([^<]+)<\/media:title>/);
      const authorMatch = text.match(/<author>\s*<name>([^<]+)<\/name>/);
      const publishedMatch = text.match(/<published>([^<]+)<\/published>/);
      
      if (!videoIdMatch) return;
      
      const videoId = videoIdMatch[1];
      const lastVideoId = this.lastVideoIds.get(key) || notification.lastPostId;
      
      if (!lastVideoId) {
        this.lastVideoIds.set(key, videoId);
        await this.storage.updateSocialNotification(notification.id, { lastPostId: videoId });
        return;
      }
      
      if (videoId !== lastVideoId) {
        const published = publishedMatch ? new Date(publishedMatch[1]) : new Date();
        const now = new Date();
        const hoursDiff = (now - published) / (1000 * 60 * 60);
        
        if (hoursDiff < 168) {
          await this.sendNotification(notification, guild, 'youtube', {
            username: authorMatch ? authorMatch[1] : notification.username,
            channelId: notification.username,
            videoId: videoId,
            title: titleMatch ? titleMatch[1] : 'Yeni Video',
            url: `https://www.youtube.com/watch?v=${videoId}`
          });
        }
        
        this.lastVideoIds.set(key, videoId);
        await this.storage.updateSocialNotification(notification.id, { lastPostId: videoId });
      }
    } catch (error) {
      console.error(`YouTube check error for ${notification.username}:`, error);
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
        },
        youtube: {
          color: '#FF0000',
          emoji: '🔴',
          name: 'YouTube',
          url: streamData.url || `https://youtube.com/channel/${streamData.channelId}`
        }
      };

      const config = platformConfig[platform];

      const embed = new EmbedBuilder()
        .setColor(config.color)
        .setTimestamp();

      if (platform === 'youtube') {
        embed.setTitle(`${config.emoji} ${streamData.username} Yeni Video Yükledi!`);
        embed.setDescription(`**${streamData.title}**`);
        embed.setURL(streamData.url);
        embed.setImage(`https://img.youtube.com/vi/${streamData.videoId}/maxresdefault.jpg`);
      } else if (platform === 'kick') {
        embed.setTitle(`${config.emoji} ${streamData.username} Yayında!`);
        embed.setURL(config.url);
        if (streamData.title) {
          embed.setDescription(streamData.title);
          embed.addFields(
            { name: 'Kategori', value: streamData.category, inline: true },
            { name: 'İzleyici', value: `${streamData.viewers}`, inline: true }
          );
        }
        if (streamData.thumbnail) {
          embed.setThumbnail(streamData.thumbnail);
        }
      } else if (platform === 'twitch') {
        embed.setTitle(`${config.emoji} ${streamData.username} Yayında!`);
        embed.setURL(config.url);
        embed.setDescription(`${streamData.username} Twitch'te yayın yapıyor!`);
        if (streamData.uptime) {
          embed.addFields({ name: 'Yayın Süresi', value: streamData.uptime, inline: true });
        }
      }

      embed.addFields({ name: 'Platform', value: config.name, inline: true });

      const defaultMessages = {
        twitch: `🔴 **${streamData.username}** yayında!`,
        kick: `🔴 **${streamData.username}** yayında!`,
        youtube: `📺 **${streamData.username}** yeni video yükledi!`
      };
      let content = notification.customMessage || defaultMessages[platform] || `🔔 **${streamData.username}** yeni içerik!`;
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
