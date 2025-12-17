const { db } = require('../database/db');
const { 
  letheAnimals, userAnimals, letheWeapons, letheArmors, letheAccessories,
  letheConsumables, letheBaits, letheCrates, letheBosses, userLetheInventory,
  userLetheProfile, letheAchievements, userLetheAchievements, letheBattles, userEconomy
} = require('../../shared/schema');
const { eq, and, sql } = require('drizzle-orm');
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

async function getOrCreateProfile(guildId, visitorId) {
  let profile = await db.select().from(userLetheProfile)
    .where(and(eq(userLetheProfile.guildId, guildId), eq(userLetheProfile.visitorId, visitorId)))
    .limit(1);

  if (profile.length === 0) {
    await db.insert(userLetheProfile).values({ guildId, visitorId });
    profile = await db.select().from(userLetheProfile)
      .where(and(eq(userLetheProfile.guildId, guildId), eq(userLetheProfile.visitorId, visitorId)))
      .limit(1);
  }

  return profile[0];
}

async function ensureEconomy(guildId, userId) {
  let economy = await db.select().from(userEconomy)
    .where(and(eq(userEconomy.guildId, guildId), eq(userEconomy.userId, userId)))
    .limit(1);

  if (economy.length === 0) {
    await db.insert(userEconomy).values({ guildId, userId, balance: 0, bank: 0 });
    economy = await db.select().from(userEconomy)
      .where(and(eq(userEconomy.guildId, guildId), eq(userEconomy.userId, userId)))
      .limit(1);
  }

  return economy[0];
}

async function addMoney(guildId, userId, amount) {
  await ensureEconomy(guildId, userId);
  await db.update(userEconomy)
    .set({ balance: sql`${userEconomy.balance} + ${amount}` })
    .where(and(eq(userEconomy.guildId, guildId), eq(userEconomy.userId, userId)));
}

async function addBattleReward(guildId, userId, xpAmount, moneyAmount, won, isBoss = false) {
  await getOrCreateProfile(guildId, userId);
  
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
    .where(and(eq(userLetheProfile.guildId, guildId), eq(userLetheProfile.visitorId, userId)));

  if (moneyAmount > 0) {
    await addMoney(guildId, userId, moneyAmount);
  }

  await checkLevelUp(guildId, userId);
}

async function checkLevelUp(guildId, userId) {
  const profile = await getOrCreateProfile(guildId, userId);
  const xpNeeded = profile.level * 100;
  
  if (profile.xp >= xpNeeded) {
    await db.update(userLetheProfile)
      .set({ 
        level: sql`${userLetheProfile.level} + 1`,
        xp: sql`${userLetheProfile.xp} - ${xpNeeded}`
      })
      .where(and(eq(userLetheProfile.guildId, guildId), eq(userLetheProfile.visitorId, userId)));
    return true;
  }
  return false;
}

async function getTeamWithEquipment(guildId, userId) {
  const team = await getTeam(guildId, userId);
  const profile = await getOrCreateProfile(guildId, userId);
  
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

async function huntAnimal(guildId, visitorId) {
  const profile = await getOrCreateProfile(guildId, visitorId);
  
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
    guildId,
    userId: visitorId,
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
    .where(and(eq(userLetheProfile.guildId, guildId), eq(userLetheProfile.visitorId, visitorId)));

  return { success: true, animal: caughtAnimal };
}

async function getUserAnimals(guildId, visitorId) {
  return await db.select({
    userAnimal: userAnimals,
    animalInfo: letheAnimals
  })
  .from(userAnimals)
  .leftJoin(letheAnimals, eq(userAnimals.animalId, letheAnimals.animalId))
  .where(and(eq(userAnimals.guildId, guildId), eq(userAnimals.userId, visitorId)))
  .orderBy(userAnimals.caughtAt);
}

async function sellAnimal(guildId, visitorId, userAnimalId) {
  const animal = await db.select({
    userAnimal: userAnimals,
    animalInfo: letheAnimals
  })
  .from(userAnimals)
  .leftJoin(letheAnimals, eq(userAnimals.animalId, letheAnimals.animalId))
  .where(and(
    eq(userAnimals.id, userAnimalId),
    eq(userAnimals.guildId, guildId),
    eq(userAnimals.userId, visitorId)
  ))
  .limit(1);

  if (animal.length === 0) {
    return { success: false, error: 'Animal not found' };
  }

  if (animal[0].userAnimal.isInTeam) {
    return { success: false, error: 'Cannot sell animal in team' };
  }

  const sellPrice = animal[0].animalInfo.sellPrice;

  await db.delete(userAnimals).where(eq(userAnimals.id, userAnimalId));
  
  await addMoney(guildId, visitorId, sellPrice);

  return { success: true, animal: animal[0].animalInfo, price: sellPrice };
}

async function getTeam(guildId, visitorId) {
  return await db.select({
    userAnimal: userAnimals,
    animalInfo: letheAnimals
  })
  .from(userAnimals)
  .leftJoin(letheAnimals, eq(userAnimals.animalId, letheAnimals.animalId))
  .where(and(
    eq(userAnimals.guildId, guildId),
    eq(userAnimals.userId, visitorId),
    eq(userAnimals.isInTeam, true)
  ))
  .orderBy(userAnimals.teamSlot);
}

async function addToTeam(guildId, visitorId, userAnimalId) {
  const team = await getTeam(guildId, visitorId);
  
  if (team.length >= 3) {
    return { success: false, error: 'Team is full (max 3)' };
  }

  const animal = await db.select().from(userAnimals)
    .where(and(
      eq(userAnimals.id, userAnimalId),
      eq(userAnimals.guildId, guildId),
      eq(userAnimals.userId, visitorId)
    ))
    .limit(1);

  if (animal.length === 0) {
    return { success: false, error: 'Animal not found' };
  }

  if (animal[0].isInTeam) {
    return { success: false, error: 'Animal already in team' };
  }

  const existingAnimalType = team.find(t => t.userAnimal.animalId === animal[0].animalId);
  if (existingAnimalType) {
    return { success: false, error: 'Cannot have duplicate animal types in team' };
  }

  const usedSlots = team.map(t => t.userAnimal.teamSlot);
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

async function removeFromTeam(guildId, visitorId, slot) {
  const animal = await db.select().from(userAnimals)
    .where(and(
      eq(userAnimals.guildId, guildId),
      eq(userAnimals.userId, visitorId),
      eq(userAnimals.teamSlot, slot),
      eq(userAnimals.isInTeam, true)
    ))
    .limit(1);

  if (animal.length === 0) {
    return { success: false, error: 'No animal in that slot' };
  }

  await db.update(userAnimals)
    .set({ isInTeam: false, teamSlot: null })
    .where(eq(userAnimals.id, animal[0].id));

  return { success: true };
}

async function renameAnimal(guildId, visitorId, userAnimalId, nickname) {
  const animal = await db.select().from(userAnimals)
    .where(and(
      eq(userAnimals.id, userAnimalId),
      eq(userAnimals.guildId, guildId),
      eq(userAnimals.userId, visitorId)
    ))
    .limit(1);

  if (animal.length === 0) {
    return { success: false, error: 'Animal not found' };
  }

  await db.update(userAnimals)
    .set({ nickname })
    .where(eq(userAnimals.id, userAnimalId));

  return { success: true };
}

async function getProfile(guildId, visitorId) {
  return await getOrCreateProfile(guildId, visitorId);
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

async function getInventory(guildId, visitorId) {
  return await db.select().from(userLetheInventory)
    .where(and(eq(userLetheInventory.guildId, guildId), eq(userLetheInventory.visitorId, visitorId)));
}

async function buyItem(guildId, visitorId, itemType, itemId) {
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

  const economy = await ensureEconomy(guildId, visitorId);

  if (economy.balance < item.price) {
    return { success: false, error: 'Not enough money' };
  }

  await addMoney(guildId, visitorId, -item.price);

  const existingItem = await db.select().from(userLetheInventory)
    .where(and(
      eq(userLetheInventory.guildId, guildId),
      eq(userLetheInventory.visitorId, visitorId),
      eq(userLetheInventory.itemType, itemType),
      eq(userLetheInventory.itemId, itemId)
    ))
    .limit(1);

  if (existingItem.length > 0) {
    await db.update(userLetheInventory)
      .set({ quantity: sql`${userLetheInventory.quantity} + 1` })
      .where(eq(userLetheInventory.id, existingItem[0].id));
  } else {
    await db.insert(userLetheInventory).values({
      guildId,
      visitorId,
      itemType,
      itemId,
      quantity: 1
    });
  }

  return { success: true, item, price: item.price };
}

async function equipItem(guildId, visitorId, itemType, itemId) {
  const profile = await getOrCreateProfile(guildId, visitorId);
  
  const inventoryItem = await db.select().from(userLetheInventory)
    .where(and(
      eq(userLetheInventory.guildId, guildId),
      eq(userLetheInventory.visitorId, visitorId),
      eq(userLetheInventory.itemType, itemType),
      eq(userLetheInventory.itemId, itemId)
    ))
    .limit(1);

  if (inventoryItem.length === 0) {
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
    .where(and(eq(userLetheProfile.guildId, guildId), eq(userLetheProfile.visitorId, visitorId)));

  return { success: true };
}

async function getUserAchievements(guildId, visitorId) {
  return await db.select({
    userAchievement: userLetheAchievements,
    achievementInfo: letheAchievements
  })
  .from(userLetheAchievements)
  .leftJoin(letheAchievements, eq(userLetheAchievements.achievementId, letheAchievements.achievementId))
  .where(and(eq(userLetheAchievements.guildId, guildId), eq(userLetheAchievements.visitorId, visitorId)));
}

async function getAllAchievements() {
  return await db.select().from(letheAchievements);
}

async function grantAchievement(guildId, visitorId, achievementId) {
  const existing = await db.select().from(userLetheAchievements)
    .where(and(
      eq(userLetheAchievements.guildId, guildId),
      eq(userLetheAchievements.visitorId, visitorId),
      eq(userLetheAchievements.achievementId, achievementId)
    ))
    .limit(1);

  if (existing.length > 0) {
    return { success: false, alreadyHas: true };
  }

  const achievement = await db.select().from(letheAchievements)
    .where(eq(letheAchievements.achievementId, achievementId))
    .limit(1);

  if (achievement.length === 0) {
    return { success: false, error: 'Achievement not found' };
  }

  await db.insert(userLetheAchievements).values({
    guildId,
    visitorId,
    achievementId
  });

  if (achievement[0].rewardMoney > 0) {
    await addMoney(guildId, visitorId, achievement[0].rewardMoney);
  }

  return { success: true, achievement: achievement[0] };
}

async function checkAndGrantAchievements(guildId, visitorId) {
  const profile = await getOrCreateProfile(guildId, visitorId);
  const economy = await ensureEconomy(guildId, visitorId);
  const userAnimalsData = await getUserAnimals(guildId, visitorId);
  const achievements = await getAllAchievements();
  const userAchievementsData = await getUserAchievements(guildId, visitorId);
  
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
        earned = economy.balance >= achievement.requirementValue;
        break;
      case 'collection':
        const rarities = new Set(userAnimalsData.map(a => a.animalInfo?.rarity).filter(Boolean));
        earned = rarities.size >= achievement.requirementValue;
        break;
    }

    if (earned) {
      const result = await grantAchievement(guildId, visitorId, achievement.achievementId);
      if (result.success) {
        newAchievements.push(achievement);
      }
    }
  }

  return newAchievements;
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
  ensureEconomy,
  addMoney,
  addBattleReward,
  checkLevelUp,
  getTeamWithEquipment,
  getUserAchievements,
  getAllAchievements,
  grantAchievement,
  checkAndGrantAchievements
};
