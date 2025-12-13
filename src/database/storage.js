const { db } = require('./db');
const { eq, and, desc, sql } = require('drizzle-orm');
const { guilds, warnings, modCases, customCommands, reactionRoles, giveaways, reminders, afkUsers } = require('../../shared/schema');
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
}

const storage = db ? new DatabaseStorage() : new JSONStorage();

module.exports = { storage };
