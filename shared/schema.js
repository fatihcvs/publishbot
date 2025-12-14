const { pgTable, serial, text, integer, boolean, timestamp, jsonb } = require('drizzle-orm/pg-core');
const { relations } = require('drizzle-orm');

const guilds = pgTable('guilds', {
  id: text('id').primaryKey(),
  prefix: text('prefix').default('!'),
  welcomeChannel: text('welcome_channel'),
  welcomeMessage: text('welcome_message'),
  logChannel: text('log_channel'),
  autoRole: text('auto_role'),
  muteRole: text('mute_role'),
  modules: jsonb('modules').default({}),
  automodConfig: jsonb('automod_config').default({}),
  autoPunishments: jsonb('auto_punishments').default({}),
  logConfig: jsonb('log_config').default({}),
  createdAt: timestamp('created_at').defaultNow()
});

const warnings = pgTable('warnings', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  userId: text('user_id').notNull(),
  moderatorId: text('moderator_id').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow()
});

const modCases = pgTable('mod_cases', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  caseNumber: integer('case_number').notNull(),
  type: text('type').notNull(),
  userId: text('user_id').notNull(),
  moderatorId: text('moderator_id').notNull(),
  reason: text('reason'),
  duration: integer('duration'),
  createdAt: timestamp('created_at').defaultNow()
});

const customCommands = pgTable('custom_commands', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  name: text('name').notNull(),
  response: text('response').notNull(),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow()
});

const reactionRoles = pgTable('reaction_roles', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  channelId: text('channel_id').notNull(),
  messageId: text('message_id').notNull(),
  emoji: text('emoji').notNull(),
  roleId: text('role_id').notNull()
});

const giveaways = pgTable('giveaways', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  channelId: text('channel_id').notNull(),
  messageId: text('message_id'),
  prize: text('prize').notNull(),
  winners: integer('winners').default(1),
  endsAt: timestamp('ends_at').notNull(),
  ended: boolean('ended').default(false),
  hostId: text('host_id').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

const reminders = pgTable('reminders', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  channelId: text('channel_id').notNull(),
  guildId: text('guild_id'),
  message: text('message').notNull(),
  remindAt: timestamp('remind_at').notNull(),
  completed: boolean('completed').default(false),
  createdAt: timestamp('created_at').defaultNow()
});

const afkUsers = pgTable('afk_users', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  userId: text('user_id').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow()
});

const userLevels = pgTable('user_levels', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  userId: text('user_id').notNull(),
  xp: integer('xp').default(0),
  level: integer('level').default(0),
  totalMessages: integer('total_messages').default(0),
  lastXpTime: timestamp('last_xp_time').defaultNow(),
  createdAt: timestamp('created_at').defaultNow()
});

const levelRewards = pgTable('level_rewards', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  level: integer('level').notNull(),
  roleId: text('role_id').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

const scheduledMessages = pgTable('scheduled_messages', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  channelId: text('channel_id').notNull(),
  message: text('message').notNull(),
  cronExpression: text('cron_expression'),
  intervalMinutes: integer('interval_minutes'),
  nextRun: timestamp('next_run').notNull(),
  enabled: boolean('enabled').default(true),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow()
});

module.exports = {
  guilds,
  warnings,
  modCases,
  customCommands,
  reactionRoles,
  giveaways,
  reminders,
  afkUsers,
  userLevels,
  levelRewards,
  scheduledMessages
};
