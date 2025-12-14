const { EmbedBuilder } = require('discord.js');

const XP_COOLDOWN = 60000;
const MIN_XP = 15;
const MAX_XP = 25;

const userCooldowns = new Map();

class LevelingSystem {
  constructor(client, storage) {
    this.client = client;
    this.storage = storage;
  }

  async handleMessage(message) {
    if (message.author.bot || !message.guild) return;

    const guildData = await this.storage.getGuild(message.guild.id);
    if (guildData?.modules?.leveling === false) return;

    const cooldownKey = `${message.guild.id}-${message.author.id}`;
    const lastXpTime = userCooldowns.get(cooldownKey);
    
    if (lastXpTime && Date.now() - lastXpTime < XP_COOLDOWN) {
      return;
    }

    const xpToAdd = Math.floor(Math.random() * (MAX_XP - MIN_XP + 1)) + MIN_XP;
    
    try {
      const result = await this.storage.updateUserXp(message.guild.id, message.author.id, xpToAdd);
      userCooldowns.set(cooldownKey, Date.now());

      if (result.leveledUp) {
        await this.handleLevelUp(message, result.level, result.oldLevel);
      }
    } catch (error) {
      console.error('XP update error:', error);
    }
  }

  async handleLevelUp(message, newLevel, oldLevel) {
    const guildData = await this.storage.getGuild(message.guild.id);
    
    const levelUpChannel = guildData?.levelUpChannel 
      ? message.guild.channels.cache.get(guildData.levelUpChannel)
      : message.channel;

    if (levelUpChannel) {
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🎉 Seviye Atladın!')
        .setDescription(`Tebrikler ${message.author}! **Seviye ${newLevel}** oldun!`)
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      try {
        await levelUpChannel.send({ embeds: [embed] });
      } catch (error) {
        console.error('Level up message error:', error);
      }
    }

    await this.checkLevelRewards(message.member, newLevel);
  }

  async checkLevelRewards(member, level) {
    try {
      const rewards = await this.storage.getRewardsForLevel(member.guild.id, level);
      
      for (const reward of rewards) {
        const role = member.guild.roles.cache.get(reward.roleId);
        if (role && !member.roles.cache.has(role.id)) {
          await member.roles.add(role);
        }
      }
    } catch (error) {
      console.error('Level reward error:', error);
    }
  }

  getProgressBar(current, required, length = 10) {
    const progress = Math.round((current / required) * length);
    const filled = '█'.repeat(progress);
    const empty = '░'.repeat(length - progress);
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
