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
  goodbyeChannel: text('goodbye_channel'),
  goodbyeMessage: text('goodbye_message'),
  verificationRole: text('verification_role'),
  verifiedRole: text('verified_role'),
  ticketCategory: text('ticket_category'),
  ticketSupportRole: text('ticket_support_role'),
  tempVoiceChannel: text('temp_voice_channel'),
  tempVoiceCategory: text('temp_voice_category'),
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

const userAchievements = pgTable('user_achievements', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  userId: text('user_id').notNull(),
  achievementId: text('achievement_id').notNull(),
  unlockedAt: timestamp('unlocked_at').defaultNow()
});

const inviteTracking = pgTable('invite_tracking', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  userId: text('user_id').notNull(),
  inviterId: text('inviter_id'),
  inviteCode: text('invite_code'),
  joinedAt: timestamp('joined_at').defaultNow()
});

const socialNotifications = pgTable('social_notifications', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  platform: text('platform').notNull(),
  username: text('username').notNull(),
  channelId: text('channel_id').notNull(),
  customMessage: text('custom_message'),
  lastPostId: text('last_post_id'),
  enabled: boolean('enabled').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

const userBirthdays = pgTable('user_birthdays', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  userId: text('user_id').notNull(),
  day: integer('day').notNull(),
  month: integer('month').notNull(),
  timezone: text('timezone').default('UTC'),
  createdAt: timestamp('created_at').defaultNow()
});

const birthdayConfig = pgTable('birthday_config', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull().unique(),
  channelId: text('channel_id'),
  roleId: text('role_id'),
  message: text('message').default('Doğum günün kutlu olsun {user}! 🎂🎉'),
  enabled: boolean('enabled').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

const userEconomy = pgTable('user_economy', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  userId: text('user_id').notNull(),
  balance: integer('balance').default(0),
  bank: integer('bank').default(0),
  lastDaily: timestamp('last_daily'),
  lastWork: timestamp('last_work'),
  createdAt: timestamp('created_at').defaultNow()
});

const economyConfig = pgTable('economy_config', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull().unique(),
  currencyName: text('currency_name').default('💰'),
  currencySymbol: text('currency_symbol').default('$'),
  dailyAmount: integer('daily_amount').default(100),
  workMinAmount: integer('work_min_amount').default(50),
  workMaxAmount: integer('work_max_amount').default(200),
  enabled: boolean('enabled').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

const shopItems = pgTable('shop_items', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  price: integer('price').notNull(),
  roleId: text('role_id'),
  stock: integer('stock').default(-1),
  createdAt: timestamp('created_at').defaultNow()
});

const tickets = pgTable('tickets', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  channelId: text('channel_id').notNull(),
  userId: text('user_id').notNull(),
  status: text('status').default('open'),
  subject: text('subject'),
  closedBy: text('closed_by'),
  closedAt: timestamp('closed_at'),
  createdAt: timestamp('created_at').defaultNow()
});

const ticketConfig = pgTable('ticket_config', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull().unique(),
  categoryId: text('category_id'),
  supportRoleId: text('support_role_id'),
  welcomeMessage: text('welcome_message').default('Merhaba! Destek ekibimiz en kısa sürede size yardımcı olacaktır.'),
  logChannelId: text('log_channel_id'),
  enabled: boolean('enabled').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

const polls = pgTable('polls', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  channelId: text('channel_id').notNull(),
  messageId: text('message_id'),
  question: text('question').notNull(),
  options: jsonb('options').default([]),
  votes: jsonb('votes').default({}),
  endsAt: timestamp('ends_at'),
  ended: boolean('ended').default(false),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

const tempVoiceChannels = pgTable('temp_voice_channels', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  channelId: text('channel_id').notNull(),
  ownerId: text('owner_id').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

const gameHistory = pgTable('game_history', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  userId: text('user_id').notNull(),
  gameType: text('game_type').notNull(),
  betAmount: integer('bet_amount').default(0),
  winAmount: integer('win_amount').default(0),
  result: text('result'),
  details: jsonb('details').default({}),
  createdAt: timestamp('created_at').defaultNow()
});

const userInventory = pgTable('user_inventory', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  userId: text('user_id').notNull(),
  itemId: text('item_id').notNull(),
  quantity: integer('quantity').default(1),
  acquiredAt: timestamp('acquired_at').defaultNow()
});

const gameItems = pgTable('game_items', {
  id: serial('id').primaryKey(),
  itemId: text('item_id').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  rarity: text('rarity').default('common'),
  type: text('type').notNull(),
  value: integer('value').default(0),
  emoji: text('emoji'),
  sellPrice: integer('sell_price').default(0),
  usable: boolean('usable').default(false)
});

const activeDuels = pgTable('active_duels', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  channelId: text('channel_id').notNull(),
  challengerId: text('challenger_id').notNull(),
  opponentId: text('opponent_id').notNull(),
  betAmount: integer('bet_amount').default(0),
  gameType: text('game_type').notNull(),
  status: text('status').default('pending'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

const dailyStreak = pgTable('daily_streak', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  userId: text('user_id').notNull(),
  currentStreak: integer('current_streak').default(0),
  longestStreak: integer('longest_streak').default(0),
  lastClaim: timestamp('last_claim'),
  createdAt: timestamp('created_at').defaultNow()
});

const jackpotPool = pgTable('jackpot_pool', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull().unique(),
  amount: integer('amount').default(0),
  lastWinner: text('last_winner'),
  lastWinAmount: integer('last_win_amount'),
  lastWinDate: timestamp('last_win_date'),
  createdAt: timestamp('created_at').defaultNow()
});

const userStats = pgTable('user_stats', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  userId: text('user_id').notNull(),
  gamesPlayed: integer('games_played').default(0),
  gamesWon: integer('games_won').default(0),
  gamesLost: integer('games_lost').default(0),
  totalBet: integer('total_bet').default(0),
  totalWon: integer('total_won').default(0),
  totalLost: integer('total_lost').default(0),
  biggestWin: integer('biggest_win').default(0),
  fishCaught: integer('fish_caught').default(0),
  oresMined: integer('ores_mined').default(0),
  animalsHunted: integer('animals_hunted').default(0),
  robberyAttempts: integer('robbery_attempts').default(0),
  robberySuccess: integer('robbery_success').default(0),
  timesRobbed: integer('times_robbed').default(0),
  createdAt: timestamp('created_at').defaultNow()
});

const lootBoxes = pgTable('loot_boxes', {
  id: serial('id').primaryKey(),
  boxId: text('box_id').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  price: integer('price').default(0),
  rarity: text('rarity').default('common'),
  emoji: text('emoji'),
  possibleItems: jsonb('possible_items').default([])
});

const letheAnimals = pgTable('lethe_animals', {
  id: serial('id').primaryKey(),
  animalId: text('animal_id').notNull().unique(),
  name: text('name').notNull(),
  emoji: text('emoji').notNull(),
  rarity: text('rarity').notNull(),
  baseHp: integer('base_hp').default(100),
  baseStr: integer('base_str').default(10),
  baseDef: integer('base_def').default(10),
  baseSpd: integer('base_spd').default(10),
  sellPrice: integer('sell_price').default(5),
  xpReward: integer('xp_reward').default(1)
});

const userAnimals = pgTable('user_animals', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  userId: text('user_id').notNull(),
  animalId: text('animal_id').notNull(),
  nickname: text('nickname'),
  level: integer('level').default(1),
  xp: integer('xp').default(0),
  hp: integer('hp').default(100),
  str: integer('str').default(10),
  def: integer('def').default(10),
  spd: integer('spd').default(10),
  isInTeam: boolean('is_in_team').default(false),
  teamSlot: integer('team_slot'),
  caughtAt: timestamp('caught_at').defaultNow()
});

const letheWeapons = pgTable('lethe_weapons', {
  id: serial('id').primaryKey(),
  weaponId: text('weapon_id').notNull().unique(),
  name: text('name').notNull(),
  emoji: text('emoji').notNull(),
  type: text('type').default('physical'),
  damage: integer('damage').default(10),
  specialEffect: text('special_effect'),
  specialValue: integer('special_value'),
  price: integer('price').default(100),
  rarity: text('rarity').default('common')
});

const letheArmors = pgTable('lethe_armors', {
  id: serial('id').primaryKey(),
  armorId: text('armor_id').notNull().unique(),
  name: text('name').notNull(),
  emoji: text('emoji').notNull(),
  defense: integer('defense').default(5),
  specialEffect: text('special_effect'),
  specialValue: integer('special_value'),
  price: integer('price').default(100),
  rarity: text('rarity').default('common')
});

const letheAccessories = pgTable('lethe_accessories', {
  id: serial('id').primaryKey(),
  accessoryId: text('accessory_id').notNull().unique(),
  name: text('name').notNull(),
  emoji: text('emoji').notNull(),
  effect: text('effect').notNull(),
  effectValue: integer('effect_value').default(5),
  price: integer('price').default(100),
  rarity: text('rarity').default('common')
});

const letheConsumables = pgTable('lethe_consumables', {
  id: serial('id').primaryKey(),
  consumableId: text('consumable_id').notNull().unique(),
  name: text('name').notNull(),
  emoji: text('emoji').notNull(),
  effect: text('effect').notNull(),
  effectValue: integer('effect_value').default(50),
  duration: integer('duration'),
  durationType: text('duration_type'),
  price: integer('price').default(50),
  rarity: text('rarity').default('common')
});

const letheBaits = pgTable('lethe_baits', {
  id: serial('id').primaryKey(),
  baitId: text('bait_id').notNull().unique(),
  name: text('name').notNull(),
  emoji: text('emoji').notNull(),
  catchBonus: integer('catch_bonus').default(5),
  rarityBonus: text('rarity_bonus'),
  uses: integer('uses').default(10),
  price: integer('price').default(100)
});

const letheCrates = pgTable('lethe_crates', {
  id: serial('id').primaryKey(),
  crateId: text('crate_id').notNull().unique(),
  name: text('name').notNull(),
  emoji: text('emoji').notNull(),
  minRarity: text('min_rarity').default('common'),
  maxRarity: text('max_rarity').default('rare'),
  price: integer('price').default(200),
  possibleRewards: jsonb('possible_rewards').default([])
});

const letheBosses = pgTable('lethe_bosses', {
  id: serial('id').primaryKey(),
  bossId: text('boss_id').notNull().unique(),
  name: text('name').notNull(),
  emoji: text('emoji').notNull(),
  hp: integer('hp').default(1000),
  str: integer('str').default(50),
  def: integer('def').default(30),
  rewardMoney: integer('reward_money').default(500),
  rewardRarity: text('reward_rarity').default('rare')
});

const userLetheInventory = pgTable('user_lethe_inventory', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  visitorId: text('user_id').notNull(),
  itemType: text('item_type').notNull(),
  itemId: text('item_id').notNull(),
  quantity: integer('quantity').default(1),
  isEquipped: boolean('is_equipped').default(false),
  obtainedAt: timestamp('obtained_at').defaultNow()
});

const userLetheProfile = pgTable('user_lethe_profile', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  visitorId: text('user_id').notNull(),
  level: integer('level').default(1),
  xp: integer('xp').default(0),
  totalHunts: integer('total_hunts').default(0),
  totalBattles: integer('total_battles').default(0),
  battlesWon: integer('battles_won').default(0),
  bossesKilled: integer('bosses_killed').default(0),
  equippedWeapon: text('equipped_weapon'),
  equippedArmor: text('equipped_armor'),
  equippedAccessory: text('equipped_accessory'),
  activeBoosts: jsonb('active_boosts').default({}),
  lastHunt: timestamp('last_hunt'),
  createdAt: timestamp('created_at').defaultNow()
});

const letheAchievements = pgTable('lethe_achievements', {
  id: serial('id').primaryKey(),
  achievementId: text('achievement_id').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  emoji: text('emoji').notNull(),
  requirement: text('requirement').notNull(),
  requirementValue: integer('requirement_value').default(1),
  rewardMoney: integer('reward_money').default(0),
  rewardItem: text('reward_item')
});

const userLetheAchievements = pgTable('user_lethe_achievements', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  visitorId: text('user_id').notNull(),
  achievementId: text('achievement_id').notNull(),
  unlockedAt: timestamp('unlocked_at').defaultNow()
});

const letheBattles = pgTable('lethe_battles', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  visitorId: text('user_id').notNull(),
  opponentType: text('opponent_type').notNull(),
  opponentId: text('opponent_id'),
  result: text('result'),
  xpEarned: integer('xp_earned').default(0),
  moneyEarned: integer('money_earned').default(0),
  itemDropped: text('item_dropped'),
  battleLog: jsonb('battle_log').default([]),
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
  scheduledMessages,
  userAchievements,
  inviteTracking,
  socialNotifications,
  userBirthdays,
  birthdayConfig,
  userEconomy,
  economyConfig,
  shopItems,
  tickets,
  ticketConfig,
  polls,
  tempVoiceChannels,
  gameHistory,
  userInventory,
  gameItems,
  activeDuels,
  dailyStreak,
  jackpotPool,
  userStats,
  lootBoxes,
  letheAnimals,
  userAnimals,
  letheWeapons,
  letheArmors,
  letheAccessories,
  letheConsumables,
  letheBaits,
  letheCrates,
  letheBosses,
  userLetheInventory,
  userLetheProfile,
  letheAchievements,
  userLetheAchievements,
  letheBattles
};
