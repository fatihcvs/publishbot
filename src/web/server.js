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

app.get('/api/guild/:guildId', isAuthenticated, async (req, res) => {
  const { guildId } = req.params;
  
  const userGuilds = req.user.guilds || [];
  const hasAccess = userGuilds.some(g => g.id === guildId && (parseInt(g.permissions) & 0x20) === 0x20);
  
  if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
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

app.post('/api/guild/:guildId/settings', isAuthenticated, async (req, res) => {
  const { guildId } = req.params;
  const settings = req.body;
  
  const userGuilds = req.user.guilds || [];
  const hasAccess = userGuilds.some(g => g.id === guildId && (parseInt(g.permissions) & 0x20) === 0x20);
  
  if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  try {
    await storage.upsertGuild(guildId, settings);
    res.json({ success: true });
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

app.get('/api/guild/:guildId/commands', isAuthenticated, async (req, res) => {
  const { guildId } = req.params;
  
  try {
    const commands = await storage.getCustomCommands(guildId);
    res.json(commands);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get commands' });
  }
});

app.post('/api/guild/:guildId/commands', isAuthenticated, async (req, res) => {
  const { guildId } = req.params;
  const { name, response } = req.body;
  
  try {
    await storage.addCustomCommand(guildId, name, response, req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add command' });
  }
});

app.delete('/api/guild/:guildId/commands/:name', isAuthenticated, async (req, res) => {
  const { guildId, name } = req.params;
  
  try {
    await storage.deleteCustomCommand(guildId, name);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete command' });
  }
});

app.get('/api/guild/:guildId/cases', isAuthenticated, async (req, res) => {
  const { guildId } = req.params;
  
  try {
    const cases = await storage.getModCases(guildId, 50);
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get mod cases' });
  }
});

app.get('/api/guild/:guildId/warnings/:userId', isAuthenticated, async (req, res) => {
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

app.get('/api/guild/:guildId/logconfig', isAuthenticated, async (req, res) => {
  const { guildId } = req.params;
  
  try {
    const guildData = await storage.getGuild(guildId);
    res.json(guildData?.logConfig || {});
  } catch (error) {
    res.status(500).json({ error: 'Failed to get log config' });
  }
});

app.post('/api/guild/:guildId/logconfig', isAuthenticated, async (req, res) => {
  const { guildId } = req.params;
  const logConfig = req.body;
  
  const userGuilds = req.user.guilds || [];
  const hasAccess = userGuilds.some(g => g.id === guildId && (parseInt(g.permissions) & 0x20) === 0x20);
  
  if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  try {
    await storage.upsertGuild(guildId, { logConfig });
    res.json({ success: true });
  } catch (error) {
    console.error('Log config update error:', error);
    res.status(500).json({ error: 'Failed to update log config' });
  }
});

app.get('/api/guild/:guildId/leaderboard', isAuthenticated, async (req, res) => {
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

app.get('/api/guild/:guildId/leveling/stats', isAuthenticated, async (req, res) => {
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

app.get('/api/guild/:guildId/levelrewards', isAuthenticated, async (req, res) => {
  const { guildId } = req.params;
  
  try {
    const rewards = await storage.getLevelRewards(guildId);
    res.json(rewards);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get level rewards' });
  }
});

app.post('/api/guild/:guildId/levelrewards', isAuthenticated, async (req, res) => {
  const { guildId } = req.params;
  const { level, roleId } = req.body;
  
  const userGuilds = req.user.guilds || [];
  const hasAccess = userGuilds.some(g => g.id === guildId && (parseInt(g.permissions) & 0x20) === 0x20);
  
  if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  try {
    await storage.addLevelReward(guildId, level, roleId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add level reward' });
  }
});

app.delete('/api/guild/:guildId/levelrewards/:level', isAuthenticated, async (req, res) => {
  const { guildId, level } = req.params;
  
  const userGuilds = req.user.guilds || [];
  const hasAccess = userGuilds.some(g => g.id === guildId && (parseInt(g.permissions) & 0x20) === 0x20);
  
  if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  try {
    await storage.removeLevelReward(guildId, parseInt(level));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove level reward' });
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
