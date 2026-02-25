const { db } = require('./db');
const { eq, and, desc, sql, lte, gte } = require('drizzle-orm');
const { guilds, warnings, modCases, customCommands, reactionRoles, giveaways, reminders, afkUsers, userLevels, levelRewards, scheduledMessages, userAchievements, inviteTracking, socialNotifications, userBirthdays, birthdayConfig, userEconomy, economyConfig, shopItems, tickets, ticketConfig, polls, tempVoiceChannels, gameHistory, userInventory, gameItems, activeDuels, dailyStreak, jackpotPool, userStats, lootBoxes, commandUsage } = require('../../shared/schema');
const fs = require('fs');
const path = require('path');

class DatabaseStorage {
  constructor() {
    this.guildCache = new Map();
    this.CACHE_TTL = 60 * 1000; // 1 dakika
  }

  async getGuild(guildId) {
    if (!db) return null;

    const cached = this.guildCache.get(guildId);
    if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
      return cached.data;
    }

    const [guild] = await db.select().from(guilds).where(eq(guilds.id, guildId));
    if (guild) {
      this.guildCache.set(guildId, { data: guild, timestamp: Date.now() });
    }
    return guild || null;
  }

  async upsertGuild(guildId, data) {
    if (!db) return null;
    const existing = await this.getGuild(guildId);
    if (existing) {
      await db.update(guilds).set(data).where(eq(guilds.id, guildId));
    } else {
      await db.insert(guilds).values({ id: guildId, ...data });
    }

    // Cache invalidation & warm-up
    const updated = await this._fetchGuildForce(guildId);
    return updated;
  }

  async _fetchGuildForce(guildId) {
    if (!db) return null;
    const [guild] = await db.select().from(guilds).where(eq(guilds.id, guildId));
    if (guild) {
      this.guildCache.set(guildId, { data: guild, timestamp: Date.now() });
    }
    return guild || null;
  }

  async addWarning(guildId, userId, moderatorId, reason) {
    if (!db) return null;
    const [warning] = await db.insert(warnings).values({
      guildId, userId, moderatorId, reason
    }).returning();
    return warning;
  }

  async getWarnings(guildId, userId) {
    if (!db) return [];
    return db.select().from(warnings).where(
      and(eq(warnings.guildId, guildId), eq(warnings.userId, userId))
    ).orderBy(desc(warnings.createdAt));
  }

  async getWarningCount(guildId, userId) {
    if (!db) return 0;
    const result = await db.select({ count: sql`count(*)` }).from(warnings).where(
      and(eq(warnings.guildId, guildId), eq(warnings.userId, userId))
    );
    return parseInt(result[0]?.count || 0);
  }

  async clearWarnings(guildId, userId) {
    if (!db) return;
    await db.delete(warnings).where(
      and(eq(warnings.guildId, guildId), eq(warnings.userId, userId))
    );
  }

  async addModCase(guildId, type, userId, moderatorId, reason, duration = null) {
    if (!db) return null;
    const lastCase = await db.select({ caseNumber: modCases.caseNumber })
      .from(modCases)
      .where(eq(modCases.guildId, guildId))
      .orderBy(desc(modCases.caseNumber))
      .limit(1);

    const caseNumber = (lastCase[0]?.caseNumber || 0) + 1;

    const [modCase] = await db.insert(modCases).values({
      guildId, caseNumber, type, userId, moderatorId, reason, duration
    }).returning();
    return modCase;
  }

  async getModCases(guildId, limit = 50) {
    if (!db) return [];
    return db.select().from(modCases)
      .where(eq(modCases.guildId, guildId))
      .orderBy(desc(modCases.createdAt))
      .limit(limit);
  }

  async getModCase(guildId, caseNumber) {
    if (!db) return null;
    const [modCase] = await db.select().from(modCases).where(
      and(eq(modCases.guildId, guildId), eq(modCases.caseNumber, caseNumber))
    );
    return modCase || null;
  }

  async addCustomCommand(guildId, name, response, createdBy) {
    if (!db) return null;
    const [cmd] = await db.insert(customCommands).values({
      guildId, name: name.toLowerCase(), response, createdBy
    }).returning();
    return cmd;
  }

  async getCustomCommand(guildId, name) {
    if (!db) return null;
    const [cmd] = await db.select().from(customCommands).where(
      and(eq(customCommands.guildId, guildId), eq(customCommands.name, name.toLowerCase()))
    );
    return cmd || null;
  }

  async incrementCommandUsage(commandName) {
    if (!db) return;
    try {
      const existing = await db.select().from(commandUsage).where(eq(commandUsage.commandName, commandName));
      if (existing.length > 0) {
        await db.update(commandUsage)
          .set({ usageCount: existing[0].usageCount + 1, lastUsedAt: new Date() })
          .where(eq(commandUsage.commandName, commandName));
      } else {
        await db.insert(commandUsage).values({ commandName, usageCount: 1 });
      }
    } catch (e) {
      console.error('[Storage] Error incrementing command usage:', e);
    }
  }

  async getCommandUsages() {
    if (!db) return [];
    try {
      return db.select().from(commandUsage).orderBy(desc(commandUsage.usageCount));
    } catch (e) {
      console.error('[Storage] Error getting command usages:', e);
      return [];
    }
  }

  async getCustomCommands(guildId) {
    if (!db) return [];
    return db.select().from(customCommands).where(eq(customCommands.guildId, guildId));
  }

  async deleteCustomCommand(guildId, name) {
    if (!db) return;
    await db.delete(customCommands).where(
      and(eq(customCommands.guildId, guildId), eq(customCommands.name, name.toLowerCase()))
    );
  }

  async addReactionRole(guildId, channelId, messageId, emoji, roleId) {
    if (!db) return null;
    const [rr] = await db.insert(reactionRoles).values({
      guildId, channelId, messageId, emoji, roleId
    }).returning();
    return rr;
  }

  async getReactionRole(messageId, emoji) {
    if (!db) return null;
    const [rr] = await db.select().from(reactionRoles).where(
      and(eq(reactionRoles.messageId, messageId), eq(reactionRoles.emoji, emoji))
    );
    return rr || null;
  }

  async getReactionRoles(guildId) {
    if (!db) return [];
    return db.select().from(reactionRoles).where(eq(reactionRoles.guildId, guildId));
  }

  async deleteReactionRole(id) {
    if (!db) return;
    await db.delete(reactionRoles).where(eq(reactionRoles.id, id));
  }

  async createGiveaway(guildId, channelId, prize, winners, endsAt, hostId) {
    if (!db) return null;
    const [giveaway] = await db.insert(giveaways).values({
      guildId, channelId, prize, winners, endsAt, hostId
    }).returning();
    return giveaway;
  }

  async updateGiveaway(id, data) {
    if (!db) return null;
    await db.update(giveaways).set(data).where(eq(giveaways.id, id));
  }

  async getActiveGiveaways() {
    if (!db) return [];
    return db.select().from(giveaways).where(eq(giveaways.ended, false));
  }

  async addReminder(userId, channelId, guildId, message, remindAt) {
    if (!db) return null;
    const [reminder] = await db.insert(reminders).values({
      userId, channelId, guildId, message, remindAt
    }).returning();
    return reminder;
  }

  async getPendingReminders() {
    if (!db) return [];
    return db.select().from(reminders).where(eq(reminders.completed, false));
  }

  async completeReminder(id) {
    if (!db) return;
    await db.update(reminders).set({ completed: true }).where(eq(reminders.id, id));
  }

  async getGuildReminders(guildId) {
    if (!db) return [];
    return db.select().from(reminders)
      .where(and(eq(reminders.guildId, guildId), eq(reminders.completed, false)))
      .orderBy(reminders.remindAt);
  }

  async deleteReminder(id) {
    if (!db) return;
    await db.delete(reminders).where(eq(reminders.id, id));
  }

  async getGuildGiveaways(guildId) {
    if (!db) return [];
    return db.select().from(giveaways)
      .where(eq(giveaways.guildId, guildId))
      .orderBy(desc(giveaways.createdAt));
  }

  async setAfk(guildId, userId, reason) {
    if (!db) return null;
    await db.delete(afkUsers).where(
      and(eq(afkUsers.guildId, guildId), eq(afkUsers.userId, userId))
    );
    const [afk] = await db.insert(afkUsers).values({
      guildId, userId, reason
    }).returning();
    return afk;
  }

  async getAfk(guildId, userId) {
    if (!db) return null;
    const [afk] = await db.select().from(afkUsers).where(
      and(eq(afkUsers.guildId, guildId), eq(afkUsers.userId, userId))
    );
    return afk || null;
  }

  async removeAfk(guildId, userId) {
    if (!db) return;
    await db.delete(afkUsers).where(
      and(eq(afkUsers.guildId, guildId), eq(afkUsers.userId, userId))
    );
  }

  async getUserLevel(guildId, userId) {
    if (!db) return null;
    const [user] = await db.select().from(userLevels).where(
      and(eq(userLevels.guildId, guildId), eq(userLevels.userId, userId))
    );
    return user || null;
  }

  async getLeaderboard(guildId, limit = 50) {
    if (!db) return [];
    try {
      return await db.select()
        .from(userLevels)
        .where(eq(userLevels.guildId, guildId))
        .orderBy(desc(userLevels.xp))
        .limit(limit);
    } catch (e) {
      console.error('[Storage] Error getting leaderboard:', e);
      return [];
    }
  }

  async updateUserXp(guildId, userId, xpToAdd) {
    if (!db) return null;
    const existing = await this.getUserLevel(guildId, userId);

    if (existing) {
      const newXp = existing.xp + xpToAdd;
      const newLevel = this.calculateLevel(newXp);
      const leveledUp = newLevel > existing.level;

      await db.update(userLevels).set({
        xp: newXp,
        level: newLevel,
        totalMessages: existing.totalMessages + 1,
        lastXpTime: new Date()
      }).where(and(eq(userLevels.guildId, guildId), eq(userLevels.userId, userId)));

      return { xp: newXp, level: newLevel, leveledUp, oldLevel: existing.level };
    } else {
      const newLevel = this.calculateLevel(xpToAdd);
      await db.insert(userLevels).values({
        guildId, userId, xp: xpToAdd, level: newLevel, totalMessages: 1
      });
      return { xp: xpToAdd, level: newLevel, leveledUp: newLevel > 0, oldLevel: 0 };
    }
  }

  calculateLevel(xp) {
    let level = 0;
    let requiredXp = 100;
    let totalRequired = 0;

    while (xp >= totalRequired + requiredXp) {
      totalRequired += requiredXp;
      level++;
      requiredXp = Math.floor(100 * Math.pow(1.5, level));
    }
    return level;
  }

  getXpForLevel(level) {
    let totalXp = 0;
    for (let i = 0; i < level; i++) {
      totalXp += Math.floor(100 * Math.pow(1.5, i));
    }
    return totalXp;
  }

  async getLeaderboard(guildId, limit = 10) {
    if (!db) return [];
    return db.select().from(userLevels)
      .where(eq(userLevels.guildId, guildId))
      .orderBy(desc(userLevels.xp))
      .limit(limit);
  }

  async getUserRank(guildId, userId) {
    if (!db) return null;
    const result = await db.execute(sql`
      SELECT COUNT(*) + 1 as rank FROM user_levels 
      WHERE guild_id = ${guildId} AND xp > (
        SELECT COALESCE(xp, 0) FROM user_levels WHERE guild_id = ${guildId} AND user_id = ${userId}
      )
    `);
    return result.rows[0]?.rank || null;
  }

  async addLevelReward(guildId, level, roleId) {
    if (!db) return null;
    await db.delete(levelRewards).where(
      and(eq(levelRewards.guildId, guildId), eq(levelRewards.level, level))
    );
    const [reward] = await db.insert(levelRewards).values({
      guildId, level, roleId
    }).returning();
    return reward;
  }

  async getLevelRewards(guildId) {
    if (!db) return [];
    return db.select().from(levelRewards)
      .where(eq(levelRewards.guildId, guildId))
      .orderBy(levelRewards.level);
  }

  async getLevelReward(guildId, level) {
    if (!db) return null;
    const [reward] = await db.select().from(levelRewards).where(
      and(eq(levelRewards.guildId, guildId), eq(levelRewards.level, level))
    );
    return reward || null;
  }

  async removeLevelReward(guildId, level) {
    if (!db) return;
    await db.delete(levelRewards).where(
      and(eq(levelRewards.guildId, guildId), eq(levelRewards.level, level))
    );
  }

  async getRewardsForLevel(guildId, level) {
    if (!db) return [];
    return db.select().from(levelRewards)
      .where(and(eq(levelRewards.guildId, guildId), lte(levelRewards.level, level)))
      .orderBy(levelRewards.level);
  }

  async addScheduledMessage(guildId, channelId, message, intervalMinutes, createdBy) {
    if (!db) return null;
    const nextRun = new Date(Date.now() + intervalMinutes * 60 * 1000);
    const [scheduled] = await db.insert(scheduledMessages).values({
      guildId, channelId, message, intervalMinutes, nextRun, createdBy
    }).returning();
    return scheduled;
  }

  async getScheduledMessages(guildId) {
    if (!db) return [];
    return db.select().from(scheduledMessages).where(eq(scheduledMessages.guildId, guildId));
  }

  async getPendingScheduledMessages() {
    if (!db) return [];
    return db.select().from(scheduledMessages).where(
      and(eq(scheduledMessages.enabled, true), lte(scheduledMessages.nextRun, new Date()))
    );
  }

  async updateScheduledMessageNextRun(id, nextRun) {
    if (!db) return;
    await db.update(scheduledMessages).set({ nextRun }).where(eq(scheduledMessages.id, id));
  }

  async deleteScheduledMessage(id) {
    if (!db) return;
    await db.delete(scheduledMessages).where(eq(scheduledMessages.id, id));
  }

  async toggleScheduledMessage(id, enabled) {
    if (!db) return;
    await db.update(scheduledMessages).set({ enabled }).where(eq(scheduledMessages.id, id));
  }

  async getUserAchievements(guildId, userId) {
    if (!db) return [];
    return db.select().from(userAchievements).where(
      and(eq(userAchievements.guildId, guildId), eq(userAchievements.userId, userId))
    );
  }

  async addAchievement(guildId, userId, achievementId) {
    if (!db) return null;
    const existing = await db.select().from(userAchievements).where(
      and(
        eq(userAchievements.guildId, guildId),
        eq(userAchievements.userId, userId),
        eq(userAchievements.achievementId, achievementId)
      )
    );
    if (existing.length > 0) return existing[0];
    const [achievement] = await db.insert(userAchievements).values({
      guildId, userId, achievementId
    }).returning();
    return achievement;
  }

  async hasAchievement(guildId, userId, achievementId) {
    if (!db) return false;
    const [achievement] = await db.select().from(userAchievements).where(
      and(
        eq(userAchievements.guildId, guildId),
        eq(userAchievements.userId, userId),
        eq(userAchievements.achievementId, achievementId)
      )
    );
    return !!achievement;
  }

  async trackInvite(guildId, userId, inviterId, inviteCode) {
    if (!db) return null;
    const [invite] = await db.insert(inviteTracking).values({
      guildId, userId, inviterId, inviteCode
    }).returning();
    return invite;
  }

  async getInviteCount(guildId, inviterId) {
    if (!db) return 0;
    const result = await db.select({ count: sql`count(*)` }).from(inviteTracking).where(
      and(eq(inviteTracking.guildId, guildId), eq(inviteTracking.inviterId, inviterId))
    );
    return parseInt(result[0]?.count || 0);
  }

  async getInviteLeaderboard(guildId, limit = 10) {
    if (!db) return [];
    const result = await db.execute(sql`
      SELECT inviter_id, COUNT(*) as invite_count 
      FROM invite_tracking 
      WHERE guild_id = ${guildId} AND inviter_id IS NOT NULL
      GROUP BY inviter_id 
      ORDER BY invite_count DESC 
      LIMIT ${limit}
    `);
    return result.rows || [];
  }

  async addSocialNotification(guildId, platform, username, channelId, customMessage = null) {
    if (!db) return null;
    const [notification] = await db.insert(socialNotifications).values({
      guildId, platform, username, channelId, customMessage
    }).returning();
    return notification;
  }

  async getSocialNotifications(guildId, platform = null) {
    if (!db) return [];
    if (platform) {
      return db.select().from(socialNotifications).where(
        and(eq(socialNotifications.guildId, guildId), eq(socialNotifications.platform, platform))
      );
    }
    return db.select().from(socialNotifications).where(eq(socialNotifications.guildId, guildId));
  }

  async deleteSocialNotification(id) {
    if (!db) return;
    await db.delete(socialNotifications).where(eq(socialNotifications.id, id));
  }

  async updateSocialNotification(id, data) {
    if (!db) return;
    await db.update(socialNotifications).set(data).where(eq(socialNotifications.id, id));
  }

  async setBirthday(guildId, userId, day, month, timezone = 'UTC') {
    if (!db) return null;
    await db.delete(userBirthdays).where(
      and(eq(userBirthdays.guildId, guildId), eq(userBirthdays.userId, userId))
    );
    const [birthday] = await db.insert(userBirthdays).values({
      guildId, userId, day, month, timezone
    }).returning();
    return birthday;
  }

  async getBirthday(guildId, userId) {
    if (!db) return null;
    const [birthday] = await db.select().from(userBirthdays).where(
      and(eq(userBirthdays.guildId, guildId), eq(userBirthdays.userId, userId))
    );
    return birthday || null;
  }

  async getTodaysBirthdays(guildId) {
    if (!db) return [];
    const today = new Date();
    return db.select().from(userBirthdays).where(
      and(
        eq(userBirthdays.guildId, guildId),
        eq(userBirthdays.day, today.getDate()),
        eq(userBirthdays.month, today.getMonth() + 1)
      )
    );
  }

  async getBirthdayConfig(guildId) {
    if (!db) return null;
    const [config] = await db.select().from(birthdayConfig).where(eq(birthdayConfig.guildId, guildId));
    return config || null;
  }

  async upsertBirthdayConfig(guildId, data) {
    if (!db) return null;
    const existing = await this.getBirthdayConfig(guildId);
    if (existing) {
      await db.update(birthdayConfig).set(data).where(eq(birthdayConfig.guildId, guildId));
    } else {
      await db.insert(birthdayConfig).values({ guildId, ...data });
    }
    return this.getBirthdayConfig(guildId);
  }

  async getAllTodaysBirthdays() {
    if (!db) return [];
    const today = new Date();
    return db.select().from(userBirthdays).where(
      and(
        eq(userBirthdays.day, today.getDate()),
        eq(userBirthdays.month, today.getMonth() + 1)
      )
    );
  }

  async getAllBirthdayConfigs() {
    if (!db) return [];
    return db.select().from(birthdayConfig);
  }

  async getUserEconomy(guildId, userId) {
    if (!db) return null;
    const [user] = await db.select().from(userEconomy).where(
      and(eq(userEconomy.guildId, guildId), eq(userEconomy.userId, userId))
    );
    return user || null;
  }

  async createUserEconomy(guildId, userId) {
    if (!db) return null;
    const existing = await this.getUserEconomy(guildId, userId);
    if (existing) return existing;
    const [user] = await db.insert(userEconomy).values({ guildId, userId }).returning();
    return user;
  }

  async updateUserBalance(guildId, userId, amount, isBank = false) {
    if (!db) return null;
    let user = await this.getUserEconomy(guildId, userId);
    if (!user) user = await this.createUserEconomy(guildId, userId);

    const updateData = isBank
      ? { bank: user.bank + amount }
      : { balance: user.balance + amount };

    await db.update(userEconomy).set(updateData).where(
      and(eq(userEconomy.guildId, guildId), eq(userEconomy.userId, userId))
    );
    return this.getUserEconomy(guildId, userId);
  }

  async getEconomyLeaderboard(guildId, limit = 10) {
    if (!db) return [];
    return db.select().from(userEconomy)
      .where(eq(userEconomy.guildId, guildId))
      .orderBy(desc(sql`${userEconomy.balance} + ${userEconomy.bank}`))
      .limit(limit);
  }

  async getEconomyConfig(guildId) {
    if (!db) return null;
    const [config] = await db.select().from(economyConfig).where(eq(economyConfig.guildId, guildId));
    return config || null;
  }

  async upsertEconomyConfig(guildId, data) {
    if (!db) return null;
    const existing = await this.getEconomyConfig(guildId);
    if (existing) {
      await db.update(economyConfig).set(data).where(eq(economyConfig.guildId, guildId));
    } else {
      await db.insert(economyConfig).values({ guildId, ...data });
    }
    return this.getEconomyConfig(guildId);
  }

  async getShopItems(guildId) {
    if (!db) return [];
    return db.select().from(shopItems).where(eq(shopItems.guildId, guildId));
  }

  async addShopItem(guildId, name, description, price, roleId = null, stock = -1) {
    if (!db) return null;
    const [item] = await db.insert(shopItems).values({
      guildId, name, description, price, roleId, stock
    }).returning();
    return item;
  }

  async deleteShopItem(id) {
    if (!db) return;
    await db.delete(shopItems).where(eq(shopItems.id, id));
  }

  async createTicket(guildId, channelId, userId, subject = null) {
    if (!db) return null;
    const [ticket] = await db.insert(tickets).values({
      guildId, channelId, userId, subject
    }).returning();
    return ticket;
  }

  async getTickets(guildId, status = null) {
    if (!db) return [];
    if (status) {
      return db.select().from(tickets).where(
        and(eq(tickets.guildId, guildId), eq(tickets.status, status))
      );
    }
    return db.select().from(tickets).where(eq(tickets.guildId, guildId));
  }

  async closeTicket(id, closedBy) {
    if (!db) return;
    await db.update(tickets).set({
      status: 'closed',
      closedBy,
      closedAt: new Date()
    }).where(eq(tickets.id, id));
  }

  async getTicketConfig(guildId) {
    if (!db) return null;
    const [config] = await db.select().from(ticketConfig).where(eq(ticketConfig.guildId, guildId));
    return config || null;
  }

  async upsertTicketConfig(guildId, data) {
    if (!db) return null;
    const existing = await this.getTicketConfig(guildId);
    if (existing) {
      await db.update(ticketConfig).set(data).where(eq(ticketConfig.guildId, guildId));
    } else {
      await db.insert(ticketConfig).values({ guildId, ...data });
    }
    return this.getTicketConfig(guildId);
  }

  async createPoll(guildId, channelId, question, options, createdBy, endsAt = null) {
    if (!db) return null;
    const [poll] = await db.insert(polls).values({
      guildId, channelId, question, options, createdBy, endsAt
    }).returning();
    return poll;
  }

  async getPoll(id) {
    if (!db) return null;
    const [poll] = await db.select().from(polls).where(eq(polls.id, id));
    return poll || null;
  }

  async updatePoll(id, data) {
    if (!db) return;
    await db.update(polls).set(data).where(eq(polls.id, id));
  }

  async getActivePolls(guildId) {
    if (!db) return [];
    return db.select().from(polls).where(
      and(eq(polls.guildId, guildId), eq(polls.ended, false))
    );
  }

  async addTempVoiceChannel(guildId, channelId, ownerId) {
    if (!db) return null;
    const [channel] = await db.insert(tempVoiceChannels).values({
      guildId, channelId, ownerId
    }).returning();
    return channel;
  }

  async getTempVoiceChannel(channelId) {
    if (!db) return null;
    const [channel] = await db.select().from(tempVoiceChannels).where(eq(tempVoiceChannels.channelId, channelId));
    return channel || null;
  }

  async deleteTempVoiceChannel(channelId) {
    if (!db) return;
    await db.delete(tempVoiceChannels).where(eq(tempVoiceChannels.channelId, channelId));
  }

  async addGameHistory(guildId, userId, gameType, betAmount, winAmount, result, details = {}) {
    if (!db) return null;
    const [history] = await db.insert(gameHistory).values({
      guildId, userId, gameType, betAmount, winAmount, result, details
    }).returning();
    return history;
  }

  async getGameHistory(guildId, userId, limit = 20) {
    if (!db) return [];
    return db.select().from(gameHistory)
      .where(and(eq(gameHistory.guildId, guildId), eq(gameHistory.userId, userId)))
      .orderBy(desc(gameHistory.createdAt))
      .limit(limit);
  }

  async getUserStats(guildId, userId) {
    if (!db) return null;
    const [stats] = await db.select().from(userStats)
      .where(and(eq(userStats.guildId, guildId), eq(userStats.userId, userId)));
    return stats || null;
  }

  async createUserStats(guildId, userId) {
    if (!db) return null;
    const existing = await this.getUserStats(guildId, userId);
    if (existing) return existing;
    const [stats] = await db.insert(userStats).values({ guildId, userId }).returning();
    return stats;
  }

  async updateUserStats(guildId, userId, updates) {
    if (!db) return null;
    let stats = await this.getUserStats(guildId, userId);
    if (!stats) stats = await this.createUserStats(guildId, userId);
    await db.update(userStats).set(updates)
      .where(and(eq(userStats.guildId, guildId), eq(userStats.userId, userId)));
    return this.getUserStats(guildId, userId);
  }

  async incrementUserStats(guildId, userId, field, amount = 1) {
    if (!db) return null;
    let stats = await this.getUserStats(guildId, userId);
    if (!stats) stats = await this.createUserStats(guildId, userId);
    const currentValue = stats[field] || 0;
    await db.update(userStats).set({ [field]: currentValue + amount })
      .where(and(eq(userStats.guildId, guildId), eq(userStats.userId, userId)));
    return this.getUserStats(guildId, userId);
  }

  async getInventory(guildId, userId) {
    if (!db) return [];
    return db.select().from(userInventory)
      .where(and(eq(userInventory.guildId, guildId), eq(userInventory.userId, userId)));
  }

  async addToInventory(guildId, userId, itemId, quantity = 1) {
    if (!db) return null;
    const [existing] = await db.select().from(userInventory)
      .where(and(
        eq(userInventory.guildId, guildId),
        eq(userInventory.userId, userId),
        eq(userInventory.itemId, itemId)
      ));
    if (existing) {
      await db.update(userInventory)
        .set({ quantity: existing.quantity + quantity })
        .where(eq(userInventory.id, existing.id));
      return this.getInventoryItem(guildId, userId, itemId);
    }
    const [item] = await db.insert(userInventory).values({
      guildId, userId, itemId, quantity
    }).returning();
    return item;
  }

  async getInventoryItem(guildId, userId, itemId) {
    if (!db) return null;
    const [item] = await db.select().from(userInventory)
      .where(and(
        eq(userInventory.guildId, guildId),
        eq(userInventory.userId, userId),
        eq(userInventory.itemId, itemId)
      ));
    return item || null;
  }

  async removeFromInventory(guildId, userId, itemId, quantity = 1) {
    if (!db) return false;
    const existing = await this.getInventoryItem(guildId, userId, itemId);
    if (!existing || existing.quantity < quantity) return false;
    if (existing.quantity === quantity) {
      await db.delete(userInventory).where(eq(userInventory.id, existing.id));
    } else {
      await db.update(userInventory)
        .set({ quantity: existing.quantity - quantity })
        .where(eq(userInventory.id, existing.id));
    }
    return true;
  }

  async createDuel(guildId, channelId, challengerId, opponentId, betAmount, gameType) {
    if (!db) return null;
    const expiresAt = new Date(Date.now() + 60000);
    const [duel] = await db.insert(activeDuels).values({
      guildId, channelId, challengerId, opponentId, betAmount, gameType, expiresAt
    }).returning();
    return duel;
  }

  async getDuel(id) {
    if (!db) return null;
    const [duel] = await db.select().from(activeDuels).where(eq(activeDuels.id, id));
    return duel || null;
  }

  async getPendingDuel(guildId, opponentId) {
    if (!db) return null;
    const [duel] = await db.select().from(activeDuels)
      .where(and(
        eq(activeDuels.guildId, guildId),
        eq(activeDuels.opponentId, opponentId),
        eq(activeDuels.status, 'pending')
      ));
    return duel || null;
  }

  async updateDuel(id, updates) {
    if (!db) return;
    await db.update(activeDuels).set(updates).where(eq(activeDuels.id, id));
  }

  async deleteDuel(id) {
    if (!db) return;
    await db.delete(activeDuels).where(eq(activeDuels.id, id));
  }

  async cleanExpiredDuels() {
    if (!db) return;
    await db.delete(activeDuels).where(lte(activeDuels.expiresAt, new Date()));
  }

  async getDailyStreak(guildId, userId) {
    if (!db) return null;
    const [streak] = await db.select().from(dailyStreak)
      .where(and(eq(dailyStreak.guildId, guildId), eq(dailyStreak.userId, userId)));
    return streak || null;
  }

  async updateDailyStreak(guildId, userId) {
    if (!db) return null;
    let streak = await this.getDailyStreak(guildId, userId);
    const now = new Date();

    if (!streak) {
      const [newStreak] = await db.insert(dailyStreak).values({
        guildId, userId, currentStreak: 1, longestStreak: 1, lastClaim: now
      }).returning();
      return { streak: newStreak, bonus: 0, isNewStreak: true };
    }

    const lastClaim = streak.lastClaim ? new Date(streak.lastClaim) : null;
    const hoursSinceLast = lastClaim ? (now - lastClaim) / (1000 * 60 * 60) : 999;

    if (hoursSinceLast < 20) {
      return { streak, bonus: 0, alreadyClaimed: true };
    }

    let newCurrentStreak = 1;
    if (hoursSinceLast <= 48) {
      newCurrentStreak = streak.currentStreak + 1;
    }

    const newLongestStreak = Math.max(streak.longestStreak, newCurrentStreak);
    const bonus = Math.min(newCurrentStreak * 10, 100);

    await db.update(dailyStreak).set({
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastClaim: now
    }).where(eq(dailyStreak.id, streak.id));

    return {
      streak: { ...streak, currentStreak: newCurrentStreak, longestStreak: newLongestStreak },
      bonus,
      isNewStreak: newCurrentStreak === 1
    };
  }

  async getJackpot(guildId) {
    if (!db) return null;
    const [jp] = await db.select().from(jackpotPool).where(eq(jackpotPool.guildId, guildId));
    return jp || null;
  }

  async addToJackpot(guildId, amount) {
    if (!db) return null;
    let jp = await this.getJackpot(guildId);
    if (!jp) {
      const [newJp] = await db.insert(jackpotPool).values({ guildId, amount }).returning();
      return newJp;
    }
    await db.update(jackpotPool)
      .set({ amount: jp.amount + amount })
      .where(eq(jackpotPool.guildId, guildId));
    return this.getJackpot(guildId);
  }

  async claimJackpot(guildId, winnerId) {
    if (!db) return null;
    const jp = await this.getJackpot(guildId);
    if (!jp || jp.amount <= 0) return null;
    const wonAmount = jp.amount;
    await db.update(jackpotPool).set({
      amount: 0,
      lastWinner: winnerId,
      lastWinAmount: wonAmount,
      lastWinDate: new Date()
    }).where(eq(jackpotPool.guildId, guildId));
    return wonAmount;
  }

  async getGamingLeaderboard(guildId, limit = 10) {
    if (!db) return [];
    return db.select().from(userStats)
      .where(eq(userStats.guildId, guildId))
      .orderBy(desc(userStats.totalWon))
      .limit(limit);
  }
}

class JSONStorage {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data');
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }
  }

  loadJSON(filename, defaultData = {}) {
    const filePath = path.join(this.dataPath, filename);
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    } catch (error) {
      console.error(`Error loading ${filename}:`, error);
    }
    return defaultData;
  }

  saveJSON(filename, data) {
    const filePath = path.join(this.dataPath, filename);
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error saving ${filename}:`, error);
    }
  }

  async getGuild(guildId) {
    const config = this.loadJSON('config.json', {});
    return config[guildId] || null;
  }

  async upsertGuild(guildId, data) {
    const config = this.loadJSON('config.json', {});
    config[guildId] = { ...config[guildId], ...data };
    this.saveJSON('config.json', config);
    return config[guildId];
  }

  async addWarning(guildId, userId, moderatorId, reason) {
    const warnings = this.loadJSON('warnings.json', {});
    if (!warnings[guildId]) warnings[guildId] = {};
    if (!warnings[guildId][userId]) warnings[guildId][userId] = [];
    const warning = { moderatorId, reason, createdAt: new Date().toISOString() };
    warnings[guildId][userId].push(warning);
    this.saveJSON('warnings.json', warnings);
    return warning;
  }

  async getWarnings(guildId, userId) {
    const warnings = this.loadJSON('warnings.json', {});
    return warnings[guildId]?.[userId] || [];
  }

  async getWarningCount(guildId, userId) {
    const warnings = await this.getWarnings(guildId, userId);
    return warnings.length;
  }

  async clearWarnings(guildId, userId) {
    const warnings = this.loadJSON('warnings.json', {});
    if (warnings[guildId]) {
      delete warnings[guildId][userId];
      this.saveJSON('warnings.json', warnings);
    }
  }

  async addModCase(guildId, type, userId, moderatorId, reason, duration = null) {
    const cases = this.loadJSON('modcases.json', {});
    if (!cases[guildId]) cases[guildId] = [];
    const caseNumber = cases[guildId].length + 1;
    const modCase = { caseNumber, type, userId, moderatorId, reason, duration, createdAt: new Date().toISOString() };
    cases[guildId].push(modCase);
    this.saveJSON('modcases.json', cases);
    return modCase;
  }

  async getModCases(guildId, limit = 50) {
    const cases = this.loadJSON('modcases.json', {});
    return (cases[guildId] || []).slice(-limit).reverse();
  }

  async getModCase(guildId, caseNumber) {
    const cases = this.loadJSON('modcases.json', {});
    return (cases[guildId] || []).find(c => c.caseNumber === caseNumber) || null;
  }

  async addCustomCommand(guildId, name, response, createdBy) {
    const cmds = this.loadJSON('customCommands.json', {});
    if (!cmds[guildId]) cmds[guildId] = {};
    cmds[guildId][name.toLowerCase()] = { response, createdBy, createdAt: new Date().toISOString() };
    this.saveJSON('customCommands.json', cmds);
    return cmds[guildId][name.toLowerCase()];
  }

  async getCustomCommand(guildId, name) {
    const cmds = this.loadJSON('customCommands.json', {});
    const cmd = cmds[guildId]?.[name.toLowerCase()];
    return cmd ? { name, ...cmd } : null;
  }

  async getCustomCommands(guildId) {
    const cmds = this.loadJSON('customCommands.json', {});
    const guildCmds = cmds[guildId] || {};
    return Object.entries(guildCmds).map(([name, data]) => ({ name, ...data }));
  }

  async deleteCustomCommand(guildId, name) {
    const cmds = this.loadJSON('customCommands.json', {});
    if (cmds[guildId]) {
      delete cmds[guildId][name.toLowerCase()];
      this.saveJSON('customCommands.json', cmds);
    }
  }

  async addReactionRole(guildId, channelId, messageId, emoji, roleId) {
    const rrs = this.loadJSON('reactionRoles.json', {});
    if (!rrs[guildId]) rrs[guildId] = [];
    const rr = { id: Date.now(), channelId, messageId, emoji, roleId };
    rrs[guildId].push(rr);
    this.saveJSON('reactionRoles.json', rrs);
    return rr;
  }

  async getReactionRole(messageId, emoji) {
    const rrs = this.loadJSON('reactionRoles.json', {});
    for (const guildRrs of Object.values(rrs)) {
      const rr = guildRrs.find(r => r.messageId === messageId && r.emoji === emoji);
      if (rr) return rr;
    }
    return null;
  }

  async getReactionRoles(guildId) {
    const rrs = this.loadJSON('reactionRoles.json', {});
    return rrs[guildId] || [];
  }

  async deleteReactionRole(id) {
    const rrs = this.loadJSON('reactionRoles.json', {});
    for (const guildId of Object.keys(rrs)) {
      rrs[guildId] = rrs[guildId].filter(r => r.id !== id);
    }
    this.saveJSON('reactionRoles.json', rrs);
  }

  async createGiveaway(guildId, channelId, prize, winners, endsAt, hostId) {
    const giveaways = this.loadJSON('giveaways.json', []);
    const giveaway = { id: Date.now(), guildId, channelId, prize, winners, endsAt: endsAt.toISOString(), hostId, ended: false };
    giveaways.push(giveaway);
    this.saveJSON('giveaways.json', giveaways);
    return giveaway;
  }

  async updateGiveaway(id, data) {
    const giveaways = this.loadJSON('giveaways.json', []);
    const index = giveaways.findIndex(g => g.id === id);
    if (index !== -1) {
      giveaways[index] = { ...giveaways[index], ...data };
      this.saveJSON('giveaways.json', giveaways);
    }
  }

  async getActiveGiveaways() {
    const giveaways = this.loadJSON('giveaways.json', []);
    return giveaways.filter(g => !g.ended);
  }

  async addReminder(userId, channelId, guildId, message, remindAt) {
    const reminders = this.loadJSON('reminders.json', []);
    const reminder = { id: Date.now(), userId, channelId, guildId, message, remindAt: remindAt.toISOString(), completed: false };
    reminders.push(reminder);
    this.saveJSON('reminders.json', reminders);
    return reminder;
  }

  async getPendingReminders() {
    const reminders = this.loadJSON('reminders.json', []);
    return reminders.filter(r => !r.completed);
  }

  async completeReminder(id) {
    const reminders = this.loadJSON('reminders.json', []);
    const index = reminders.findIndex(r => r.id === id);
    if (index !== -1) {
      reminders[index].completed = true;
      this.saveJSON('reminders.json', reminders);
    }
  }

  async setAfk(guildId, userId, reason) {
    const afks = this.loadJSON('afk.json', {});
    if (!afks[guildId]) afks[guildId] = {};
    afks[guildId][userId] = { reason, createdAt: new Date().toISOString() };
    this.saveJSON('afk.json', afks);
    return afks[guildId][userId];
  }

  async getAfk(guildId, userId) {
    const afks = this.loadJSON('afk.json', {});
    return afks[guildId]?.[userId] || null;
  }

  async removeAfk(guildId, userId) {
    const afks = this.loadJSON('afk.json', {});
    if (afks[guildId]) {
      delete afks[guildId][userId];
      this.saveJSON('afk.json', afks);
    }
  }

  calculateLevel(xp) {
    let level = 0;
    let requiredXp = 100;
    let totalRequired = 0;
    while (xp >= totalRequired + requiredXp) {
      totalRequired += requiredXp;
      level++;
      requiredXp = Math.floor(100 * Math.pow(1.5, level));
    }
    return level;
  }

  getXpForLevel(level) {
    let totalXp = 0;
    for (let i = 0; i < level; i++) {
      totalXp += Math.floor(100 * Math.pow(1.5, i));
    }
    return totalXp;
  }

  async getUserLevel(guildId, userId) {
    const levels = this.loadJSON('levels.json', {});
    return levels[guildId]?.[userId] || null;
  }

  async updateUserXp(guildId, userId, xpToAdd) {
    const levels = this.loadJSON('levels.json', {});
    if (!levels[guildId]) levels[guildId] = {};

    const existing = levels[guildId][userId] || { xp: 0, level: 0, totalMessages: 0 };
    const newXp = existing.xp + xpToAdd;
    const newLevel = this.calculateLevel(newXp);
    const leveledUp = newLevel > existing.level;

    levels[guildId][userId] = {
      xp: newXp,
      level: newLevel,
      totalMessages: existing.totalMessages + 1,
      lastXpTime: new Date().toISOString()
    };
    this.saveJSON('levels.json', levels);
    return { xp: newXp, level: newLevel, leveledUp, oldLevel: existing.level };
  }

  async getLeaderboard(guildId, limit = 10) {
    const levels = this.loadJSON('levels.json', {});
    const guildLevels = levels[guildId] || {};
    return Object.entries(guildLevels)
      .map(([userId, data]) => ({ userId, ...data }))
      .sort((a, b) => b.xp - a.xp)
      .slice(0, limit);
  }

  async getUserRank(guildId, userId) {
    const levels = this.loadJSON('levels.json', {});
    const guildLevels = levels[guildId] || {};
    const sorted = Object.entries(guildLevels)
      .map(([uid, data]) => ({ userId: uid, ...data }))
      .sort((a, b) => b.xp - a.xp);
    const index = sorted.findIndex(u => u.userId === userId);
    return index !== -1 ? index + 1 : null;
  }

  async addLevelReward(guildId, level, roleId) {
    const rewards = this.loadJSON('levelRewards.json', {});
    if (!rewards[guildId]) rewards[guildId] = {};
    rewards[guildId][level] = { roleId, createdAt: new Date().toISOString() };
    this.saveJSON('levelRewards.json', rewards);
    return { guildId, level, roleId };
  }

  async getLevelRewards(guildId) {
    const rewards = this.loadJSON('levelRewards.json', {});
    const guildRewards = rewards[guildId] || {};
    return Object.entries(guildRewards)
      .map(([level, data]) => ({ level: parseInt(level), ...data }))
      .sort((a, b) => a.level - b.level);
  }

  async getLevelReward(guildId, level) {
    const rewards = this.loadJSON('levelRewards.json', {});
    return rewards[guildId]?.[level] || null;
  }

  async removeLevelReward(guildId, level) {
    const rewards = this.loadJSON('levelRewards.json', {});
    if (rewards[guildId]) {
      delete rewards[guildId][level];
      this.saveJSON('levelRewards.json', rewards);
    }
  }

  async getRewardsForLevel(guildId, level) {
    const rewards = this.loadJSON('levelRewards.json', {});
    const guildRewards = rewards[guildId] || {};
    return Object.entries(guildRewards)
      .filter(([lvl]) => parseInt(lvl) <= level)
      .map(([lvl, data]) => ({ level: parseInt(lvl), ...data }))
      .sort((a, b) => a.level - b.level);
  }

  async addScheduledMessage(guildId, channelId, message, intervalMinutes, createdBy) {
    const scheduled = this.loadJSON('scheduledMessages.json', []);
    const newMsg = {
      id: Date.now(),
      guildId, channelId, message, intervalMinutes, createdBy,
      nextRun: new Date(Date.now() + intervalMinutes * 60 * 1000).toISOString(),
      enabled: true
    };
    scheduled.push(newMsg);
    this.saveJSON('scheduledMessages.json', scheduled);
    return newMsg;
  }

  async getScheduledMessages(guildId) {
    const scheduled = this.loadJSON('scheduledMessages.json', []);
    return scheduled.filter(s => s.guildId === guildId);
  }

  async getPendingScheduledMessages() {
    const scheduled = this.loadJSON('scheduledMessages.json', []);
    const now = new Date();
    return scheduled.filter(s => s.enabled && new Date(s.nextRun) <= now);
  }

  async updateScheduledMessageNextRun(id, nextRun) {
    const scheduled = this.loadJSON('scheduledMessages.json', []);
    const index = scheduled.findIndex(s => s.id === id);
    if (index !== -1) {
      scheduled[index].nextRun = nextRun.toISOString();
      this.saveJSON('scheduledMessages.json', scheduled);
    }
  }

  async deleteScheduledMessage(id) {
    let scheduled = this.loadJSON('scheduledMessages.json', []);
    scheduled = scheduled.filter(s => s.id !== id);
    this.saveJSON('scheduledMessages.json', scheduled);
  }

  async getUserAchievements(guildId, userId) {
    const achievements = this.loadJSON('achievements.json', {});
    return achievements[guildId]?.[userId] || [];
  }

  async addAchievement(guildId, userId, achievementId) {
    const achievements = this.loadJSON('achievements.json', {});
    if (!achievements[guildId]) achievements[guildId] = {};
    if (!achievements[guildId][userId]) achievements[guildId][userId] = [];
    if (!achievements[guildId][userId].includes(achievementId)) {
      achievements[guildId][userId].push(achievementId);
      this.saveJSON('achievements.json', achievements);
    }
    return { guildId, userId, achievementId };
  }

  async hasAchievement(guildId, userId, achievementId) {
    const achievements = this.loadJSON('achievements.json', {});
    return achievements[guildId]?.[userId]?.includes(achievementId) || false;
  }

  async trackInvite(guildId, userId, inviterId, inviteCode) {
    const invites = this.loadJSON('invites.json', {});
    if (!invites[guildId]) invites[guildId] = [];
    invites[guildId].push({ userId, inviterId, inviteCode, joinedAt: new Date().toISOString() });
    this.saveJSON('invites.json', invites);
    return { guildId, userId, inviterId, inviteCode };
  }

  async getInviteCount(guildId, inviterId) {
    const invites = this.loadJSON('invites.json', {});
    const guildInvites = invites[guildId] || [];
    return guildInvites.filter(i => i.inviterId === inviterId).length;
  }

  async getInviteLeaderboard(guildId, limit = 10) {
    const invites = this.loadJSON('invites.json', {});
    const guildInvites = invites[guildId] || [];
    const counts = {};
    guildInvites.forEach(i => {
      if (i.inviterId) {
        counts[i.inviterId] = (counts[i.inviterId] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([inviter_id, invite_count]) => ({ inviter_id, invite_count }))
      .sort((a, b) => b.invite_count - a.invite_count)
      .slice(0, limit);
  }
}

const storage = db ? new DatabaseStorage() : new JSONStorage();

module.exports = { storage };
