const { EmbedBuilder } = require('discord.js');

const defaultConfig = {
  enabled: false,
  spamFilter: { enabled: false, maxMessages: 5, interval: 5000, action: 'warn' },
  capsFilter: { enabled: false, threshold: 70, minLength: 10, action: 'delete' },
  badWords: { enabled: false, words: [], action: 'delete' },
  linkFilter: { enabled: false, whitelist: [], action: 'delete' },
  mentionSpam: { enabled: false, maxMentions: 5, action: 'warn' },
  emojiSpam: { enabled: false, maxEmojis: 10, action: 'delete' },
  inviteFilter: { enabled: false, action: 'delete' }
};

const messageCache = new Map();

async function checkAutomod(message, client, storage) {
  if (!message.guild || message.author.bot) return false;
  if (message.member?.permissions.has('ManageMessages')) return false;
  
  const guildData = await storage.getGuild(message.guild.id);
  const config = guildData?.automodConfig || defaultConfig;
  
  if (!config.enabled) return false;

  const violations = [];

  if (config.spamFilter?.enabled) {
    const key = `${message.guild.id}-${message.author.id}`;
    const now = Date.now();
    const userMessages = messageCache.get(key) || [];
    userMessages.push(now);
    const recent = userMessages.filter(t => now - t < (config.spamFilter.interval || 5000));
    messageCache.set(key, recent);
    
    if (recent.length > (config.spamFilter.maxMessages || 5)) {
      violations.push({ type: 'spam', action: config.spamFilter.action });
    }
  }

  if (config.capsFilter?.enabled) {
    const text = message.content;
    if (text.length >= (config.capsFilter.minLength || 10)) {
      const caps = text.replace(/[^A-Z]/g, '').length;
      const letters = text.replace(/[^a-zA-Z]/g, '').length;
      if (letters > 0 && (caps / letters) * 100 >= (config.capsFilter.threshold || 70)) {
        violations.push({ type: 'caps', action: config.capsFilter.action });
      }
    }
  }

  if (config.badWords?.enabled && config.badWords.words?.length > 0) {
    const content = message.content.toLowerCase();
    for (const word of config.badWords.words) {
      if (content.includes(word.toLowerCase())) {
        violations.push({ type: 'badword', action: config.badWords.action, word });
        break;
      }
    }
  }

  if (config.linkFilter?.enabled) {
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const links = message.content.match(urlRegex);
    if (links) {
      const whitelist = config.linkFilter.whitelist || [];
      const hasBlockedLink = links.some(link => {
        return !whitelist.some(allowed => link.includes(allowed));
      });
      if (hasBlockedLink) {
        violations.push({ type: 'link', action: config.linkFilter.action });
      }
    }
  }

  if (config.inviteFilter?.enabled) {
    const inviteRegex = /(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/[^\s]+/gi;
    if (inviteRegex.test(message.content)) {
      violations.push({ type: 'invite', action: config.inviteFilter.action });
    }
  }

  if (config.mentionSpam?.enabled) {
    const mentions = message.mentions.users.size + message.mentions.roles.size;
    if (mentions > (config.mentionSpam.maxMentions || 5)) {
      violations.push({ type: 'mentions', action: config.mentionSpam.action });
    }
  }

  if (config.emojiSpam?.enabled) {
    const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]|<:[^:]+:\d+>|<a:[^:]+:\d+>)/g;
    const emojis = message.content.match(emojiRegex) || [];
    if (emojis.length > (config.emojiSpam.maxEmojis || 10)) {
      violations.push({ type: 'emoji', action: config.emojiSpam.action });
    }
  }

  if (violations.length > 0) {
    await handleViolation(message, violations[0], client, storage, guildData);
    return true;
  }

  return false;
}

async function handleViolation(message, violation, client, storage, guildData) {
  const typeNames = {
    spam: 'Spam',
    caps: 'Aşırı Büyük Harf',
    badword: 'Yasaklı Kelime',
    link: 'Yasak Link',
    invite: 'Discord Daveti',
    mentions: 'Etiket Spam',
    emoji: 'Emoji Spam'
  };

  try {
    if (violation.action === 'delete' || violation.action === 'warn' || violation.action === 'mute') {
      await message.delete().catch(() => {});
    }

    if (violation.action === 'warn') {
      await storage.addWarning(message.guild.id, message.author.id, client.user.id, `AutoMod: ${typeNames[violation.type]}`);
      await storage.addModCase(message.guild.id, 'warn', message.author.id, client.user.id, `AutoMod: ${typeNames[violation.type]}`);
    }

    if (violation.action === 'mute') {
      await message.member?.timeout(5 * 60 * 1000, `AutoMod: ${typeNames[violation.type]}`);
      await storage.addModCase(message.guild.id, 'mute', message.author.id, client.user.id, `AutoMod: ${typeNames[violation.type]}`, 5 * 60);
    }

    if (violation.action === 'kick' && message.member?.kickable) {
      await message.member.kick(`AutoMod: ${typeNames[violation.type]}`);
      await storage.addModCase(message.guild.id, 'kick', message.author.id, client.user.id, `AutoMod: ${typeNames[violation.type]}`);
    }

    if (violation.action === 'ban' && message.member?.bannable) {
      await message.member.ban({ reason: `AutoMod: ${typeNames[violation.type]}` });
      await storage.addModCase(message.guild.id, 'ban', message.author.id, client.user.id, `AutoMod: ${typeNames[violation.type]}`);
    }

    if (guildData?.logChannel) {
      const logChannel = message.guild.channels.cache.get(guildData.logChannel);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setColor('#ff9900')
          .setTitle('AutoMod İhlali')
          .addFields(
            { name: 'Kullanıcı', value: message.author.tag, inline: true },
            { name: 'Kanal', value: message.channel.toString(), inline: true },
            { name: 'İhlal Türü', value: typeNames[violation.type], inline: true },
            { name: 'Eylem', value: violation.action, inline: true },
            { name: 'Mesaj', value: message.content.slice(0, 1000) || 'İçerik yok' }
          )
          .setTimestamp();
        
        await logChannel.send({ embeds: [embed] });
      }
    }
  } catch (error) {
    console.error('AutoMod violation handling error:', error);
  }
}

module.exports = { checkAutomod, defaultConfig };
