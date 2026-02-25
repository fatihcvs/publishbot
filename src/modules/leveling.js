const { EmbedBuilder } = require('discord.js');

const DEFAULT_MIN_XP = 15;
const DEFAULT_MAX_XP = 25;
const DEFAULT_XP_COOLDOWN = 60000; // 60 saniye

const userCooldowns = new Map();

class LevelingSystem {
  constructor(client, storage) {
    this.client = client;
    this.storage = storage;
    // Ses XP takibi: sesli kanalda ne zaman katıldı
    this.voiceSessions = new Map(); // key = `guildId-userId`, value = joinTimestamp
    this.setupVoiceXp();
  }

  setupVoiceXp() {
    // Her 5 dakikada bir sesli kanaldaki kullanıcılara XP ver
    setInterval(async () => {
      const now = Date.now();
      for (const [key, joinTime] of this.voiceSessions.entries()) {
        const [guildId, userId] = key.split('-');
        const minutesInVoice = Math.floor((now - joinTime) / 60000);
        if (minutesInVoice >= 5) {
          try {
            const guildData = await this.storage.getGuild(guildId);
            if (guildData?.modules?.leveling === false) continue;
            // 5 dakika ses = 10-15 XP
            const voiceXp = Math.floor(Math.random() * 6) + 10;
            const multiplier = guildData?.xpMultiplier || 1;
            await this.storage.updateUserXp(guildId, userId, Math.floor(voiceXp * multiplier));
            // Zamanı sıfırla
            this.voiceSessions.set(key, now);
          } catch (err) {
            // Kullanıcı artık sunucuda yoksa sessizce geç
          }
        }
      }
    }, 5 * 60 * 1000); // 5 dakikada bir kontrol
  }

  handleVoiceStateUpdate(oldState, newState) {
    const userId = newState.member?.id || oldState.member?.id;
    if (!userId) return;
    const guildId = newState.guild?.id || oldState.guild?.id;
    if (!guildId) return;
    const key = `${guildId}-${userId}`;

    const joinedVoice = !oldState.channelId && newState.channelId;
    const leftVoice = oldState.channelId && !newState.channelId;
    const isMuted = newState.selfMute || newState.serverMute || newState.selfDeaf || newState.serverDeaf;

    if (joinedVoice && !isMuted) {
      this.voiceSessions.set(key, Date.now());
    } else if (leftVoice || isMuted) {
      this.voiceSessions.delete(key);
    }
  }

  async handleMessage(message) {
    if (message.author.bot || !message.guild) return;

    const guildData = await this.storage.getGuild(message.guild.id);
    if (guildData?.modules?.leveling === false) return;

    // Guild ayarlarından cooldown süresini al (saniye -> ms)
    const cooldownMs = guildData?.xpCooldown
      ? guildData.xpCooldown * 1000
      : DEFAULT_XP_COOLDOWN;

    const cooldownKey = `${message.guild.id}-${message.author.id}`;
    const lastXpTime = userCooldowns.get(cooldownKey);

    if (lastXpTime && Date.now() - lastXpTime < cooldownMs) {
      return; // Cooldown süresi dolmadı
    }

    // Guild ayarlarından XP miktarını al
    const minXp = guildData?.minXP || DEFAULT_MIN_XP;
    const maxXp = guildData?.maxXP || DEFAULT_MAX_XP;
    const multiplier = guildData?.xpMultiplier || 1;
    const rawXp = Math.floor(Math.random() * (maxXp - minXp + 1)) + minXp;
    const xpToAdd = Math.floor(rawXp * multiplier);

    try {
      const result = await this.storage.updateUserXp(message.guild.id, message.author.id, xpToAdd);
      userCooldowns.set(cooldownKey, Date.now());

      if (result.leveledUp) {
        await this.handleLevelUp(message, result.level, result.oldLevel, guildData);
      }
    } catch (error) {
      console.error('XP update error:', error);
    }
  }

  async handleLevelUp(message, newLevel, oldLevel, guildData) {
    if (!guildData) {
      guildData = await this.storage.getGuild(message.guild.id);
    }

    const levelUpChannel = guildData?.levelUpChannel
      ? message.guild.channels.cache.get(guildData.levelUpChannel)
      : message.channel;

    if (!levelUpChannel) return;

    // Özel level-up mesajı veya varsayılan
    let description;
    if (guildData?.levelUpMessage) {
      description = guildData.levelUpMessage
        .replace(/{user}/g, message.author.toString())
        .replace(/{level}/g, newLevel.toString())
        .replace(/{username}/g, message.author.username);
    } else {
      description = `Tebrikler ${message.author}! **Seviye ${newLevel}** oldun! 🎊`;
    }

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🎉 Seviye Atladın!')
      .setDescription(description)
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp();

    try {
      await levelUpChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Level up message error:', error);
    }

    await this.checkLevelRewards(message.member, newLevel);
  }

  async checkLevelRewards(member, level) {
    try {
      const guildData = await this.storage.getGuild(member.guild.id);
      const levelRoles = guildData?.levelRoles || {};

      const roleId = levelRoles[level.toString()];
      if (!roleId) return; // No reward for this specific level

      const role = member.guild.roles.cache.get(roleId);
      if (role && !member.roles.cache.has(role.id)) {
        // Apply the new role
        await member.roles.add(role);

        // Optionally send a congratulatory message if not muted
        const levelUpChannel = guildData?.levelUpChannel
          ? member.guild.channels.cache.get(guildData.levelUpChannel)
          : null;

        if (levelUpChannel) {
          levelUpChannel.send(`🏆 Tebrikler <@${member.id}>! **Seviye ${level}** olduğun için sana **${role.name}** rolü hediye edildi!`);
        }
      }
    } catch (error) {
      console.error('Level reward error:', error);
    }
  }

  getProgressBar(current, required, length = 10) {
    const progress = Math.round((current / required) * length);
    const filled = '█'.repeat(Math.max(0, progress));
    const empty = '░'.repeat(Math.max(0, length - progress));
    return `[${filled}${empty}]`;
  }

  getXpForNextLevel(currentLevel) {
    return Math.floor(100 * Math.pow(1.5, currentLevel));
  }

  getTotalXpForLevel(level) {
    let total = 0;
    for (let i = 0; i < level; i++) {
      total += Math.floor(100 * Math.pow(1.5, i));
    }
    return total;
  }
}

module.exports = { LevelingSystem };
