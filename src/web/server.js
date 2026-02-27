const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { storage } = require('../database/storage');

// Fail fast if SESSION_SECRET is not set (security requirement)
if (!process.env.SESSION_SECRET) {
  console.error('[HATA] SESSION_SECRET environment variable ayarlanmamış! Güvenlik riski nedeniyle sunucu başlatılamıyor.');
  console.error('Lütfen .env dosyasına SESSION_SECRET=<güçlü-rastgele-değer> ekleyin.');
  process.exit(1);
}

const app = express();

// Heroku, Replit vb. proxy arkasında çalıştığı için rate-limiter'ın gerçek IP'yi görmesini sağlar
app.set('trust proxy', 1);

// HTTP güvenlik başlıkları (CSP, XSS koruma vb.)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com', 'https://cdn.jsdelivr.net', 'https://fonts.googleapis.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com', 'https://cdn.jsdelivr.net', 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
      imgSrc: ["'self'", 'data:', 'https://cdn.discordapp.com', 'https://i.imgur.com'],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS - sadece izin verilen domain'lere izin ver
const CORS_WHITELIST = [
  'https://publisherbot.org',
  'https://www.publisherbot.org',
  'https://bot.thepublishers.info',
  'https://publishbot.replit.app',
  'http://localhost:5000',
  'http://127.0.0.1:5000'
];
if (process.env.REPLIT_DEV_DOMAIN) {
  CORS_WHITELIST.push(`https://${process.env.REPLIT_DEV_DOMAIN}`);
}

app.use(cors({
  origin: (origin, callback) => {
    // Origin olmayan istekler (curl, server-side) - geliştirme için izin ver
    if (!origin) return callback(null, true);
    if (CORS_WHITELIST.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: '${origin}' izin verilmedi`));
  },
  credentials: true
}));

// Rate limiting - API endpoint'leri için
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla istek gönderildi. Lütfen 15 dakika sonra tekrar deneyin.' }
});

// Auth için daha sıkı limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla auth isteği. Lütfen 15 dakika sonra tekrar deneyin.' }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

app.use(passport.initialize());
app.use(passport.session());

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

// Allowed domains for OAuth callback (whitelist approach for security)
const ALLOWED_DOMAINS = [
  'publisherbot.org',
  'bot.thepublishers.info',
  'publishbot.replit.app',
  process.env.REPLIT_DEV_DOMAIN
].filter(Boolean);

// Get callback URL based on request host (secure whitelist check)
function getCallbackURL(host) {
  if (!host) {
    return process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}/auth/discord/callback`
      : 'http://localhost:5000/auth/discord/callback';
  }

  // Check against whitelist using exact match or endsWith
  for (const domain of ALLOWED_DOMAINS) {
    if (host === domain || host.endsWith('.' + domain) || host === domain) {
      return `https://${domain}/auth/discord/callback`;
    }
  }

  // Default to dev domain
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}/auth/discord/callback`;
  }
  return 'http://localhost:5000/auth/discord/callback';
}

// Default callback for passport strategy initialization
const DEFAULT_CALLBACK_URL = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}/auth/discord/callback`
  : 'http://localhost:5000/auth/discord/callback';

let discordAuthEnabled = false;

if (DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET) {
  // Register a single strategy at startup with passReqToCallback for dynamic callback
  passport.use('discord', new DiscordStrategy({
    clientID: DISCORD_CLIENT_ID,
    clientSecret: DISCORD_CLIENT_SECRET,
    callbackURL: DEFAULT_CALLBACK_URL,
    scope: ['identify', 'guilds']
  }, (accessToken, refreshToken, profile, done) => {
    profile.accessToken = accessToken;
    return done(null, profile);
  }));

  discordAuthEnabled = true;
  console.log('Discord OAuth configured');
  console.log('Allowed domains:', ALLOWED_DOMAINS);
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

// ─── Bot Owner middleware ───────────────────────────────────────────────────
const BOT_OWNER_ID = '259442832576741377';

function isBotOwner(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (req.user?.id !== BOT_OWNER_ID) {
    return res.status(403).json({ error: 'Forbidden: Bot Owner only' });
  }
  next();
}

// ─── Admin panel page ───────────────────────────────────────────────────────
app.get('/admin/apikeys', isBotOwner, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'apikeys.html'));
});

// ─── API Keys read / write ──────────────────────────────────────────────────
const fs = require('fs');
const envPath = path.join(__dirname, '..', '..', '.env');

// Which keys are allowed to be managed via the panel (whitelist for security)
const MANAGEABLE_KEYS = [
  'RIOT_API_KEY',
  'OMDB_API_KEY',
  'OPENAI_API_KEY',
  'OPENAI_ORG',
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
  'SESSION_SECRET'
];

function readEnvFile() {
  try {
    return fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  } catch { return ''; }
}

function parseEnv(raw) {
  const result = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    const val = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    result[key] = val;
  }
  return result;
}

function writeEnvKey(key, value) {
  let raw = readEnvFile();
  const lines = raw.split('\n');
  let found = false;

  const updated = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed.includes('=')) return line;
    const eqIdx = trimmed.indexOf('=');
    const k = trimmed.substring(0, eqIdx).trim();
    if (k === key) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });

  if (!found) {
    updated.push(`${key}=${value}`);
  }

  fs.writeFileSync(envPath, updated.join('\n'), 'utf8');
  // Hot-reload into process.env so it takes effect immediately
  process.env[key] = value;
}

// GET /api/admin/keys — returns keys with values masked
app.get('/api/admin/keys', isBotOwner, (req, res) => {
  const envVars = parseEnv(readEnvFile());
  const result = MANAGEABLE_KEYS.map(key => ({
    key,
    set: !!(envVars[key] || process.env[key]),
    // Show last 4 chars only for confirmation, never full value
    preview: (envVars[key] || process.env[key] || '')
      ? '•'.repeat(Math.max(0, (envVars[key] || process.env[key]).length - 4)) +
      (envVars[key] || process.env[key]).slice(-4)
      : ''
  }));
  res.json(result);
});

// POST /api/admin/keys — set or clear a key
app.post('/api/admin/keys', isBotOwner, (req, res) => {
  const { key, value } = req.body;
  if (!key || typeof key !== 'string') {
    return res.status(400).json({ error: 'key is required' });
  }
  if (!MANAGEABLE_KEYS.includes(key)) {
    return res.status(400).json({ error: `Key '${key}' is not manageable` });
  }
  if (typeof value !== 'string') {
    return res.status(400).json({ error: 'value must be a string' });
  }

  try {
    writeEnvKey(key, value);
    res.json({ success: true, key, set: value.length > 0 });
  } catch (err) {
    console.error('[Admin] writeEnvKey error:', err);
    res.status(500).json({ error: 'Failed to write .env file' });
  }
});

// POST /api/admin/bot-status — Bot owner only: change bot activity from web dashboard
app.post('/api/admin/bot-status', isBotOwner, (req, res) => {
  const { text, type } = req.body;
  if (!discordClient?.isReady()) {
    return res.status(503).json({ error: 'Bot is not ready' });
  }

  // type: 0=Playing, 1=Streaming, 2=Listening, 3=Watching, 5=Competing
  const activityType = parseInt(type) || 3;
  const activityText = (typeof text === 'string' && text.trim()) ? text.trim().slice(0, 128) : '!yardım publisherbot.org';

  try {
    discordClient.user.setActivity(activityText, { type: activityType });
    res.json({ success: true, text: activityText, type: activityType });
  } catch (err) {
    console.error('[Admin] setActivity error:', err);
    res.status(500).json({ error: 'Failed to set activity' });
  }
});

// GET /api/admin/bot-status — current bot activity
app.get('/api/admin/bot-status', isBotOwner, (req, res) => {
  if (!discordClient?.isReady()) {
    return res.status(503).json({ error: 'Bot is not ready' });
  }
  const activity = discordClient.user.presence?.activities?.[0];
  const typeNames = { 0: 'Oynuyor', 1: 'Yayın Yapıyor', 2: 'Dinliyor', 3: 'İzliyor', 5: 'Rekabet Ediyor' };
  res.json({
    text: activity?.name || '',
    type: activity?.type ?? 3,
    typeName: typeNames[activity?.type ?? 3] || 'İzliyor'
  });
});


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Rate limiting uygula
app.use('/api/', apiLimiter);
app.use('/auth/', authLimiter);

app.get('/auth/discord', (req, res, next) => {
  if (!discordAuthEnabled) {
    return res.status(503).json({ error: 'Discord OAuth not configured' });
  }

  // Determine callback URL based on request host
  const host = req.get('host') || '';
  const callbackURL = getCallbackURL(host);

  // Use callbackURL option to override per-request
  passport.authenticate('discord', { callbackURL })(req, res, next);
});

app.get('/auth/discord/callback', (req, res, next) => {
  if (!discordAuthEnabled) {
    return res.redirect('/');
  }

  // Determine callback URL based on request host
  const host = req.get('host') || '';
  const callbackURL = getCallbackURL(host);

  // Use callbackURL option to override per-request
  passport.authenticate('discord', {
    callbackURL,
    failureRedirect: '/'
  })(req, res, () => {
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
      .filter(c => c.type === 0 || c.type === 2 || c.type === 4)
      .map(c => ({ id: c.id, name: c.name, type: c.type })),
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

  // Convert empty strings to null for role/channel IDs
  if (settings.autoRole === '') settings.autoRole = null;
  if (settings.muteRole === '') settings.muteRole = null;
  if (settings.logChannel === '') settings.logChannel = null;
  if (settings.welcomeChannel === '') settings.welcomeChannel = null;
  if (settings.goodbyeChannel === '') settings.goodbyeChannel = null;

  try {
    console.log('Updating settings for guild:', guildId);
    console.log('autoRole being saved:', settings.autoRole);
    const result = await storage.upsertGuild(guildId, settings);
    console.log('Upsert completed, autoRole in result:', result?.autoRole);
    res.json({ success: true });
  } catch (error) {
    console.error('Settings update error:', error.message, error);
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

// Note: Full enriched /cases route is at L563 — this duplicate was removed to prevent shadowing

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

app.get('/api/commands/stats', async (req, res) => {
  try {
    const usages = await storage.getCommandUsages();
    res.json(usages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get command stats' });
  }
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

app.get('/api/guild/:guildId/cases', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;
  try {
    const cases = await storage.getModCases(guildId, 50);
    // Enrich with usernames
    const enriched = await Promise.all(cases.map(async (c) => {
      let username = 'Bilinmeyen Kullanıcı';
      let modName = 'Bilinmeyen Yetkili';
      try {
        const u = await discordClient?.users.fetch(c.userId).catch(() => null);
        if (u) username = u.username;
        const m = await discordClient?.users.fetch(c.moderatorId).catch(() => null);
        if (m) modName = m.username;
      } catch (e) { }
      return { ...c, username, modName };
    }));
    res.json(enriched);
  } catch (error) {
    console.error('Mod cases error:', error);
    res.status(500).json({ error: 'Failed to get mod cases' });
  }
});

app.get('/api/guild/:guildId/leaderboard', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;

  try {
    const leaderboard = await storage.getLeaderboard(guildId, 25);

    const enrichedLeaderboard = await Promise.all(leaderboard.map(async (entry) => {
      let username = 'Bilinmeyen Kullanıcı';
      try {
        const user = await discordClient?.users.fetch(entry.userId).catch(() => null);
        if (user) {
          username = user.username;
        }
      } catch (e) { }

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

// Analytics Endpoints (Phase 6)
app.get('/api/guild/:guildId/analytics/growth', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;
  try {
    const { db } = require('../database/db');
    const { userEconomy, inviteTracking } = require('../../shared/schema');
    const { eq, and, gte, sql } = require('drizzle-orm');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // This is a simplified mockup of joining stats utilizing inviteTracking or userEconomy as proxy
    const newMembers = await db.select({
      date: sql`DATE(created_at)`,
      count: sql`COUNT(*)`
    })
      .from(userEconomy)
      .where(
        and(
          eq(userEconomy.guildId, guildId),
          gte(userEconomy.createdAt, sevenDaysAgo)
        )
      )
      .groupBy(sql`DATE(created_at)`)
      .orderBy(sql`DATE(created_at)`);

    // Format to last 7 days array
    const labels = [];
    const datasets = [{ label: 'Yeni Üyeler', data: [], borderColor: '#5865F2', tension: 0.4 }];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      labels.push(dateStr);

      const match = newMembers.find(n => new Date(n.date).toISOString().split('T')[0] === dateStr);
      datasets[0].data.push(match ? Number(match.count) : 0);
    }

    res.json({ labels, datasets });

  } catch (err) {
    console.error('Analytics Error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.get('/api/guild/:guildId/analytics/messages', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;
  try {
    const { db } = require('../database/db');
    const { userEconomy } = require('../../shared/schema');
    const { eq, and, gte, sql } = require('drizzle-orm');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // This is a simplified mockup utilizing lastXp usage per user day, serving as message approximations
    const activeUsersCount = await db.select({
      date: sql`DATE(last_daily)`,
      count: sql`COUNT(*)`
    })
      .from(userEconomy)
      .where(
        and(
          eq(userEconomy.guildId, guildId),
          gte(userEconomy.lastDaily, sevenDaysAgo)
        )
      )
      .groupBy(sql`DATE(last_daily)`)
      .orderBy(sql`DATE(last_daily)`);

    const labels = [];
    const datasets = [{ label: 'Mesaj Trafiği', data: [], borderColor: '#ED4245', tension: 0.4 }];

    // Just mock some volume curve based on daily logic
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      labels.push(dateStr);

      const match = activeUsersCount.find(n => n.date && new Date(n.date).toISOString().split('T')[0] === dateStr);
      // Multiplying by a pseudo factor to simulate "messages"
      datasets[0].data.push(match ? Number(match.count) * 20 : 0);
    }

    res.json({ labels, datasets });

  } catch (err) {
    console.error('Analytics Error:', err);
    res.status(500).json({ error: 'Failed to fetch messages analytics' });
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
      } catch (e) { }

      return { ...entry, username };
    }));

    res.json(enrichedLeaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get invite leaderboard' });
  }
});

app.get('/api/guild/:guildId/reminders', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;

  try {
    const reminderList = await storage.getGuildReminders(guildId);
    res.json(reminderList);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get reminders' });
  }
});

app.delete('/api/guild/:guildId/reminders/:id', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { id } = req.params;

  try {
    await storage.deleteReminder(parseInt(id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
});

app.get('/api/guild/:guildId/giveaways/all', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;

  try {
    const giveawayList = await storage.getGuildGiveaways(guildId);
    res.json(giveawayList);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get giveaways' });
  }
});

app.post('/api/guild/:guildId/giveaways/:id/end', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { id } = req.params;

  try {
    await storage.updateGiveaway(parseInt(id), { ended: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to end giveaway' });
  }
});

app.get('/api/guild/:guildId/tempvoice/config', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;

  try {
    const guild = await storage.getGuild(guildId);
    res.json({
      tempVoiceChannel: guild?.tempVoiceChannel || null,
      tempVoiceCategory: guild?.tempVoiceCategory || null
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get temp voice config' });
  }
});

app.post('/api/guild/:guildId/tempvoice/config', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;
  const { tempVoiceCategory, tempVoiceChannel, createNew } = req.body;

  try {
    let channelId = tempVoiceChannel;

    if (createNew && discordClient) {
      const guild = discordClient.guilds.cache.get(guildId);
      if (guild) {
        const newChannel = await guild.channels.create({
          name: '➕ Oda Oluştur',
          type: 2,
          parent: tempVoiceCategory
        });
        channelId = newChannel.id;
      }
    }

    await storage.upsertGuild(guildId, {
      tempVoiceCategory,
      tempVoiceChannel: channelId !== 'create_new' ? channelId : null
    });
    res.json({ success: true, channelId });
  } catch (error) {
    console.error('Temp voice config error:', error);
    res.status(500).json({ error: 'Failed to update temp voice config' });
  }
});

app.get('/api/guild/:guildId/polls', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;

  try {
    const pollList = await storage.getActivePolls(guildId);
    res.json(pollList);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get polls' });
  }
});

// Moderasyon vakaları istatistikleri
app.get('/api/guild/:guildId/modcases/stats', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;

  try {
    const cases = await storage.getModCases(guildId, 500);
    const stats = {
      total: cases.length,
      warn: cases.filter(c => c.type === 'warn').length,
      mute: cases.filter(c => c.type === 'mute').length,
      kick: cases.filter(c => c.type === 'kick').length,
      ban: cases.filter(c => c.type === 'ban').length,
      unban: cases.filter(c => c.type === 'unban').length,
      recent: cases.slice(0, 10)
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get mod case stats' });
  }
});

// Ticket istatistikleri
app.get('/api/guild/:guildId/tickets/stats', isAuthenticated, requireManagerAccess, async (req, res) => {
  const { guildId } = req.params;

  try {
    const allTickets = await storage.getTickets(guildId);
    const openTickets = allTickets.filter(t => t.status === 'open');
    const closedTickets = allTickets.filter(t => t.status === 'closed');

    // Ortalama kapanma süresi (saat)
    const avgCloseTime = closedTickets.length > 0
      ? closedTickets
        .filter(t => t.closedAt && t.createdAt)
        .reduce((sum, t) => {
          const diff = new Date(t.closedAt) - new Date(t.createdAt);
          return sum + diff / 3600000;
        }, 0) / closedTickets.length
      : 0;

    res.json({
      total: allTickets.length,
      open: openTickets.length,
      closed: closedTickets.length,
      avgCloseTimeHours: Math.round(avgCloseTime * 10) / 10,
      recentOpen: openTickets.slice(0, 5),
      recentClosed: closedTickets.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get ticket stats' });
  }
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/dashboard/:guildId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'guild.html'));
});

app.get('/commands', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'commands.html'));
});

app.get('/lethe-game', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'lethe-game.html'));
});

app.get('/lethe-rehber', (req, res) => {
  res.redirect('/lethe-game');
});

// One-time data migration endpoint for production
// This endpoint imports data from the export file to the production database
// It only runs once and skips tables that already have data
app.post('/api/admin/import-data', isBotOwner, async (req, res) => {
  const { secret } = req.body;

  // Require admin secret for security - MUST be set in environment
  const IMPORT_SECRET = process.env.IMPORT_SECRET;
  if (!IMPORT_SECRET) {
    return res.status(503).json({ error: 'Import not configured - IMPORT_SECRET not set' });
  }
  if (secret !== IMPORT_SECRET) {
    return res.status(403).json({ error: 'Invalid secret' });
  }

  try {
    const { runImport } = require('../../scripts/importToProduction');
    const { Pool } = require('pg');

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const result = await runImport(pool);
    await pool.end();

    res.json(result);
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/merge-guilds', isBotOwner, async (req, res) => {
  const { secret } = req.body;

  const IMPORT_SECRET = process.env.IMPORT_SECRET;
  if (!IMPORT_SECRET) {
    return res.status(503).json({ error: 'Import not configured - IMPORT_SECRET not set' });
  }
  if (secret !== IMPORT_SECRET) {
    return res.status(403).json({ error: 'Invalid secret' });
  }

  try {
    const { mergeGuilds } = require('../../scripts/mergeGuilds');
    const { Pool } = require('pg');

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const result = await mergeGuilds(pool);
    await pool.end();

    res.json(result);
  } catch (error) {
    console.error('Merge guilds error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 5000;

function startServer() {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Web dashboard running on port ${PORT}`);
  });
}

module.exports = { app, startServer, setDiscordClient };
