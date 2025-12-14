const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const cors = require('cors');
const path = require('path');
const { storage } = require('../database/storage');

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'publisher-bot-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

app.use(passport.initialize());
app.use(passport.session());

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const CALLBACK_URL = process.env.REPLIT_DEV_DOMAIN 
  ? `https://${process.env.REPLIT_DEV_DOMAIN}/auth/discord/callback`
  : 'http://localhost:5000/auth/discord/callback';

let discordAuthEnabled = false;

if (DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET) {
  passport.use('discord', new DiscordStrategy({
    clientID: DISCORD_CLIENT_ID,
    clientSecret: DISCORD_CLIENT_SECRET,
    callbackURL: CALLBACK_URL,
    scope: ['identify', 'guilds']
  }, (accessToken, refreshToken, profile, done) => {
    profile.accessToken = accessToken;
    return done(null, profile);
  }));
  discordAuthEnabled = true;
  console.log('Discord OAuth configured with callback:', CALLBACK_URL);
} else {
  console.log('Discord OAuth not configured - missing DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET');
}

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

function hasManagerAccess(req, guildId) {
  const userGuilds = req.user?.guilds || [];
  return userGuilds.some(g => g.id === guildId && (parseInt(g.permissions) & 0x20) === 0x20);
}

function requireManagerAccess(req, res, next) {
  const { guildId } = req.params;
  if (!hasManagerAccess(req, guildId)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
}

function validateInput(rules) {
  return (req, res, next) => {
    for (const [field, validation] of Object.entries(rules)) {
      const value = req.body[field];
      if (validation.required && (value === undefined || value === null || value === '')) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
      if (value !== undefined && value !== null) {
        if (validation.type === 'string' && typeof value !== 'string') {
          return res.status(400).json({ error: `Invalid type for ${field}: expected string` });
        }
        if (validation.type === 'number' && typeof value !== 'number') {
          return res.status(400).json({ error: `Invalid type for ${field}: expected number` });
        }
        if (validation.maxLength && typeof value === 'string' && value.length > validation.maxLength) {
          return res.status(400).json({ error: `${field} exceeds maximum length of ${validation.maxLength}` });
        }
        if (validation.minLength && typeof value === 'string' && value.length < validation.minLength) {
          return res.status(400).json({ error: `${field} must be at least ${validation.minLength} characters` });
        }
        if (validation.min !== undefined && typeof value === 'number' && value < validation.min) {
          return res.status(400).json({ error: `${field} must be at least ${validation.min}` });
        }
        if (validation.max !== undefined && typeof value === 'number' && value > validation.max) {
          return res.status(400).json({ error: `${field} must be at most ${validation.max}` });
        }
      }
    }
    next();
  };
}

let discordClient = null;

function setDiscordClient(client) {
  discordClient = client;
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/auth/discord', (req, res, next) => {
  if (!discordAuthEnabled) {
    return res.status(503).json({ error: 'Discord OAuth not configured' });
  }
  passport.authenticate('discord')(req, res, next);
});

app.get('/auth/discord/callback', (req, res, next) => {
  if (!discordAuthEnabled) {
    return res.redirect('/');
  }
  passport.authenticate('discord', { failureRedirect: '/' })(req, res, () => {
    res.redirect('/dashboard');
  });
});

app.get('/auth/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

app.get('/api/user', isAuthenticated, (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    avatar: req.user.avatar,
    discriminator: req.user.discriminator
  });
});

app.get('/api/guilds', isAuthenticated, (req, res) => {
  const userGuilds = req.user.guilds || [];
  const botGuilds = discordClient ? Array.from(discordClient.guilds.cache.keys()) : [];
  
  const managableGuilds = userGuilds.filter(g => {
    const hasPermission = (parseInt(g.permissions) & 0x20) === 0x20;
    const botInGuild = botGuilds.includes(g.id);
    return hasPermission && botInGuild;
  }).map(g => ({
    id: g.id,
    name: g.name,
    icon: g.icon
  }));
  
  res.json(managableGuilds);
});

app.get('/api/guild/:guildId', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;
  
  const guild = discordClient?.guilds.cache.get(guildId);
  if (!guild) {
    return res.status(404).json({ error: 'Guild not found' });
  }
  
  const guildData = await storage.getGuild(guildId) || {};
  
  res.json({
    id: guild.id,
    name: guild.name,
    icon: guild.iconURL(),
    memberCount: guild.memberCount,
    channels: guild.channels.cache
      .filter(c => c.type === 0)
      .map(c => ({ id: c.id, name: c.name })),
    roles: guild.roles.cache
      .filter(r => r.id !== guild.id)
      .map(r => ({ id: r.id, name: r.name, color: r.hexColor }))
      .sort((a, b) => b.position - a.position),
    settings: guildData
  });
});

app.post('/api/guild/:guildId/settings', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;
  const settings = req.body;
  
  try {
    await storage.upsertGuild(guildId, settings);
    res.json({ success: true });
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

app.get('/api/guild/:guildId/commands', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;
  
  try {
    const commands = await storage.getCustomCommands(guildId);
    res.json(commands);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get commands' });
  }
});

app.post('/api/guild/:guildId/commands', isAuthenticated, requireManagerAccess, validateInput({
  name: { required: true, type: 'string', minLength: 1, maxLength: 32 },
  response: { required: true, type: 'string', minLength: 1, maxLength: 2000 }
}), async (req, res) => {
  const { guildId } = req.params;
  const { name, response } = req.body;
  
  try {
    await storage.addCustomCommand(guildId, name, response, req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add command' });
  }
});

app.delete('/api/guild/:guildId/commands/:name', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId, name } = req.params;
  
  try {
    await storage.deleteCustomCommand(guildId, name);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete command' });
  }
});

app.get('/api/guild/:guildId/cases', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;
  
  try {
    const cases = await storage.getModCases(guildId, 50);
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get mod cases' });
  }
});

app.get('/api/guild/:guildId/warnings/:userId', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId, userId } = req.params;
  
  try {
    const warnings = await storage.getWarnings(guildId, userId);
    res.json(warnings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get warnings' });
  }
});

app.get('/api/status', (req, res) => {
  res.json({
    online: discordClient?.isReady() || false,
    guilds: discordClient?.guilds.cache.size || 0,
    users: discordClient?.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0) || 0,
    uptime: discordClient?.uptime || 0
  });
});

app.get('/api/invite', (req, res) => {
  const clientId = DISCORD_CLIENT_ID;
  if (!clientId) {
    return res.status(503).json({ error: 'Bot client ID not configured' });
  }
  const permissions = '8';
  const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=bot%20applications.commands`;
  res.json({ url: inviteUrl });
});

app.get('/api/guild/:guildId/logconfig', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;
  
  try {
    const guildData = await storage.getGuild(guildId);
    res.json(guildData?.logConfig || {});
  } catch (error) {
    res.status(500).json({ error: 'Failed to get log config' });
  }
});

app.post('/api/guild/:guildId/logconfig', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;
  const logConfig = req.body;
  
  try {
    await storage.upsertGuild(guildId, { logConfig });
    res.json({ success: true });
  } catch (error) {
    console.error('Log config update error:', error);
    res.status(500).json({ error: 'Failed to update log config' });
  }
});

app.get('/api/guild/:guildId/leaderboard', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;
  
  try {
    const leaderboard = await storage.getLeaderboard(guildId, 25);
    
    const enrichedLeaderboard = await Promise.all(leaderboard.map(async (entry) => {
      let username = 'Bilinmeyen Kullanıcı';
      try {
        const member = await discordClient?.guilds.cache.get(guildId)?.members.fetch(entry.userId);
        if (member) {
          username = member.user.username;
        }
      } catch (e) {}
      
      const currentLevelXp = Math.floor(100 * Math.pow(entry.level - 1, 1.5));
      const nextLevelXp = Math.floor(100 * Math.pow(entry.level, 1.5));
      
      return {
        ...entry,
        username,
        currentLevelXp,
        nextLevelXp
      };
    }));
    
    res.json(enrichedLeaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

app.get('/api/guild/:guildId/leveling/stats', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;
  
  try {
    const leaderboard = await storage.getLeaderboard(guildId, 1000);
    const levelRewards = await storage.getLevelRewards(guildId);
    
    const totalXp = leaderboard.reduce((sum, u) => sum + (u.xp || 0), 0);
    const activeUsers = leaderboard.length;
    const avgLevel = activeUsers > 0 ? Math.round(leaderboard.reduce((sum, u) => sum + (u.level || 1), 0) / activeUsers) : 0;
    
    res.json({
      totalXp,
      activeUsers,
      avgLevel,
      levelRoles: levelRewards.length
    });
  } catch (error) {
    console.error('Leveling stats error:', error);
    res.status(500).json({ error: 'Failed to get leveling stats' });
  }
});

app.get('/api/guild/:guildId/levelrewards', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;
  
  try {
    const rewards = await storage.getLevelRewards(guildId);
    res.json(rewards);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get level rewards' });
  }
});

app.post('/api/guild/:guildId/levelrewards', isAuthenticated, requireManagerAccess, validateInput({
  level: { required: true, type: 'number', min: 1, max: 100 },
  roleId: { required: true, type: 'string', minLength: 1 }
}), async (req, res) => {
  const { guildId } = req.params;
  const { level, roleId } = req.body;
  
  try {
    await storage.addLevelReward(guildId, level, roleId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add level reward' });
  }
});

app.delete('/api/guild/:guildId/levelrewards/:level', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId, level } = req.params;
  
  try {
    await storage.removeLevelReward(guildId, parseInt(level));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove level reward' });
  }
});

app.get('/api/guild/:guildId/scheduledmessages', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;
  
  try {
    const messages = await storage.getScheduledMessages(guildId);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get scheduled messages' });
  }
});

app.post('/api/guild/:guildId/scheduledmessages', isAuthenticated, requireManagerAccess, validateInput({
  channelId: { required: true, type: 'string', minLength: 1 },
  message: { required: true, type: 'string', minLength: 1, maxLength: 2000 },
  intervalMinutes: { required: true, type: 'number', min: 1, max: 10080 }
}), async (req, res) => {
  const { guildId } = req.params;
  const { channelId, message, intervalMinutes } = req.body;
  
  try {
    await storage.addScheduledMessage(guildId, channelId, message, intervalMinutes, req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add scheduled message' });
  }
});

app.delete('/api/guild/:guildId/scheduledmessages/:id', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId, id } = req.params;
  
  try {
    await storage.deleteScheduledMessage(parseInt(id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete scheduled message' });
  }
});

app.get('/api/guild/:guildId/reactionroles', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;
  
  try {
    const roles = await storage.getReactionRoles(guildId);
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get reaction roles' });
  }
});

app.post('/api/guild/:guildId/reactionroles', isAuthenticated, requireManagerAccess, validateInput({
  channelId: { required: true, type: 'string', minLength: 1 },
  messageId: { required: true, type: 'string', minLength: 1 },
  emoji: { required: true, type: 'string', minLength: 1, maxLength: 64 },
  roleId: { required: true, type: 'string', minLength: 1 }
}), async (req, res) => {
  const { guildId } = req.params;
  const { channelId, messageId, emoji, roleId } = req.body;
  
  try {
    await storage.addReactionRole(guildId, channelId, messageId, emoji, roleId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add reaction role' });
  }
});

app.delete('/api/guild/:guildId/reactionroles/:id', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId, id } = req.params;
  
  try {
    await storage.deleteReactionRole(parseInt(id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete reaction role' });
  }
});

app.get('/api/guild/:guildId/giveaways', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;
  
  try {
    const giveaways = await storage.getActiveGiveaways();
    res.json(giveaways.filter(g => g.guildId === guildId));
  } catch (error) {
    res.status(500).json({ error: 'Failed to get giveaways' });
  }
});

app.get('/api/guild/:guildId/social', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;
  const { platform } = req.query;
  
  try {
    const notifications = await storage.getSocialNotifications(guildId, platform);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get social notifications' });
  }
});

app.post('/api/guild/:guildId/social', isAuthenticated, requireManagerAccess, validateInput({
  platform: { required: true, type: 'string', minLength: 1, maxLength: 32 },
  username: { required: true, type: 'string', minLength: 1, maxLength: 100 },
  channelId: { required: true, type: 'string', minLength: 1 },
  customMessage: { type: 'string', maxLength: 2000 }
}), async (req, res) => {
  const { guildId } = req.params;
  const { platform, username, channelId, customMessage } = req.body;
  
  try {
    await storage.addSocialNotification(guildId, platform, username, channelId, customMessage);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add social notification' });
  }
});

app.delete('/api/guild/:guildId/social/:id', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId, id } = req.params;
  
  try {
    await storage.deleteSocialNotification(parseInt(id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete social notification' });
  }
});

app.get('/api/guild/:guildId/birthday/config', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;
  
  try {
    const config = await storage.getBirthdayConfig(guildId);
    res.json(config || {});
  } catch (error) {
    res.status(500).json({ error: 'Failed to get birthday config' });
  }
});

app.post('/api/guild/:guildId/birthday/config', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;
  
  try {
    await storage.upsertBirthdayConfig(guildId, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update birthday config' });
  }
});

app.get('/api/guild/:guildId/economy/config', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;
  
  try {
    const config = await storage.getEconomyConfig(guildId);
    res.json(config || {});
  } catch (error) {
    res.status(500).json({ error: 'Failed to get economy config' });
  }
});

app.post('/api/guild/:guildId/economy/config', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;
  
  try {
    await storage.upsertEconomyConfig(guildId, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update economy config' });
  }
});

app.get('/api/guild/:guildId/economy/leaderboard', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;
  
  try {
    const leaderboard = await storage.getEconomyLeaderboard(guildId, 25);
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get economy leaderboard' });
  }
});

app.get('/api/guild/:guildId/shop', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;
  
  try {
    const items = await storage.getShopItems(guildId);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get shop items' });
  }
});

app.post('/api/guild/:guildId/shop', isAuthenticated, requireManagerAccess, validateInput({
  name: { required: true, type: 'string', minLength: 1, maxLength: 64 },
  description: { type: 'string', maxLength: 256 },
  price: { required: true, type: 'number', min: 0 }
}), async (req, res) => {
  const { guildId } = req.params;
  const { name, description, price, roleId, stock } = req.body;
  
  try {
    await storage.addShopItem(guildId, name, description, price, roleId, stock);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add shop item' });
  }
});

app.delete('/api/guild/:guildId/shop/:id', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId, id } = req.params;
  
  try {
    await storage.deleteShopItem(parseInt(id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete shop item' });
  }
});

app.get('/api/guild/:guildId/tickets/config', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;
  
  try {
    const config = await storage.getTicketConfig(guildId);
    res.json(config || {});
  } catch (error) {
    res.status(500).json({ error: 'Failed to get ticket config' });
  }
});

app.post('/api/guild/:guildId/tickets/config', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;
  
  try {
    await storage.upsertTicketConfig(guildId, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update ticket config' });
  }
});

app.get('/api/guild/:guildId/tickets', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;
  const { status } = req.query;
  
  try {
    const tickets = await storage.getTickets(guildId, status);
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tickets' });
  }
});

app.get('/api/guild/:guildId/invites/leaderboard', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;
  
  try {
    const leaderboard = await storage.getInviteLeaderboard(guildId, 25);
    
    const enrichedLeaderboard = await Promise.all(leaderboard.map(async (entry) => {
      let username = 'Bilinmeyen Kullanıcı';
      try {
        const member = await discordClient?.guilds.cache.get(guildId)?.members.fetch(entry.inviter_id);
        if (member) username = member.user.username;
      } catch (e) {}
      
      return { ...entry, username };
    }));
    
    res.json(enrichedLeaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get invite leaderboard' });
  }
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/dashboard/:guildId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'guild.html'));
});

const PORT = 5000;

function startServer() {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Web dashboard running on port ${PORT}`);
  });
}

module.exports = { app, startServer, setDiscordClient };
