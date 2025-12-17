const { db } = require('../database/db');
const { 
  letheAnimals, userAnimals, letheWeapons, letheArmors, letheAccessories,
  letheConsumables, letheBaits, letheCrates, letheBosses, userLetheInventory,
  userLetheProfile, letheAchievements, userLetheAchievements, letheBattles,
  letheQuests, userLetheQuests, letheDaily, letheWork
} = require('../../shared/schema');
const { eq, sql, and, lt, gte } = require('drizzle-orm');
const seedData = require('./seedData');

const rarityChances = {
  common: 0.58,
  uncommon: 0.25,
  rare: 0.10,
  epic: 0.05,
  legendary: 0.015,
  mythic: 0.004,
  hidden: 0.001
};

async function seedDatabase() {
  try {
    const existingAnimals = await db.select().from(letheAnimals).limit(1);
    if (existingAnimals.length > 0) {
      console.log('Lethe Game data already seeded');
      return;
    }

    for (const animal of seedData.animals) {
      await db.insert(letheAnimals).values(animal).onConflictDoNothing();
    }
    for (const weapon of seedData.weapons) {
      await db.insert(letheWeapons).values(weapon).onConflictDoNothing();
    }
    for (const armor of seedData.armors) {
      await db.insert(letheArmors).values(armor).onConflictDoNothing();
    }
    for (const accessory of seedData.accessories) {
      await db.insert(letheAccessories).values(accessory).onConflictDoNothing();
    }
    for (const consumable of seedData.consumables) {
      await db.insert(letheConsumables).values(consumable).onConflictDoNothing();
    }
    for (const bait of seedData.baits) {
      await db.insert(letheBaits).values(bait).onConflictDoNothing();
    }
    for (const crate of seedData.crates) {
      await db.insert(letheCrates).values(crate).onConflictDoNothing();
    }
    for (const boss of seedData.bosses) {
      await db.insert(letheBosses).values(boss).onConflictDoNothing();
    }
    for (const achievement of seedData.achievements) {
      await db.insert(letheAchievements).values(achievement).onConflictDoNothing();
    }

    console.log('Lethe Game data seeded successfully!');
  } catch (error) {
    console.error('Error seeding Lethe Game data:', error);
  }
}

async function getOrCreateProfile(userId) {
  let profile = await db.select().from(userLetheProfile)
    .where(eq(userLetheProfile.visitorId, userId))
    .limit(1);

  if (profile.length === 0) {
    await db.insert(userLetheProfile).values({ visitorId: userId });
    profile = await db.select().from(userLetheProfile)
      .where(eq(userLetheProfile.visitorId, userId))
      .limit(1);
  }

  return profile[0];
}

async function addCoins(userId, amount) {
  await getOrCreateProfile(userId);
  await db.update(userLetheProfile)
    .set({ coins: sql`${userLetheProfile.coins} + ${amount}` })
    .where(eq(userLetheProfile.visitorId, userId));
}

async function addBattleReward(userId, xpAmount, moneyAmount, won, isBoss = false) {
  await getOrCreateProfile(userId);
  
  const updateData = {
    totalBattles: sql`${userLetheProfile.totalBattles} + 1`,
    xp: sql`${userLetheProfile.xp} + ${xpAmount}`
  };
  
  if (won) {
    updateData.battlesWon = sql`${userLetheProfile.battlesWon} + 1`;
  }
  
  if (isBoss && won) {
    updateData.bossesKilled = sql`${userLetheProfile.bossesKilled} + 1`;
  }
  
  await db.update(userLetheProfile)
    .set(updateData)
    .where(eq(userLetheProfile.visitorId, userId));

  if (moneyAmount > 0) {
    await addCoins(userId, moneyAmount);
  }

  await checkLevelUp(userId);
}

async function checkLevelUp(userId) {
  const profile = await getOrCreateProfile(userId);
  const xpNeeded = profile.level * 100;
  
  if (profile.xp >= xpNeeded) {
    await db.update(userLetheProfile)
      .set({ 
        level: sql`${userLetheProfile.level} + 1`,
        xp: sql`${userLetheProfile.xp} - ${xpNeeded}`
      })
      .where(eq(userLetheProfile.visitorId, userId));
    return true;
  }
  return false;
}

async function getTeamWithEquipment(userId) {
  const team = await getTeam(userId);
  const profile = await getOrCreateProfile(userId);
  
  let weaponBonus = { damage: 0 };
  let armorBonus = { defense: 0 };
  let accessoryBonus = {};

  if (profile.equippedWeapon) {
    const weapons = await db.select().from(letheWeapons).where(eq(letheWeapons.weaponId, profile.equippedWeapon)).limit(1);
    if (weapons.length > 0) weaponBonus = weapons[0];
  }
  
  if (profile.equippedArmor) {
    const armors = await db.select().from(letheArmors).where(eq(letheArmors.armorId, profile.equippedArmor)).limit(1);
    if (armors.length > 0) armorBonus = armors[0];
  }
  
  if (profile.equippedAccessory) {
    const accessories = await db.select().from(letheAccessories).where(eq(letheAccessories.accessoryId, profile.equippedAccessory)).limit(1);
    if (accessories.length > 0) accessoryBonus = accessories[0];
  }

  const baseStats = {
    hp: team.reduce((sum, t) => sum + t.userAnimal.hp, 0),
    str: team.reduce((sum, t) => sum + t.userAnimal.str, 0),
    def: team.reduce((sum, t) => sum + t.userAnimal.def, 0),
    spd: team.length > 0 ? Math.round(team.reduce((sum, t) => sum + t.userAnimal.spd, 0) / team.length) : 0
  };

  baseStats.str += weaponBonus.damage || 0;
  baseStats.def += armorBonus.defense || 0;
  
  if (accessoryBonus.effect === 'str_boost') baseStats.str += accessoryBonus.effectValue || 0;
  if (accessoryBonus.effect === 'def_boost') baseStats.def += accessoryBonus.effectValue || 0;
  if (accessoryBonus.effect === 'spd_boost') baseStats.spd += accessoryBonus.effectValue || 0;
  if (accessoryBonus.effect === 'hp_boost') baseStats.hp += accessoryBonus.effectValue || 0;
  if (accessoryBonus.effect === 'luck_boost') { /* luck affects drop rates */ }
  if (accessoryBonus.effect === 'all_stats') {
    baseStats.hp += accessoryBonus.effectValue || 0;
    baseStats.str += accessoryBonus.effectValue || 0;
    baseStats.def += accessoryBonus.effectValue || 0;
    baseStats.spd += accessoryBonus.effectValue || 0;
  }

  return { team, stats: baseStats, weapon: weaponBonus, armor: armorBonus, accessory: accessoryBonus };
}

async function huntAnimal(userId) {
  const profile = await getOrCreateProfile(userId);
  
  const huntCooldown = 15000;
  if (profile.lastHunt) {
    const timeSinceHunt = Date.now() - new Date(profile.lastHunt).getTime();
    if (timeSinceHunt < huntCooldown) {
      return { success: false, cooldown: Math.ceil((huntCooldown - timeSinceHunt) / 1000) };
    }
  }

  const roll = Math.random();
  let cumulative = 0;
  let selectedRarity = 'common';

  for (const [rarity, chance] of Object.entries(rarityChances)) {
    cumulative += chance;
    if (roll <= cumulative) {
      selectedRarity = rarity;
      break;
    }
  }

  const animalsOfRarity = await db.select().from(letheAnimals)
    .where(eq(letheAnimals.rarity, selectedRarity));

  if (animalsOfRarity.length === 0) {
    return { success: false, error: 'No animals found' };
  }

  const caughtAnimal = animalsOfRarity[Math.floor(Math.random() * animalsOfRarity.length)];

  await db.insert(userAnimals).values({
    userId,
    animalId: caughtAnimal.animalId,
    hp: caughtAnimal.baseHp,
    str: caughtAnimal.baseStr,
    def: caughtAnimal.baseDef,
    spd: caughtAnimal.baseSpd
  });

  await db.update(userLetheProfile)
    .set({ 
      totalHunts: sql`${userLetheProfile.totalHunts} + 1`,
      xp: sql`${userLetheProfile.xp} + ${caughtAnimal.xpReward}`,
      lastHunt: new Date()
    })
    .where(eq(userLetheProfile.visitorId, userId));

  return { success: true, animal: caughtAnimal };
}

async function getUserAnimals(userId) {
  return await db.select({
    userAnimal: userAnimals,
    animalInfo: letheAnimals
  })
  .from(userAnimals)
  .leftJoin(letheAnimals, eq(userAnimals.animalId, letheAnimals.animalId))
  .where(eq(userAnimals.userId, userId))
  .orderBy(userAnimals.caughtAt);
}

async function sellAnimal(userId, userAnimalId) {
  const animal = await db.select({
    userAnimal: userAnimals,
    animalInfo: letheAnimals
  })
  .from(userAnimals)
  .leftJoin(letheAnimals, eq(userAnimals.animalId, letheAnimals.animalId))
  .where(eq(userAnimals.id, userAnimalId))
  .limit(1);

  if (animal.length === 0 || animal[0].userAnimal.userId !== userId) {
    return { success: false, error: 'Animal not found' };
  }

  if (animal[0].userAnimal.isInTeam) {
    return { success: false, error: 'Cannot sell animal in team' };
  }

  const sellPrice = animal[0].animalInfo.sellPrice;

  await db.delete(userAnimals).where(eq(userAnimals.id, userAnimalId));
  
  await addCoins(userId, sellPrice);

  return { success: true, animal: animal[0].animalInfo, price: sellPrice };
}

async function getTeam(userId) {
  return await db.select({
    userAnimal: userAnimals,
    animalInfo: letheAnimals
  })
  .from(userAnimals)
  .leftJoin(letheAnimals, eq(userAnimals.animalId, letheAnimals.animalId))
  .where(eq(userAnimals.userId, userId))
  .orderBy(userAnimals.teamSlot);
}

async function addToTeam(userId, userAnimalId) {
  const team = await db.select().from(userAnimals)
    .where(eq(userAnimals.userId, userId));
  
  const inTeam = team.filter(a => a.isInTeam);
  
  if (inTeam.length >= 3) {
    return { success: false, error: 'Team is full (max 3)' };
  }

  const animal = team.find(a => a.id === userAnimalId);

  if (!animal) {
    return { success: false, error: 'Animal not found' };
  }

  if (animal.isInTeam) {
    return { success: false, error: 'Animal already in team' };
  }

  const existingAnimalType = inTeam.find(t => t.animalId === animal.animalId);
  if (existingAnimalType) {
    return { success: false, error: 'Cannot have duplicate animal types in team' };
  }

  const usedSlots = inTeam.map(t => t.teamSlot);
  let nextSlot = 1;
  for (let i = 1; i <= 3; i++) {
    if (!usedSlots.includes(i)) {
      nextSlot = i;
      break;
    }
  }

  await db.update(userAnimals)
    .set({ isInTeam: true, teamSlot: nextSlot })
    .where(eq(userAnimals.id, userAnimalId));

  return { success: true, slot: nextSlot };
}

async function removeFromTeam(userId, slot) {
  const animals = await db.select().from(userAnimals)
    .where(eq(userAnimals.userId, userId));
  
  const animal = animals.find(a => a.teamSlot === slot && a.isInTeam);

  if (!animal) {
    return { success: false, error: 'No animal in that slot' };
  }

  await db.update(userAnimals)
    .set({ isInTeam: false, teamSlot: null })
    .where(eq(userAnimals.id, animal.id));

  return { success: true };
}

async function renameAnimal(userId, userAnimalId, nickname) {
  const animals = await db.select().from(userAnimals)
    .where(eq(userAnimals.id, userAnimalId))
    .limit(1);

  if (animals.length === 0 || animals[0].userId !== userId) {
    return { success: false, error: 'Animal not found' };
  }

  await db.update(userAnimals)
    .set({ nickname })
    .where(eq(userAnimals.id, userAnimalId));

  return { success: true };
}

async function getProfile(userId) {
  return await getOrCreateProfile(userId);
}

async function getAllAnimals() {
  return await db.select().from(letheAnimals);
}

async function getAllWeapons() {
  return await db.select().from(letheWeapons);
}

async function getAllArmors() {
  return await db.select().from(letheArmors);
}

async function getAllAccessories() {
  return await db.select().from(letheAccessories);
}

async function getAllConsumables() {
  return await db.select().from(letheConsumables);
}

async function getInventory(userId) {
  return await db.select().from(userLetheInventory)
    .where(eq(userLetheInventory.visitorId, userId));
}

async function buyItem(userId, itemType, itemId) {
  let item;
  switch (itemType) {
    case 'weapon':
      const weapons = await db.select().from(letheWeapons).where(eq(letheWeapons.weaponId, itemId)).limit(1);
      item = weapons[0];
      break;
    case 'armor':
      const armors = await db.select().from(letheArmors).where(eq(letheArmors.armorId, itemId)).limit(1);
      item = armors[0];
      break;
    case 'accessory':
      const accessories = await db.select().from(letheAccessories).where(eq(letheAccessories.accessoryId, itemId)).limit(1);
      item = accessories[0];
      break;
    case 'consumable':
      const consumables = await db.select().from(letheConsumables).where(eq(letheConsumables.consumableId, itemId)).limit(1);
      item = consumables[0];
      break;
    case 'bait':
      const baits = await db.select().from(letheBaits).where(eq(letheBaits.baitId, itemId)).limit(1);
      item = baits[0];
      break;
    default:
      return { success: false, error: 'Invalid item type' };
  }

  if (!item) {
    return { success: false, error: 'Item not found' };
  }

  const profile = await getOrCreateProfile(userId);

  if (profile.coins < item.price) {
    return { success: false, error: 'Not enough coins' };
  }

  await addCoins(userId, -item.price);

  const existingItem = await db.select().from(userLetheInventory)
    .where(eq(userLetheInventory.visitorId, userId))
    .limit(1);

  const matchingItem = existingItem.find(i => i.itemType === itemType && i.itemId === itemId);

  if (matchingItem) {
    await db.update(userLetheInventory)
      .set({ quantity: sql`${userLetheInventory.quantity} + 1` })
      .where(eq(userLetheInventory.id, matchingItem.id));
  } else {
    await db.insert(userLetheInventory).values({
      visitorId: userId,
      itemType,
      itemId,
      quantity: 1
    });
  }

  return { success: true, item, price: item.price };
}

async function equipItem(userId, itemType, itemId) {
  const profile = await getOrCreateProfile(userId);
  
  const inventoryItems = await db.select().from(userLetheInventory)
    .where(eq(userLetheInventory.visitorId, userId));

  const inventoryItem = inventoryItems.find(i => i.itemType === itemType && i.itemId === itemId);

  if (!inventoryItem) {
    return { success: false, error: 'Item not in inventory' };
  }

  const updateData = {};
  switch (itemType) {
    case 'weapon':
      updateData.equippedWeapon = itemId;
      break;
    case 'armor':
      updateData.equippedArmor = itemId;
      break;
    case 'accessory':
      updateData.equippedAccessory = itemId;
      break;
    default:
      return { success: false, error: 'Cannot equip this item type' };
  }

  await db.update(userLetheProfile)
    .set(updateData)
    .where(eq(userLetheProfile.visitorId, userId));

  return { success: true };
}

async function getUserAchievements(userId) {
  return await db.select({
    userAchievement: userLetheAchievements,
    achievementInfo: letheAchievements
  })
  .from(userLetheAchievements)
  .leftJoin(letheAchievements, eq(userLetheAchievements.achievementId, letheAchievements.achievementId))
  .where(eq(userLetheAchievements.visitorId, userId));
}

async function getAllAchievements() {
  return await db.select().from(letheAchievements);
}

async function grantAchievement(userId, achievementId) {
  const existing = await db.select().from(userLetheAchievements)
    .where(eq(userLetheAchievements.visitorId, userId));

  if (existing.find(a => a.achievementId === achievementId)) {
    return { success: false, alreadyHas: true };
  }

  const achievement = await db.select().from(letheAchievements)
    .where(eq(letheAchievements.achievementId, achievementId))
    .limit(1);

  if (achievement.length === 0) {
    return { success: false, error: 'Achievement not found' };
  }

  await db.insert(userLetheAchievements).values({
    visitorId: userId,
    achievementId
  });

  if (achievement[0].rewardMoney > 0) {
    await addCoins(userId, achievement[0].rewardMoney);
  }

  return { success: true, achievement: achievement[0] };
}

async function checkAndGrantAchievements(userId) {
  const profile = await getOrCreateProfile(userId);
  const userAnimalsData = await getUserAnimals(userId);
  const achievements = await getAllAchievements();
  const userAchievementsData = await getUserAchievements(userId);
  
  const earnedIds = new Set(userAchievementsData.map(a => a.userAchievement.achievementId));
  const newAchievements = [];

  for (const achievement of achievements) {
    if (earnedIds.has(achievement.achievementId)) continue;

    let earned = false;

    switch (achievement.requirement) {
      case 'hunts':
        earned = profile.totalHunts >= achievement.requirementValue;
        break;
      case 'battles_won':
        earned = profile.battlesWon >= achievement.requirementValue;
        break;
      case 'bosses_killed':
        earned = profile.bossesKilled >= achievement.requirementValue;
        break;
      case 'balance':
        earned = profile.coins >= achievement.requirementValue;
        break;
      case 'collection':
        const rarities = new Set(userAnimalsData.map(a => a.animalInfo?.rarity).filter(Boolean));
        earned = rarities.size >= achievement.requirementValue;
        break;
    }

    if (earned) {
      const result = await grantAchievement(userId, achievement.achievementId);
      if (result.success) {
        newAchievements.push(achievement);
      }
    }
  }

  return newAchievements;
}

// ==================== QUEST SYSTEM ====================

const questDefinitions = {
  daily: [
    { questId: 'daily_first_hunt', name: 'İlk Avı Yap', description: '1 hayvan avla', emoji: '🎯', requirement: 'hunt', targetValue: 1, rewardMoney: 50, rewardXp: 10 },
    { questId: 'daily_hunter', name: 'Avcı', description: '10 hayvan avla', emoji: '🏹', requirement: 'hunt', targetValue: 10, rewardMoney: 200, rewardXp: 25 },
    { questId: 'daily_collector', name: 'Koleksiyoncu', description: '25 hayvan avla', emoji: '📦', requirement: 'hunt', targetValue: 25, rewardMoney: 500, rewardXp: 50, rewardItem: 'bronze_crate', rewardItemType: 'crate', rewardQuantity: 1 },
    { questId: 'daily_warrior', name: 'Savaşçı', description: '3 PvE savaş kazan', emoji: '⚔️', requirement: 'battle_win', targetValue: 3, rewardMoney: 300, rewardXp: 30 },
    { questId: 'daily_duelist', name: 'Düellocu', description: '1 PvP düello yap', emoji: '🤺', requirement: 'pvp', targetValue: 1, rewardMoney: 150, rewardXp: 20 },
    { questId: 'daily_rare_find', name: 'Nadir Buluş', description: '1 Nadir+ hayvan yakala', emoji: '💎', requirement: 'rare_catch', targetValue: 1, rewardMoney: 400, rewardXp: 40 },
    { questId: 'daily_seller', name: 'Satıcı', description: '5 hayvan sat', emoji: '💰', requirement: 'sell', targetValue: 5, rewardMoney: 100, rewardXp: 15 },
    { questId: 'daily_team_player', name: 'Takım Oyuncusu', description: 'Takımla 5 savaş yap', emoji: '👥', requirement: 'battle', targetValue: 5, rewardMoney: 250, rewardXp: 35 }
  ],
  weekly: [
    { questId: 'weekly_hunter', name: 'Haftalık Avcı', description: '100 hayvan avla', emoji: '🎯', requirement: 'hunt', targetValue: 100, rewardMoney: 2000, rewardXp: 200 },
    { questId: 'weekly_boss_slayer', name: 'Boss Avcısı', description: '3 boss öldür', emoji: '🐲', requirement: 'boss_kill', targetValue: 3, rewardMoney: 5000, rewardXp: 500, rewardItem: 'epic_crate', rewardItemType: 'crate', rewardQuantity: 1 },
    { questId: 'weekly_pvp_master', name: 'PvP Ustası', description: '10 düello kazan', emoji: '🏆', requirement: 'pvp_win', targetValue: 10, rewardMoney: 3000, rewardXp: 300 },
    { questId: 'weekly_epic_find', name: 'Epik Buluş', description: '3 Epik+ hayvan yakala', emoji: '🌟', requirement: 'epic_catch', targetValue: 3, rewardMoney: 2500, rewardXp: 250 },
    { questId: 'weekly_rich', name: 'Zengin Ol', description: '10,000 💰 kazan', emoji: '🤑', requirement: 'earn_money', targetValue: 10000, rewardMoney: 1500, rewardXp: 150 },
    { questId: 'weekly_collection', name: 'Koleksiyon Tamamla', description: '20 farklı hayvan yakala', emoji: '📚', requirement: 'unique_catch', targetValue: 20, rewardMoney: 4000, rewardXp: 400 },
    { questId: 'weekly_battle_lord', name: 'Savaş Lordu', description: '30 savaş kazan', emoji: '👑', requirement: 'battle_win', targetValue: 30, rewardMoney: 3500, rewardXp: 350, rewardItem: 'gold_crate', rewardItemType: 'crate', rewardQuantity: 1 }
  ]
};

async function seedQuests() {
  try {
    const existing = await db.select().from(letheQuests).limit(1);
    if (existing.length > 0) return;

    for (const quest of [...questDefinitions.daily, ...questDefinitions.weekly]) {
      const type = quest.questId.startsWith('daily_') ? 'daily' : 'weekly';
      await db.insert(letheQuests).values({ ...quest, type }).onConflictDoNothing();
    }
    console.log('Lethe Quests seeded!');
  } catch (error) {
    console.error('Error seeding quests:', error);
  }
}

function getNextReset(type) {
  const now = new Date();
  if (type === 'daily') {
    const tomorrow = new Date(now);
    tomorrow.setUTCHours(0, 0, 0, 0);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    return tomorrow;
  } else {
    const nextMonday = new Date(now);
    nextMonday.setUTCHours(0, 0, 0, 0);
    const daysUntilMonday = (8 - nextMonday.getUTCDay()) % 7 || 7;
    nextMonday.setUTCDate(nextMonday.getUTCDate() + daysUntilMonday);
    return nextMonday;
  }
}

async function getUserQuests(userId) {
  await getOrCreateProfile(userId);
  
  const now = new Date();
  
  // Clean expired quests
  await db.delete(userLetheQuests)
    .where(and(eq(userLetheQuests.visitorId, userId), lt(userLetheQuests.expiresAt, now)));
  
  // Get active quests
  let userQuests = await db.select().from(userLetheQuests)
    .where(and(eq(userLetheQuests.visitorId, userId), gte(userLetheQuests.expiresAt, now)));
  
  // Assign new quests if needed
  const allQuests = await db.select().from(letheQuests);
  const assignedQuestIds = new Set(userQuests.map(q => q.questId));
  
  for (const quest of allQuests) {
    if (!assignedQuestIds.has(quest.questId)) {
      const expiresAt = getNextReset(quest.type);
      await db.insert(userLetheQuests).values({
        visitorId: userId,
        questId: quest.questId,
        progress: 0,
        completed: false,
        claimed: false,
        expiresAt
      });
    }
  }
  
  // Fetch all quests again with quest details
  userQuests = await db.select().from(userLetheQuests)
    .where(and(eq(userLetheQuests.visitorId, userId), gte(userLetheQuests.expiresAt, now)));
  
  const questsWithDetails = [];
  for (const uq of userQuests) {
    const questInfo = allQuests.find(q => q.questId === uq.questId);
    if (questInfo) {
      questsWithDetails.push({ ...uq, questInfo });
    }
  }
  
  return questsWithDetails;
}

async function updateQuestProgress(userId, requirement, amount = 1) {
  const userQuests = await getUserQuests(userId);
  const updated = [];
  
  for (const uq of userQuests) {
    if (uq.completed || uq.claimed) continue;
    if (uq.questInfo.requirement !== requirement) continue;
    
    const newProgress = Math.min(uq.progress + amount, uq.questInfo.targetValue);
    const completed = newProgress >= uq.questInfo.targetValue;
    
    await db.update(userLetheQuests)
      .set({ 
        progress: newProgress, 
        completed,
        completedAt: completed ? new Date() : null
      })
      .where(eq(userLetheQuests.id, uq.id));
    
    if (completed && !uq.completed) {
      updated.push({ ...uq, progress: newProgress, completed: true });
    }
  }
  
  return updated;
}

async function claimQuestReward(userId, questId) {
  const userQuests = await getUserQuests(userId);
  const quest = userQuests.find(q => q.questId === questId);
  
  if (!quest) return { success: false, error: 'Görev bulunamadı!' };
  if (!quest.completed) return { success: false, error: 'Görev henüz tamamlanmadı!' };
  if (quest.claimed) return { success: false, error: 'Ödül zaten alındı!' };
  
  // Mark as claimed
  await db.update(userLetheQuests)
    .set({ claimed: true })
    .where(eq(userLetheQuests.id, quest.id));
  
  // Give rewards
  const qi = quest.questInfo;
  if (qi.rewardMoney > 0) {
    await addCoins(userId, qi.rewardMoney);
  }
  if (qi.rewardXp > 0) {
    await db.update(userLetheProfile)
      .set({ xp: sql`${userLetheProfile.xp} + ${qi.rewardXp}` })
      .where(eq(userLetheProfile.visitorId, userId));
    await checkLevelUp(userId);
  }
  if (qi.rewardItem && qi.rewardItemType) {
    await addInventoryItem(userId, qi.rewardItemType, qi.rewardItem, qi.rewardQuantity || 1);
  }
  
  return { success: true, quest: qi };
}

async function addInventoryItem(userId, itemType, itemId, quantity = 1) {
  const existing = await db.select().from(userLetheInventory)
    .where(and(
      eq(userLetheInventory.visitorId, userId),
      eq(userLetheInventory.itemType, itemType),
      eq(userLetheInventory.itemId, itemId)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(userLetheInventory)
      .set({ quantity: sql`${userLetheInventory.quantity} + ${quantity}` })
      .where(eq(userLetheInventory.id, existing[0].id));
  } else {
    await db.insert(userLetheInventory).values({
      visitorId: userId,
      itemType,
      itemId,
      quantity
    });
  }
}

// ==================== DAILY REWARD SYSTEM ====================

async function getOrCreateDaily(userId) {
  let daily = await db.select().from(letheDaily)
    .where(eq(letheDaily.visitorId, userId))
    .limit(1);
  
  if (daily.length === 0) {
    await db.insert(letheDaily).values({ visitorId: userId });
    daily = await db.select().from(letheDaily)
      .where(eq(letheDaily.visitorId, userId))
      .limit(1);
  }
  
  return daily[0];
}

const dailyRewards = [
  { day: 1, money: 100, bonus: null },
  { day: 2, money: 150, bonus: null },
  { day: 3, money: 200, bonus: null },
  { day: 4, money: 300, bonus: null },
  { day: 5, money: 400, bonus: null },
  { day: 6, money: 500, bonus: null },
  { day: 7, money: 1000, bonus: { type: 'crate', id: 'silver_crate', quantity: 1 } }
];

async function claimDailyReward(userId) {
  await getOrCreateProfile(userId);
  const daily = await getOrCreateDaily(userId);
  
  const now = new Date();
  const lastClaim = daily.lastClaim ? new Date(daily.lastClaim) : null;
  
  if (lastClaim) {
    const hoursSince = (now - lastClaim) / (1000 * 60 * 60);
    if (hoursSince < 24) {
      const hoursLeft = Math.ceil(24 - hoursSince);
      return { success: false, error: `Günlük ödülünü zaten aldın! ${hoursLeft} saat sonra tekrar gel.` };
    }
    
    // Check streak (48 hour window)
    const daysSince = hoursSince / 24;
    if (daysSince > 2) {
      // Reset streak
      await db.update(letheDaily)
        .set({ currentStreak: 0 })
        .where(eq(letheDaily.visitorId, userId));
    }
  }
  
  // Calculate new streak
  let newStreak = (daily.currentStreak % 7) + 1;
  const longestStreak = Math.max(daily.longestStreak, newStreak);
  
  const reward = dailyRewards[newStreak - 1];
  
  // Update daily record
  await db.update(letheDaily)
    .set({ 
      currentStreak: newStreak,
      longestStreak,
      lastClaim: now,
      totalClaims: sql`${letheDaily.totalClaims} + 1`
    })
    .where(eq(letheDaily.visitorId, userId));
  
  // Give rewards
  await addCoins(userId, reward.money);
  
  if (reward.bonus) {
    await addInventoryItem(userId, reward.bonus.type, reward.bonus.id, reward.bonus.quantity);
  }
  
  return { 
    success: true, 
    day: newStreak, 
    money: reward.money, 
    bonus: reward.bonus,
    nextReward: dailyRewards[newStreak % 7]
  };
}

async function getDailyStatus(userId) {
  const daily = await getOrCreateDaily(userId);
  const now = new Date();
  const lastClaim = daily.lastClaim ? new Date(daily.lastClaim) : null;
  
  let canClaim = true;
  let hoursLeft = 0;
  
  if (lastClaim) {
    const hoursSince = (now - lastClaim) / (1000 * 60 * 60);
    if (hoursSince < 24) {
      canClaim = false;
      hoursLeft = Math.ceil(24 - hoursSince);
    }
  }
  
  const currentDay = daily.currentStreak % 7;
  const nextReward = dailyRewards[currentDay];
  
  return {
    currentStreak: daily.currentStreak,
    longestStreak: daily.longestStreak,
    totalClaims: daily.totalClaims,
    canClaim,
    hoursLeft,
    nextReward,
    allRewards: dailyRewards
  };
}

// ==================== WORK SYSTEM ====================

const jobs = {
  hunter: { name: 'Avcı', emoji: '🏹', minPay: 50, maxPay: 150, bonus: 'hunt_xp' },
  trader: { name: 'Tüccar', emoji: '💼', minPay: 80, maxPay: 200, bonus: 'sell_bonus' },
  warrior: { name: 'Savaşçı', emoji: '⚔️', minPay: 60, maxPay: 180, bonus: 'battle_xp' },
  collector: { name: 'Koleksiyoncu', emoji: '📦', minPay: 40, maxPay: 250, bonus: 'rare_chance' }
};

async function getOrCreateWork(userId) {
  let work = await db.select().from(letheWork)
    .where(eq(letheWork.visitorId, userId))
    .limit(1);
  
  if (work.length === 0) {
    await db.insert(letheWork).values({ visitorId: userId });
    work = await db.select().from(letheWork)
      .where(eq(letheWork.visitorId, userId))
      .limit(1);
  }
  
  return work[0];
}

async function doWork(userId) {
  await getOrCreateProfile(userId);
  const work = await getOrCreateWork(userId);
  
  const now = new Date();
  const lastWork = work.lastWork ? new Date(work.lastWork) : null;
  
  if (lastWork) {
    const minutesSince = (now - lastWork) / (1000 * 60);
    if (minutesSince < 30) {
      const minutesLeft = Math.ceil(30 - minutesSince);
      return { success: false, error: `Dinlenmen gerekiyor! ${minutesLeft} dakika sonra tekrar çalışabilirsin.` };
    }
  }
  
  const job = jobs[work.job] || jobs.hunter;
  const earned = Math.floor(Math.random() * (job.maxPay - job.minPay + 1)) + job.minPay;
  
  // Update work record
  await db.update(letheWork)
    .set({ 
      lastWork: now,
      totalWorked: sql`${letheWork.totalWorked} + 1`,
      totalEarned: sql`${letheWork.totalEarned} + ${earned}`
    })
    .where(eq(letheWork.visitorId, userId));
  
  // Give money
  await addCoins(userId, earned);
  
  // Update quest progress
  await updateQuestProgress(userId, 'earn_money', earned);
  
  return { 
    success: true, 
    job,
    earned,
    totalWorked: work.totalWorked + 1
  };
}

async function changeJob(userId, newJob) {
  if (!jobs[newJob]) {
    return { success: false, error: 'Geçersiz meslek!' };
  }
  
  await getOrCreateWork(userId);
  await db.update(letheWork)
    .set({ job: newJob })
    .where(eq(letheWork.visitorId, userId));
  
  return { success: true, job: jobs[newJob] };
}

async function getWorkStatus(userId) {
  const work = await getOrCreateWork(userId);
  const now = new Date();
  const lastWork = work.lastWork ? new Date(work.lastWork) : null;
  
  let canWork = true;
  let minutesLeft = 0;
  
  if (lastWork) {
    const minutesSince = (now - lastWork) / (1000 * 60);
    if (minutesSince < 30) {
      canWork = false;
      minutesLeft = Math.ceil(30 - minutesSince);
    }
  }
  
  return {
    job: jobs[work.job] || jobs.hunter,
    jobId: work.job,
    totalWorked: work.totalWorked,
    totalEarned: work.totalEarned,
    canWork,
    minutesLeft,
    allJobs: jobs
  };
}

module.exports = {
  seedDatabase,
  huntAnimal,
  getUserAnimals,
  sellAnimal,
  getTeam,
  addToTeam,
  removeFromTeam,
  renameAnimal,
  getProfile,
  getAllAnimals,
  getAllWeapons,
  getAllArmors,
  getAllAccessories,
  getAllConsumables,
  getInventory,
  buyItem,
  equipItem,
  getOrCreateProfile,
  addCoins,
  addBattleReward,
  checkLevelUp,
  getTeamWithEquipment,
  getUserAchievements,
  getAllAchievements,
  grantAchievement,
  checkAndGrantAchievements,
  // Quest System
  seedQuests,
  getUserQuests,
  updateQuestProgress,
  claimQuestReward,
  addInventoryItem,
  // Daily Reward System
  claimDailyReward,
  getDailyStatus,
  // Work System
  doWork,
  changeJob,
  getWorkStatus,
  jobs
};
