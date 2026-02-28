const { pgTable, serial, text, integer, boolean, timestamp, jsonb } = require('drizzle-orm/pg-core');
const { relations } = require('drizzle-orm');

const guilds = pgTable('guilds', {
  id: text('id').primaryKey(),
  prefix: text('prefix').default('!'),
  welcomeChannel: text('welcome_channel'),
  welcomeMessage: text('welcome_message'),
  logChannel: text('log_channel'), // Legacy global log
  modLogChannel: text('mod_log_channel'), // PHASE 1.2
  memberLogChannel: text('member_log_channel'), // PHASE 1.2
  messageLogChannel: text('message_log_channel'), // PHASE 1.2
  autoRole: text('auto_role'),
  muteRole: text('mute_role'),
  levelRoles: jsonb('level_roles').default({}), // PHASE 2: Level Roles
  modules: jsonb('modules').default({}),
  automodConfig: jsonb('automod_config').default({}),
  autoPunishments: jsonb('auto_punishments').default({}),
  logConfig: jsonb('log_config').default({}),
  antiraidConfig: jsonb('antiraid_config').default({}), // PHASE 1: Anti-Raid
  goodbyeChannel: text('goodbye_channel'),
  goodbyeMessage: text('goodbye_message'),
  verificationRole: text('verification_role'),
  verifiedRole: text('verified_role'),
  ticketCategory: text('ticket_category'),
  ticketSupportRole: text('ticket_support_role'),
  tempVoiceChannel: text('temp_voice_channel'),
  tempVoiceCategory: text('temp_voice_category'),
  modConfig: jsonb('mod_config').default({}),      // Faz 1: Uyarı eşikleri & sona erme
  createdAt: timestamp('created_at').defaultNow()
});

const warnings = pgTable('warnings', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  userId: text('user_id').notNull(),
  moderatorId: text('moderator_id').notNull(),
  reason: text('reason'),
  note: text('note'),                              // Moderatör gizli notu
  points: integer('points').default(1),            // Uyarı puan ağırlığı
  active: boolean('active').default(true),         // Süresi dolunca false
  expiresAt: timestamp('expires_at'),              // null = süresiz
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
  note: text('note'),                              // Moderatör gizli notu
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
const userProfiles = pgTable('user_profiles', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  userId: text('user_id').notNull(),
  biography: text('biography').default('Henüz bir biyografi ayarlanmamış.'),
  title: text('title').default('Acemi'),
  createdAt: timestamp('created_at').defaultNow()
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
  userId: text('user_id').notNull().unique(),
  totalWins: integer('total_wins').default(0),
  totalLosses: integer('total_losses').default(0),
  totalEarned: integer('total_earned').default(0),
  bossKills: integer('boss_kills').default(0),
  gamesPlayed: integer('games_played').default(0)
});

const commandUsage = pgTable('command_usage', {
  commandName: text('command_name').primaryKey(),
  usageCount: integer('usage_count').default(0),
  lastUsedAt: timestamp('last_used_at').defaultNow()
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
  xpReward: integer('xp_reward').default(1),
  season: text('season'),
  regionId: text('region_id'),
  isVipExclusive: boolean('is_vip_exclusive').default(false)
});

const userAnimals = pgTable('user_animals', {
  id: serial('id').primaryKey(),
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
  evolutionLevel: integer('evolution_level').default(0),
  ability: text('ability'),
  trainingLevel: integer('training_level').default(0),
  lastTrained: timestamp('last_trained'),
  equippedWeapon: text('equipped_weapon'),
  equippedArmor: text('equipped_armor'),
  equippedAccessory: text('equipped_accessory'),
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
  visitorId: text('user_id').notNull(),
  itemType: text('item_type').notNull(),
  itemId: text('item_id').notNull(),
  quantity: integer('quantity').default(1),
  equippedCount: integer('equipped_count').default(0),
  isEquipped: boolean('is_equipped').default(false),
  obtainedAt: timestamp('obtained_at').defaultNow()
});

const userLetheProfile = pgTable('user_lethe_profile', {
  id: serial('id').primaryKey(),
  visitorId: text('user_id').notNull().unique(),
  level: integer('level').default(1),
  xp: integer('xp').default(0),
  coins: integer('coins').default(0),
  clanId: text('clan_id'),
  explorationEnergy: integer('exploration_energy').default(100),
  lastEnergyUpdate: timestamp('last_energy_update'),
  currentRegionId: text('current_region_id').default('forest'),
  mapPieces: integer('map_pieces').default(0), // PHASE 7: Hazine Haritası Parçaları
  totalHunts: integer('total_hunts').default(0),
  totalBattles: integer('total_battles').default(0),
  battlesWon: integer('battles_won').default(0),
  bossesKilled: integer('bosses_killed').default(0),
  equippedWeapon: text('equipped_weapon'),
  equippedArmor: text('equipped_armor'),
  equippedAccessory: text('equipped_accessory'),
  activeBoosts: jsonb('active_boosts').default({}),
  lastHunt: timestamp('last_hunt'),
  lastBattle: timestamp('last_battle'),
  lastBoss: timestamp('last_boss'),
  lastPromoDm: timestamp('last_promo_dm'),
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
  rewardXp: integer('reward_xp').default(0), // PHASE 9: XP Reward added
  rewardItem: text('reward_item') // Optional item
});

const userLetheAchievements = pgTable('user_lethe_achievements', {
  id: serial('id').primaryKey(),
  visitorId: text('user_id').notNull(),
  achievementId: text('achievement_id').notNull(),
  unlockedAt: timestamp('unlocked_at').defaultNow(),
  rewardClaimed: boolean('reward_claimed').default(false)
});

// PHASE 9: Koleksiyon Tamamlama Ödülleri
const userLetheCollections = pgTable('user_lethe_collections', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  collectionId: text('collection_id').notNull(), // e.g. 'forest_common', 'all_epic'
  completedAt: timestamp('completed_at').defaultNow()
});

const letheBattles = pgTable('lethe_battles', {
  id: serial('id').primaryKey(),
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

// Lethe Game - Daily/Weekly Quests
const letheQuests = pgTable('lethe_quests', {
  id: serial('id').primaryKey(),
  questId: text('quest_id').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  emoji: text('emoji').notNull(),
  type: text('type').notNull(), // 'daily' or 'weekly'
  requirement: text('requirement').notNull(), // 'hunt', 'battle', 'boss', 'sell', 'rare_catch', 'pvp'
  targetValue: integer('target_value').default(1),
  rewardMoney: integer('reward_money').default(100),
  rewardXp: integer('reward_xp').default(0),
  rewardItem: text('reward_item'),
  rewardItemType: text('reward_item_type'),
  rewardQuantity: integer('reward_quantity').default(1)
});

const userLetheQuests = pgTable('user_lethe_quests', {
  id: serial('id').primaryKey(),
  visitorId: text('user_id').notNull(),
  questId: text('quest_id').notNull(),
  progress: integer('progress').default(0),
  completed: boolean('completed').default(false),
  claimed: boolean('claimed').default(false),
  assignedAt: timestamp('assigned_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  expiresAt: timestamp('expires_at').notNull()
});

// Lethe Game - Daily Rewards & Streak
const letheDaily = pgTable('lethe_daily', {
  id: serial('id').primaryKey(),
  visitorId: text('user_id').notNull().unique(),
  currentStreak: integer('current_streak').default(0),
  longestStreak: integer('longest_streak').default(0),
  lastClaim: timestamp('last_claim'),
  totalClaims: integer('total_claims').default(0),
  createdAt: timestamp('created_at').defaultNow()
});

// Lethe Game - Work System
const letheWork = pgTable('lethe_work', {
  id: serial('id').primaryKey(),
  visitorId: text('user_id').notNull().unique(),
  job: text('job').default('hunter'), // 'hunter', 'trader', 'warrior', 'collector'
  lastWork: timestamp('last_work'),
  totalWorked: integer('total_worked').default(0),
  totalEarned: integer('total_earned').default(0),
  createdAt: timestamp('created_at').defaultNow()
});

// Lethe Game - Evolution Gems
const letheEvolutionGems = pgTable('lethe_evolution_gems', {
  id: serial('id').primaryKey(),
  visitorId: text('user_id').notNull(),
  gemType: text('gem_type').notNull(), // 'common', 'rare', 'epic', 'legendary', 'mythic'
  quantity: integer('quantity').default(0),
  createdAt: timestamp('created_at').defaultNow()
});

// Lethe Game - Abilities
const letheAbilities = pgTable('lethe_abilities', {
  id: serial('id').primaryKey(),
  abilityId: text('ability_id').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  emoji: text('emoji').notNull(),
  rarity: text('rarity').notNull(), // Which rarity animals can have this
  type: text('type').notNull(), // 'passive' or 'active'
  effect: text('effect').notNull(), // 'hunt_bonus', 'battle_damage', 'defense', 'crit', 'heal', 'stun'
  effectValue: integer('effect_value').default(10),
  cooldown: integer('cooldown').default(0) // For active abilities, turns
});

// Lethe Game - Phase 4: Trades (Takas Sistemi)
const letheTrades = pgTable('lethe_trades', {
  id: serial('id').primaryKey(),
  senderId: text('sender_id').notNull(),
  receiverId: text('receiver_id').notNull(),
  senderAnimalId: integer('sender_animal_id'), // userAnimals id
  receiverAnimalId: integer('receiver_animal_id'), // userAnimals id
  senderCoins: integer('sender_coins').default(0),
  receiverCoins: integer('receiver_coins').default(0),
  senderItemType: text('sender_item_type'), // 'weapon', 'armor', 'accessory'
  senderItemId: text('sender_item_id'),
  receiverItemType: text('receiver_item_type'),
  receiverItemId: text('receiver_item_id'),
  status: text('status').default('pending'), // 'pending', 'accepted', 'rejected', 'expired'
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow()
});

// Lethe Game - Phase 4: Gift History (Hediye Geçmişi)
const letheGifts = pgTable('lethe_gifts', {
  id: serial('id').primaryKey(),
  senderId: text('sender_id').notNull(),
  receiverId: text('receiver_id').notNull(),
  giftType: text('gift_type').notNull(), // 'coins', 'animal', 'item'
  animalId: integer('animal_id'), // userAnimals id
  itemType: text('item_type'),
  itemId: text('item_id'),
  coins: integer('coins').default(0),
  message: text('message'),
  createdAt: timestamp('created_at').defaultNow()
});

// Lethe Game - Phase 4: Friends (Arkadaş Sistemi)
const letheFriends = pgTable('lethe_friends', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  friendId: text('friend_id').notNull(),
  status: text('status').default('pending'), // 'pending', 'accepted', 'blocked'
  createdAt: timestamp('created_at').defaultNow()
});

// Lethe Game - Phase 4: Raids (Co-op Boss Raids)
const letheRaids = pgTable('lethe_raids', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  bossId: text('boss_id').notNull(),
  hostId: text('host_id').notNull(),
  participants: jsonb('participants').default([]), // [{userId, damage, animals}]
  bossHp: integer('boss_hp').notNull(),
  currentHp: integer('current_hp').notNull(),
  status: text('status').default('recruiting'), // 'recruiting', 'active', 'completed', 'failed'
  rewards: jsonb('rewards').default({}),
  maxParticipants: integer('max_participants').default(5),
  startsAt: timestamp('starts_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow()
});

// Lethe Game - Phase 4: Leaderboard Cache
const letheLeaderboard = pgTable('lethe_leaderboard', {
  id: serial('id').primaryKey(),
  category: text('category').notNull(), // 'coins', 'level', 'animals', 'battles', 'hunts', 'pvp'
  userId: text('user_id').notNull(),
  value: integer('value').default(0),
  rank: integer('rank'),
  updatedAt: timestamp('updated_at').defaultNow()
});

const letheEvents = pgTable('lethe_events', {
  id: serial('id').primaryKey(),
  eventId: text('event_id').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').notNull(), // 'xp_boost', 'rare_boost', 'gold_boost', 'boss_rush', 'special_hunt', 'community'
  multiplier: integer('multiplier').default(100), // Percentage (100 = normal, 200 = 2x)
  bonusData: jsonb('bonus_data').default({}), // Extra event data (special animals, etc)
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  isActive: boolean('is_active').default(true),
  isRecurring: boolean('is_recurring').default(false), // Weekend events etc
  recurringPattern: text('recurring_pattern'), // 'weekend', 'daily', 'monthly'
  createdAt: timestamp('created_at').defaultNow()
});

const letheCommunityGoals = pgTable('lethe_community_goals', {
  id: serial('id').primaryKey(),
  goalId: text('goal_id').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  targetType: text('target_type').notNull(), // 'hunts', 'battles', 'boss_kills', 'trades', 'gold_spent'
  targetValue: integer('target_value').notNull(),
  currentValue: integer('current_value').default(0),
  rewardCoins: integer('reward_coins').default(0),
  rewardGems: integer('reward_gems').default(0),
  rewardAnimalId: text('reward_animal_id'), // Special animal reward
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  isCompleted: boolean('is_completed').default(false),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow()
});

const letheEventParticipation = pgTable('lethe_event_participation', {
  id: serial('id').primaryKey(),
  eventId: text('event_id').notNull(),
  goalId: text('goal_id'),
  userId: text('user_id').notNull(),
  contribution: integer('contribution').default(0),
  rewardClaimed: boolean('reward_claimed').default(false),
  participatedAt: timestamp('participated_at').defaultNow()
});

const letheClans = pgTable('lethe_clans', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  leaderId: text('leader_id').notNull(),
  level: integer('level').default(1),
  xp: integer('xp').default(0),
  coins: integer('coins').default(0),
  createdAt: timestamp('created_at').defaultNow()
});

const letheClanMembers = pgTable('lethe_clan_members', {
  id: serial('id').primaryKey(),
  clanId: text('clan_id').notNull(),
  userId: text('user_id').notNull(),
  role: text('role').notNull().default('member'),
  contributionCoins: integer('contribution_coins').default(0),
  contributionXp: integer('contribution_xp').default(0),
  joinedAt: timestamp('joined_at').defaultNow()
});

// --- KEŞİF SİSTEMİ (PHASE 7) ---
const letheRegions = pgTable('lethe_regions', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  emoji: text('emoji').notNull(),
  requiredLevel: integer('required_level').default(1),
  energyCost: integer('energy_cost').default(10),
  isEventRegion: boolean('is_event_region').default(false)
});

// --- FAZ 3: OTOMASYON & WEBHOOK ---
const automationRules = pgTable('automation_rules', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  name: text('name').notNull(),
  trigger: jsonb('trigger').notNull(),
  conditions: jsonb('conditions').default([]),
  actions: jsonb('actions').notNull(),
  enabled: boolean('enabled').default(true),
  priority: integer('priority').default(0),
  createdAt: timestamp('created_at').defaultNow()
});

const webhookReceivers = pgTable('webhook_receivers', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  name: text('name').notNull(),
  channelId: text('channel_id').notNull(),
  key: text('key').notNull().unique(),
  template: text('template'),
  enabled: boolean('enabled').default(true),
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
  commandUsage,
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
  userLetheCollections,
  letheBattles,
  letheQuests,
  userLetheQuests,
  letheDaily,
  letheWork,
  letheEvolutionGems,
  letheAbilities,
  letheTrades,
  letheGifts,
  letheFriends,
  letheRaids,
  letheLeaderboard,
  letheEvents,
  letheCommunityGoals,
  letheEventParticipation,
  letheClans,
  letheClanMembers,
  letheRegions,
  userProfiles,
  // Faz 3
  automationRules,
  webhookReceivers
};
