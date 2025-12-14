const { db } = require('./db');
const { eq, and, desc, sql, lte } = require('drizzle-orm');
const { guilds, warnings, modCases, customCommands, reactionRoles, giveaways, reminders, afkUsers, userLevels, levelRewards, scheduledMessages } = require('../../shared/schema');
const fs = require('fs');
const path = require('path');

class DatabaseStorage {
  async getGuild(guildId) {
    if (!db) return null;
    const [guild] = await db.select().from(guilds).where(eq(guilds.id, guildId));
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
    return this.getGuild(guildId);
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
}

const storage = db ? new DatabaseStorage() : new JSONStorage();

module.exports = { storage };
