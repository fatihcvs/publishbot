const { EmbedBuilder } = require('discord.js');

const defaultConfig = {
  enabled: false,
  spamFilter: { enabled: false, maxMessages: 5, interval: 5000, action: 'warn' },
  capsFilter: { enabled: false, threshold: 70, minLength: 10, action: 'delete' },
  badWords: { enabled: false, words: [], action: 'delete' },
  linkFilter: { enabled: false, whitelist: [], action: 'delete' },
  mentionSpam: { enabled: false, maxMentions: 5, action: 'warn' },
  emojiSpam: { enabled: false, maxEmojis: 10, action: 'delete' },
  inviteFilter: { enabled: false, action: 'delete' },
  regexFilter: { enabled: false, patterns: [], action: 'delete' }
};

const messageCache = new Map();
// key: guildId-userId → last msg content + timestamp (for duplicate detection)
const lastMsgCache = new Map();

async function checkAutomod(message, client, storage) {
  if (!message.guild || message.author.bot) return false;
  if (message.member?.permissions.has('ManageMessages')) return false;

  const guildData = await storage.getGuild(message.guild.id);
  const config = guildData?.automodConfig || defaultConfig;

  if (!config.enabled) return false;

  // Exemptions
  const exemptChannels = config.exemptChannels || [];
  const exemptRoles = config.exemptRoles || [];
  if (exemptChannels.includes(message.channel.id)) return false;
  if (message.member?.roles.cache.some(role => exemptRoles.includes(role.id))) return false;

  const violations = [];
  const content = message.content;

  // ── Spam filtresi ──────────────────────────────────────────────────────
  if (config.spamFilter?.enabled) {
    const key = `${message.guild.id}-${message.author.id}`;
    const now = Date.now();
    const userMessages = messageCache.get(key) || [];
    userMessages.push(now);
    const recent = userMessages.filter(t => now - t < (config.spamFilter.interval || 5000));
    messageCache.set(key, recent);
    if (recent.length > (config.spamFilter.maxMessages || 5))
      violations.push({ type: 'spam', action: config.spamFilter.action });
  }

  // ── Duplikat mesaj tespiti ─────────────────────────────────────────────
  if (config.duplicateFilter?.enabled) {
    const dk = `${message.guild.id}-${message.author.id}`;
    const now = Date.now();
    const last = lastMsgCache.get(dk);
    if (last && last.content === content && (now - last.ts) < 5000) {
      violations.push({ type: 'duplicate', action: config.duplicateFilter.action || 'delete' });
    }
    lastMsgCache.set(dk, { content, ts: now });
    // TTL cleanup
    if (lastMsgCache.size > 5000) {
      const cutoff = now - 30000;
      for (const [k, v] of lastMsgCache) { if (v.ts < cutoff) lastMsgCache.delete(k); }
    }
  }

  // ── Büyük harf filtresi ────────────────────────────────────────────────
  if (config.capsFilter?.enabled) {
    if (content.length >= (config.capsFilter.minLength || 10)) {
      const caps = content.replace(/[^A-Z]/g, '').length;
      const letters = content.replace(/[^a-zA-Z]/g, '').length;
      if (letters > 0 && (caps / letters) * 100 >= (config.capsFilter.threshold || 70))
        violations.push({ type: 'caps', action: config.capsFilter.action });
    }
  }

  // ── Kötü kelime filtresi ───────────────────────────────────────────────
  if (config.badWords?.enabled && config.badWords.words?.length > 0) {
    const lower = content.toLowerCase();
    for (const word of config.badWords.words) {
      if (lower.includes(word.toLowerCase())) {
        violations.push({ type: 'badword', action: config.badWords.action, word });
        break;
      }
    }
  }

  // ── Link filtresi (whitelist destekli) ────────────────────────────────
  if (config.linkFilter?.enabled) {
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const links = content.match(urlRegex);
    if (links) {
      const whitelist = (config.linkFilter.whitelist || []).map(d => d.toLowerCase());
      const hasBlocked = links.some(link => {
        try {
          const host = new URL(link).hostname.toLowerCase();
          return !whitelist.some(w => host === w || host.endsWith('.' + w));
        } catch { return true; }
      });
      if (hasBlocked) violations.push({ type: 'link', action: config.linkFilter.action });
    }
  }

  // ── Discord davet filtresi ─────────────────────────────────────────────
  if (config.inviteFilter?.enabled) {
    const inviteRegex = /(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/[^\s]+/gi;
    if (inviteRegex.test(content))
      violations.push({ type: 'invite', action: config.inviteFilter.action });
  }

  // ── Etiket spam ────────────────────────────────────────────────────────
  if (config.mentionSpam?.enabled) {
    const mentions = message.mentions.users.size + message.mentions.roles.size;
    if (mentions > (config.mentionSpam.maxMentions || 5))
      violations.push({ type: 'mentions', action: config.mentionSpam.action });
  }

  // ── Emoji spam ─────────────────────────────────────────────────────────
  if (config.emojiSpam?.enabled) {
    const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]|<:[^:]+:\d+>|<a:[^:]+:\d+>)/g;
    const emojis = content.match(emojiRegex) || [];
    if (emojis.length > (config.emojiSpam.maxEmojis || 10))
      violations.push({ type: 'emoji', action: config.emojiSpam.action });
  }

  // ── Regex filtresi ─────────────────────────────────────────────────────
  if (config.regexFilter?.enabled && config.regexFilter.patterns?.length > 0) {
    for (const pattern of config.regexFilter.patterns) {
      try {
        if (new RegExp(pattern, 'i').test(content)) {
          violations.push({ type: 'regex', action: config.regexFilter.action, pattern });
          break;
        }
      } catch { console.error('[AutoMod] Geçersiz regex:', pattern); }
    }
  }

  if (violations.length > 0) {
    const severityOrder = ['ban', 'kick', 'mute', 'warn', 'delete'];
    violations.sort((a, b) => severityOrder.indexOf(a.action) - severityOrder.indexOf(b.action));
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
    emoji: 'Emoji Spam',
    regex: 'Özel Regex Filtresi'
  };

  try {
    if (violation.action === 'delete' || violation.action === 'warn' || violation.action === 'mute') {
      await message.delete().catch(() => { });
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

    const targetLogChannel = guildData?.modLogChannel || guildData?.logChannel;
    if (targetLogChannel) {
      const logChannel = message.guild.channels.cache.get(targetLogChannel);
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
