const { db } = require('../database/db');
const { 
  letheAnimals, userAnimals, letheWeapons, letheArmors, letheAccessories,
  letheConsumables, letheBaits, letheCrates, letheBosses, userLetheInventory,
  userLetheProfile, letheAchievements, userLetheAchievements, letheBattles,
  letheQuests, userLetheQuests, letheDaily, letheWork, letheEvolutionGems, letheAbilities,
  letheTrades, letheGifts, letheFriends, letheRaids, letheLeaderboard
} = require('../../shared/schema');
const { eq, sql, and, lt, gte, or, desc, asc } = require('drizzle-orm');
const seedData = require('./seedData');

// VIP Server Configuration - ThePublisher
const VIP_CONFIG = {
  serverId: '291436861082042378',
  inviteLink: 'https://discord.gg/thepublisher',
  bonuses: {
    rarityBoost: 0.15,       // %15 daha yüksek nadir hayvan şansı
    coinMultiplier: 1.25,    // %25 ekstra para
    xpMultiplier: 1.25,      // %25 ekstra XP
    dailyMultiplier: 1.50,   // %50 ekstra günlük ödül
    shopDiscount: 0.15       // %15 mağaza indirimi
  },
  exclusiveAnimals: ['vip_phoenix', 'vip_guardian', 'vip_spirit']
};

// Track daily DM sends per user
const dailyDmTracker = new Map();

function isVipServer(guildId) {
  return guildId === VIP_CONFIG.serverId;
}

function getVipBonuses(guildId) {
  if (isVipServer(guildId)) {
    return VIP_CONFIG.bonuses;
  }
  return null;
}

async function canSendDailyDm(userId) {
  try {
    const profile = await db.select().from(userLetheProfile)
      .where(eq(userLetheProfile.visitorId, userId))
      .limit(1);
    
    if (!profile[0] || !profile[0].lastPromoDm) {
      return true;
    }
    
    const lastDm = new Date(profile[0].lastPromoDm);
    const now = new Date();
    const hoursSince = (now - lastDm) / (1000 * 60 * 60);
    
    return hoursSince >= 24;
  } catch {
    return true;
  }
}

async function markDmSent(userId) {
  try {
    await getOrCreateProfile(userId);
    await db.update(userLetheProfile)
      .set({ lastPromoDm: new Date() })
      .where(eq(userLetheProfile.visitorId, userId));
  } catch (e) {
    console.error('Error marking DM sent:', e);
  }
}

function getVipPromoMessage() {
  return {
    title: '🌟 VIP Sunucu Bonusları!',
    description: `**ThePublisher** sunucusunda Lethe Game oyna ve exclusive bonuslar kazan!`,
    bonuses: [
      '🎯 **%15 Nadir Hayvan Şansı** - Daha fazla epic/legendary hayvan yakala!',
      '💰 **%25 Ekstra Para** - Tüm kazançlarında bonus altın!',
      '✨ **%25 Ekstra XP** - Daha hızlı seviye atla!',
      '🎁 **%50 Günlük Bonus** - Günlük ödüllerde ekstra para!',
      '🛒 **%15 Mağaza İndirimi** - Tüm eşyalarda indirim!',
      '🦅 **3 Özel VIP Hayvan** - Sadece bu sunucuda yakalanabilir!'
    ],
    inviteLink: VIP_CONFIG.inviteLink
  };
}

const rarityChances = {
  common: 0.60,
  uncommon: 0.25,
  rare: 0.10,
  epic: 0.04,
  legendary: 0.008,      // 0.8% (önceki: 1.5%)
  mythic: 0.0015,        // 0.15% (önceki: 0.4%)
  hidden: 0.0004,        // 0.04% (önceki: 0.1%)
  eternal: 0.0001        // 0.01% (önceki: 0.0001%)
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

async function addBattleReward(userId, xpAmount, moneyAmount, won, isBoss = false, guildId = null) {
  await getOrCreateProfile(userId);
  const isVip = isVipServer(guildId);
  const vipBonuses = getVipBonuses(guildId);
  
  // Apply VIP bonuses
  let finalXp = xpAmount;
  let finalMoney = moneyAmount;
  let xpBonus = 0;
  let moneyBonus = 0;
  
  if (isVip && vipBonuses) {
    xpBonus = Math.floor(xpAmount * (vipBonuses.xpMultiplier - 1));
    moneyBonus = Math.floor(moneyAmount * (vipBonuses.coinMultiplier - 1));
    finalXp = Math.floor(xpAmount * vipBonuses.xpMultiplier);
    finalMoney = Math.floor(moneyAmount * vipBonuses.coinMultiplier);
  }
  
  const updateData = {
    totalBattles: sql`${userLetheProfile.totalBattles} + 1`,
    xp: sql`${userLetheProfile.xp} + ${finalXp}`
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

  if (finalMoney > 0) {
    await addCoins(userId, finalMoney);
  }

  await checkLevelUp(userId);
  
  return { xpBonus, moneyBonus, isVip };
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
  
  let totalWeaponDamage = 0;
  let totalArmorDefense = 0;
  let allEquipment = [];
  
  const baseStats = {
    hp: 0,
    str: 0,
    def: 0,
    spd: 0
  };

  for (const t of team) {
    const animal = t.userAnimal;
    const equipment = await getAnimalEquipmentDetails(animal);
    
    let animalStr = animal.str;
    let animalDef = animal.def;
    let animalHp = animal.hp;
    let animalSpd = animal.spd;
    
    if (equipment.weaponInfo) {
      animalStr += equipment.weaponInfo.damage || 0;
      totalWeaponDamage += equipment.weaponInfo.damage || 0;
      allEquipment.push({ type: 'weapon', ...equipment.weaponInfo, animalName: t.animalInfo.name });
    }
    
    if (equipment.armorInfo) {
      animalDef += equipment.armorInfo.defense || 0;
      totalArmorDefense += equipment.armorInfo.defense || 0;
      allEquipment.push({ type: 'armor', ...equipment.armorInfo, animalName: t.animalInfo.name });
    }
    
    if (equipment.accessoryInfo) {
      const acc = equipment.accessoryInfo;
      if (acc.effect === 'str_boost') animalStr += acc.effectValue || 0;
      if (acc.effect === 'def_boost') animalDef += acc.effectValue || 0;
      if (acc.effect === 'spd_boost') animalSpd += acc.effectValue || 0;
      if (acc.effect === 'hp_boost') animalHp += acc.effectValue || 0;
      if (acc.effect === 'all_stats') {
        animalHp += acc.effectValue || 0;
        animalStr += acc.effectValue || 0;
        animalDef += acc.effectValue || 0;
        animalSpd += acc.effectValue || 0;
      }
      allEquipment.push({ type: 'accessory', ...acc, animalName: t.animalInfo.name });
    }
    
    t.effectiveStats = { hp: animalHp, str: animalStr, def: animalDef, spd: animalSpd };
    t.equipment = equipment;
    
    baseStats.hp += animalHp;
    baseStats.str += animalStr;
    baseStats.def += animalDef;
    baseStats.spd += animalSpd;
  }
  
  if (team.length > 0) {
    baseStats.spd = Math.round(baseStats.spd / team.length);
  }

  return { 
    team, 
    stats: baseStats, 
    allEquipment,
    weapon: { damage: totalWeaponDamage, name: totalWeaponDamage > 0 ? `+${totalWeaponDamage} Hasar` : null },
    armor: { defense: totalArmorDefense, name: totalArmorDefense > 0 ? `+${totalArmorDefense} Savunma` : null }
  };
}

async function huntAnimal(userId, guildId = null) {
  const profile = await getOrCreateProfile(userId);
  const isVip = isVipServer(guildId);
  const vipBonuses = getVipBonuses(guildId);
  
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

  // Apply VIP rarity boost - shifts roll to favor rarer animals
  let adjustedRarityChances = { ...rarityChances };
  if (isVip && vipBonuses) {
    const boost = vipBonuses.rarityBoost;
    // Reduce common chance and distribute to rarer tiers
    adjustedRarityChances.common -= boost;
    adjustedRarityChances.uncommon += boost * 0.3;
    adjustedRarityChances.rare += boost * 0.25;
    adjustedRarityChances.epic += boost * 0.2;
    adjustedRarityChances.legendary += boost * 0.15;
    adjustedRarityChances.mythic += boost * 0.08;
    adjustedRarityChances.hidden += boost * 0.02;
  }

  for (const [rarity, chance] of Object.entries(adjustedRarityChances)) {
    cumulative += chance;
    if (roll <= cumulative) {
      selectedRarity = rarity;
      break;
    }
  }

  // Check for VIP exclusive animal chance (only in VIP server)
  let caughtAnimal = null;
  if (isVip && Math.random() < 0.02) { // 2% chance for VIP exclusive
    const vipAnimals = await db.select().from(letheAnimals)
      .where(sql`${letheAnimals.animalId} IN ('vip_phoenix', 'vip_guardian', 'vip_spirit')`);
    if (vipAnimals.length > 0) {
      caughtAnimal = vipAnimals[Math.floor(Math.random() * vipAnimals.length)];
    }
  }

  // Regular animal selection if no VIP exclusive
  if (!caughtAnimal) {
    const animalsOfRarity = await db.select().from(letheAnimals)
      .where(and(
        eq(letheAnimals.rarity, selectedRarity),
        sql`${letheAnimals.animalId} NOT IN ('vip_phoenix', 'vip_guardian', 'vip_spirit')`
      ));

    if (animalsOfRarity.length === 0) {
      return { success: false, error: 'No animals found' };
    }

    caughtAnimal = animalsOfRarity[Math.floor(Math.random() * animalsOfRarity.length)];
  }

  await db.insert(userAnimals).values({
    userId,
    animalId: caughtAnimal.animalId,
    hp: caughtAnimal.baseHp,
    str: caughtAnimal.baseStr,
    def: caughtAnimal.baseDef,
    spd: caughtAnimal.baseSpd
  });

  // Apply VIP XP bonus
  let xpReward = caughtAnimal.xpReward;
  if (isVip && vipBonuses) {
    xpReward = Math.floor(xpReward * vipBonuses.xpMultiplier);
  }

  await db.update(userLetheProfile)
    .set({ 
      totalHunts: sql`${userLetheProfile.totalHunts} + 1`,
      xp: sql`${userLetheProfile.xp} + ${xpReward}`,
      lastHunt: new Date()
    })
    .where(eq(userLetheProfile.visitorId, userId));

  return { 
    success: true, 
    animal: caughtAnimal, 
    isVip,
    xpBonus: isVip ? Math.floor(caughtAnimal.xpReward * (vipBonuses.xpMultiplier - 1)) : 0
  };
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

async function giveAnimalToUser(userId, animalId) {
  const animalData = await db.select().from(letheAnimals)
    .where(eq(letheAnimals.animalId, animalId))
    .limit(1);

  if (animalData.length === 0) {
    return { success: false, error: 'Animal not found' };
  }

  const animal = animalData[0];
  
  const result = await db.insert(userAnimals).values({
    userId,
    animalId: animal.animalId,
    hp: animal.baseHp,
    str: animal.baseStr,
    def: animal.baseDef,
    spd: animal.baseSpd
  }).returning();

  await getOrCreateProfile(userId);
  
  await db.update(userLetheProfile)
    .set({ 
      xp: sql`${userLetheProfile.xp} + ${animal.xpReward}`
    })
    .where(eq(userLetheProfile.visitorId, userId));

  return { success: true, animal, animalId: result[0]?.id };
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

async function sellDuplicateAnimals(userId) {
  const allAnimals = await db.select({
    userAnimal: userAnimals,
    animalInfo: letheAnimals
  })
  .from(userAnimals)
  .leftJoin(letheAnimals, eq(userAnimals.animalId, letheAnimals.animalId))
  .where(eq(userAnimals.userId, userId));

  const animalGroups = {};
  for (const a of allAnimals) {
    const key = a.animalInfo.animalId;
    if (!animalGroups[key]) {
      animalGroups[key] = [];
    }
    animalGroups[key].push(a);
  }

  let totalEarned = 0;
  let soldCount = 0;
  const soldDetails = [];

  for (const [animalId, group] of Object.entries(animalGroups)) {
    if (group.length <= 1) continue;
    
    group.sort((a, b) => {
      if (a.userAnimal.isInTeam && !b.userAnimal.isInTeam) return -1;
      if (!a.userAnimal.isInTeam && b.userAnimal.isInTeam) return 1;
      return b.userAnimal.level - a.userAnimal.level;
    });

    const toSell = group.slice(1).filter(a => !a.userAnimal.isInTeam);
    
    if (toSell.length === 0) continue;

    for (const animal of toSell) {
      await db.delete(userAnimals).where(eq(userAnimals.id, animal.userAnimal.id));
    }

    const sellPrice = toSell[0].animalInfo.sellPrice;
    const earned = sellPrice * toSell.length;

    totalEarned += earned;
    soldCount += toSell.length;
    soldDetails.push({
      name: toSell[0].animalInfo.name,
      emoji: toSell[0].animalInfo.emoji,
      count: toSell.length,
      earned: earned
    });
  }

  if (totalEarned > 0) {
    await addCoins(userId, totalEarned);
  }

  return { 
    success: true, 
    soldCount, 
    totalEarned, 
    soldDetails 
  };
}

async function getTeam(userId) {
  return await db.select({
    userAnimal: userAnimals,
    animalInfo: letheAnimals
  })
  .from(userAnimals)
  .leftJoin(letheAnimals, eq(userAnimals.animalId, letheAnimals.animalId))
  .where(and(eq(userAnimals.userId, userId), eq(userAnimals.isInTeam, true)))
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

  await releaseAnimalEquipment(userId, animal);

  await db.update(userAnimals)
    .set({ 
      isInTeam: false, 
      teamSlot: null,
      equippedWeapon: null,
      equippedArmor: null,
      equippedAccessory: null
    })
    .where(eq(userAnimals.id, animal.id));

  return { success: true };
}

async function releaseAnimalEquipment(userId, animal) {
  const equipmentToRelease = [
    { type: 'weapon', id: animal.equippedWeapon },
    { type: 'armor', id: animal.equippedArmor },
    { type: 'accessory', id: animal.equippedAccessory }
  ].filter(e => e.id);

  for (const equip of equipmentToRelease) {
    const inventoryItem = await db.select().from(userLetheInventory)
      .where(and(
        eq(userLetheInventory.visitorId, userId),
        eq(userLetheInventory.itemType, equip.type),
        eq(userLetheInventory.itemId, equip.id)
      ))
      .limit(1);
    
    if (inventoryItem.length > 0 && inventoryItem[0].equippedCount > 0) {
      await db.update(userLetheInventory)
        .set({ equippedCount: sql`GREATEST(${userLetheInventory.equippedCount} - 1, 0)` })
        .where(eq(userLetheInventory.id, inventoryItem[0].id));
    }
  }
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

async function checkBattleCooldown(userId) {
  const profile = await getOrCreateProfile(userId);
  const battleCooldown = 15000; // 15 seconds
  
  if (profile.lastBattle) {
    const timeSince = Date.now() - new Date(profile.lastBattle).getTime();
    if (timeSince < battleCooldown) {
      return { canBattle: false, remainingSeconds: Math.ceil((battleCooldown - timeSince) / 1000) };
    }
  }
  return { canBattle: true };
}

async function setBattleCooldown(userId) {
  await db.update(userLetheProfile)
    .set({ lastBattle: new Date() })
    .where(eq(userLetheProfile.visitorId, userId));
}

async function checkBossCooldown(userId) {
  const profile = await getOrCreateProfile(userId);
  const bossCooldown = 900000; // 15 minutes (900 seconds)
  
  if (profile.lastBoss) {
    const timeSince = Date.now() - new Date(profile.lastBoss).getTime();
    if (timeSince < bossCooldown) {
      const remainingMs = bossCooldown - timeSince;
      const minutes = Math.floor(remainingMs / 60000);
      const seconds = Math.ceil((remainingMs % 60000) / 1000);
      return { canBattle: false, remainingMinutes: minutes, remainingSeconds: seconds };
    }
  }
  return { canBattle: true };
}

async function setBossCooldown(userId) {
  await db.update(userLetheProfile)
    .set({ lastBoss: new Date() })
    .where(eq(userLetheProfile.visitorId, userId));
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

async function getAllCrates() {
  return await db.select().from(letheCrates);
}

async function getInventory(userId) {
  return await db.select().from(userLetheInventory)
    .where(eq(userLetheInventory.visitorId, userId));
}

async function buyItem(userId, itemType, itemId, guildId = null) {
  const isVip = isVipServer(guildId);
  const vipBonuses = getVipBonuses(guildId);
  
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
  
  // Apply VIP discount
  let finalPrice = item.price;
  let discount = 0;
  if (isVip && vipBonuses) {
    discount = Math.floor(item.price * vipBonuses.shopDiscount);
    finalPrice = item.price - discount;
  }

  if (profile.coins < finalPrice) {
    return { success: false, error: 'Not enough coins' };
  }

  await addCoins(userId, -finalPrice);

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

  return { success: true, item, price: finalPrice, originalPrice: item.price, discount, isVip };
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

async function equipItemToAnimal(userId, animalId, itemType, itemId) {
  const inventoryItems = await db.select().from(userLetheInventory)
    .where(eq(userLetheInventory.visitorId, userId));

  const inventoryItem = inventoryItems.find(i => i.itemType === itemType && i.itemId === itemId);

  if (!inventoryItem) {
    return { success: false, error: 'Item not in inventory' };
  }

  const availableCount = inventoryItem.quantity - (inventoryItem.equippedCount || 0);
  if (availableCount <= 0) {
    return { success: false, error: 'No available items (all equipped to other animals)' };
  }

  const animal = await db.select().from(userAnimals)
    .where(eq(userAnimals.id, parseInt(animalId)))
    .limit(1);

  if (animal.length === 0 || animal[0].userId !== userId) {
    return { success: false, error: 'Animal not found' };
  }

  if (!animal[0].isInTeam) {
    return { success: false, error: 'Animal not in team' };
  }

  let oldItemId = null;
  switch (itemType) {
    case 'weapon':
      oldItemId = animal[0].equippedWeapon;
      break;
    case 'armor':
      oldItemId = animal[0].equippedArmor;
      break;
    case 'accessory':
      oldItemId = animal[0].equippedAccessory;
      break;
  }

  if (oldItemId && oldItemId !== itemId) {
    const oldInventoryItem = inventoryItems.find(i => i.itemType === itemType && i.itemId === oldItemId);
    if (oldInventoryItem && oldInventoryItem.equippedCount > 0) {
      await db.update(userLetheInventory)
        .set({ equippedCount: sql`GREATEST(${userLetheInventory.equippedCount} - 1, 0)` })
        .where(eq(userLetheInventory.id, oldInventoryItem.id));
    }
  }

  if (oldItemId !== itemId) {
    await db.update(userLetheInventory)
      .set({ equippedCount: sql`${userLetheInventory.equippedCount} + 1` })
      .where(eq(userLetheInventory.id, inventoryItem.id));
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

  await db.update(userAnimals)
    .set(updateData)
    .where(eq(userAnimals.id, parseInt(animalId)));

  return { success: true, animal: animal[0] };
}

async function unequipFromAnimal(userId, animalId, itemType) {
  const animal = await db.select().from(userAnimals)
    .where(eq(userAnimals.id, parseInt(animalId)))
    .limit(1);

  if (animal.length === 0 || animal[0].userId !== userId) {
    return { success: false, error: 'Animal not found' };
  }

  let itemId = null;
  switch (itemType) {
    case 'weapon':
      itemId = animal[0].equippedWeapon;
      break;
    case 'armor':
      itemId = animal[0].equippedArmor;
      break;
    case 'accessory':
      itemId = animal[0].equippedAccessory;
      break;
  }

  if (itemId) {
    const inventoryItem = await db.select().from(userLetheInventory)
      .where(and(
        eq(userLetheInventory.visitorId, userId),
        eq(userLetheInventory.itemType, itemType),
        eq(userLetheInventory.itemId, itemId)
      ))
      .limit(1);
    
    if (inventoryItem.length > 0 && inventoryItem[0].equippedCount > 0) {
      await db.update(userLetheInventory)
        .set({ equippedCount: sql`GREATEST(${userLetheInventory.equippedCount} - 1, 0)` })
        .where(eq(userLetheInventory.id, inventoryItem[0].id));
    }
  }

  const updateData = {};
  switch (itemType) {
    case 'weapon':
      updateData.equippedWeapon = null;
      break;
    case 'armor':
      updateData.equippedArmor = null;
      break;
    case 'accessory':
      updateData.equippedAccessory = null;
      break;
    default:
      return { success: false, error: 'Invalid item type' };
  }

  await db.update(userAnimals)
    .set(updateData)
    .where(eq(userAnimals.id, parseInt(animalId)));

  return { success: true };
}

async function getAnimalEquipmentDetails(animal) {
  let weaponInfo = null, armorInfo = null, accessoryInfo = null;

  if (animal.equippedWeapon) {
    const weapons = await db.select().from(letheWeapons)
      .where(eq(letheWeapons.weaponId, animal.equippedWeapon)).limit(1);
    if (weapons.length > 0) weaponInfo = weapons[0];
  }

  if (animal.equippedArmor) {
    const armors = await db.select().from(letheArmors)
      .where(eq(letheArmors.armorId, animal.equippedArmor)).limit(1);
    if (armors.length > 0) armorInfo = armors[0];
  }

  if (animal.equippedAccessory) {
    const accessories = await db.select().from(letheAccessories)
      .where(eq(letheAccessories.accessoryId, animal.equippedAccessory)).limit(1);
    if (accessories.length > 0) accessoryInfo = accessories[0];
  }

  return { weaponInfo, armorInfo, accessoryInfo };
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
        completedAt: completed ? new Date() : null,
        claimed: completed ? true : false
      })
      .where(eq(userLetheQuests.id, uq.id));
    
    if (completed && !uq.completed) {
      const qi = uq.questInfo;
      let rewards = { coins: 0, xp: 0, item: null };
      
      if (qi.rewardMoney > 0) {
        await addCoins(userId, qi.rewardMoney);
        rewards.coins = qi.rewardMoney;
      }
      if (qi.rewardXp > 0) {
        await db.update(userLetheProfile)
          .set({ xp: sql`${userLetheProfile.xp} + ${qi.rewardXp}` })
          .where(eq(userLetheProfile.visitorId, userId));
        await checkLevelUp(userId);
        rewards.xp = qi.rewardXp;
      }
      if (qi.rewardItem && qi.rewardItemType) {
        await addInventoryItem(userId, qi.rewardItemType, qi.rewardItem, qi.rewardQuantity || 1);
        rewards.item = { type: qi.rewardItemType, id: qi.rewardItem, quantity: qi.rewardQuantity || 1 };
      }
      
      updated.push({ ...uq, progress: newProgress, completed: true, rewards });
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

async function claimDailyReward(userId, guildId = null) {
  await getOrCreateProfile(userId);
  const daily = await getOrCreateDaily(userId);
  const isVip = isVipServer(guildId);
  const vipBonuses = getVipBonuses(guildId);
  
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
  
  // Apply VIP daily bonus
  let finalMoney = reward.money;
  let vipBonus = 0;
  if (isVip && vipBonuses) {
    vipBonus = Math.floor(reward.money * (vipBonuses.dailyMultiplier - 1));
    finalMoney = Math.floor(reward.money * vipBonuses.dailyMultiplier);
  }
  
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
  await addCoins(userId, finalMoney);
  
  if (reward.bonus) {
    await addInventoryItem(userId, reward.bonus.type, reward.bonus.id, reward.bonus.quantity);
  }
  
  return { 
    success: true, 
    day: newStreak, 
    money: finalMoney, 
    baseMoney: reward.money,
    vipBonus,
    isVip,
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

// ==================== EVOLUTION SYSTEM ====================

const abilities = {
  // Common abilities
  quick_hunter: { id: 'quick_hunter', name: 'Hızlı Avcı', emoji: '🏃', description: 'Av cooldown\'u %10 azalır', rarity: 'common', type: 'passive', effect: 'hunt_cooldown', value: 10 },
  tough_skin: { id: 'tough_skin', name: 'Sert Deri', emoji: '🛡️', description: 'Savunma +5', rarity: 'common', type: 'passive', effect: 'defense', value: 5 },
  sharp_claws: { id: 'sharp_claws', name: 'Keskin Pençeler', emoji: '🐾', description: 'Saldırı +5', rarity: 'common', type: 'passive', effect: 'attack', value: 5 },
  
  // Uncommon abilities
  lucky_charm: { id: 'lucky_charm', name: 'Şans Tılsımı', emoji: '🍀', description: 'Nadir hayvan şansı +5%', rarity: 'uncommon', type: 'passive', effect: 'rare_chance', value: 5 },
  battle_fury: { id: 'battle_fury', name: 'Savaş Öfkesi', emoji: '😤', description: 'HP düşükken hasar +20%', rarity: 'uncommon', type: 'passive', effect: 'low_hp_damage', value: 20 },
  regeneration: { id: 'regeneration', name: 'Rejenerasyon', emoji: '💚', description: 'Her turda HP +5', rarity: 'uncommon', type: 'passive', effect: 'regen', value: 5 },
  
  // Rare abilities
  critical_strike: { id: 'critical_strike', name: 'Kritik Vuruş', emoji: '💥', description: '%15 kritik şansı (x2 hasar)', rarity: 'rare', type: 'passive', effect: 'crit_chance', value: 15 },
  evasion: { id: 'evasion', name: 'Kaçınma', emoji: '💨', description: '%10 saldırılardan kaçınma', rarity: 'rare', type: 'passive', effect: 'dodge', value: 10 },
  life_steal: { id: 'life_steal', name: 'Can Çalma', emoji: '🩸', description: 'Verilen hasarın %10\'u HP olarak geri döner', rarity: 'rare', type: 'passive', effect: 'lifesteal', value: 10 },
  
  // Epic abilities
  berserker: { id: 'berserker', name: 'Berserker', emoji: '🔥', description: 'Tüm statlar +10, savunma -5', rarity: 'epic', type: 'passive', effect: 'berserker', value: 10 },
  iron_will: { id: 'iron_will', name: 'Demir İrade', emoji: '🧠', description: 'Ölümcül darbeden %20 şansla 1 HP ile hayatta kal', rarity: 'epic', type: 'passive', effect: 'survive', value: 20 },
  double_strike: { id: 'double_strike', name: 'Çift Vuruş', emoji: '⚔️', description: '%15 şansla 2 kez saldır', rarity: 'epic', type: 'passive', effect: 'double_attack', value: 15 },
  
  // Legendary abilities
  phoenix_rebirth: { id: 'phoenix_rebirth', name: 'Anka Doğuşu', emoji: '🔥', description: 'Savaşta bir kez öldüğünde %50 HP ile geri dön', rarity: 'legendary', type: 'passive', effect: 'rebirth', value: 50 },
  elemental_mastery: { id: 'elemental_mastery', name: 'Element Ustalığı', emoji: '🌈', description: 'Tüm hasar türlerine +25% bonus', rarity: 'legendary', type: 'passive', effect: 'all_damage', value: 25 },
  
  // Mythic abilities
  godslayer: { id: 'godslayer', name: 'Tanrı Katili', emoji: '⚡', description: 'Boss\'lara %50 ekstra hasar', rarity: 'mythic', type: 'passive', effect: 'boss_damage', value: 50 },
  time_warp: { id: 'time_warp', name: 'Zaman Bükücü', emoji: '⏰', description: '%25 şansla ekstra tur kazan', rarity: 'mythic', type: 'passive', effect: 'extra_turn', value: 25 },
  
  // Hidden abilities
  void_touch: { id: 'void_touch', name: 'Boşluk Dokunuşu', emoji: '🕳️', description: 'Tüm statlar +20, savaşta hasar %30 artırılır', rarity: 'hidden', type: 'passive', effect: 'void_power', value: 30 }
};

const evolutionGemRequirements = {
  common: { gemType: 'common', amount: 3, coinCost: 500 },
  uncommon: { gemType: 'uncommon', amount: 3, coinCost: 1500 },
  rare: { gemType: 'rare', amount: 5, coinCost: 5000 },
  epic: { gemType: 'epic', amount: 5, coinCost: 15000 },
  legendary: { gemType: 'legendary', amount: 10, coinCost: 50000 },
  mythic: { gemType: 'mythic', amount: 15, coinCost: 150000 },
  hidden: { gemType: 'hidden', amount: 20, coinCost: 500000 }
};

async function getUserGems(userId) {
  const gems = await db.select().from(letheEvolutionGems)
    .where(eq(letheEvolutionGems.visitorId, userId));
  
  const gemMap = {};
  for (const gem of gems) {
    gemMap[gem.gemType] = gem.quantity;
  }
  
  return {
    common: gemMap.common || 0,
    uncommon: gemMap.uncommon || 0,
    rare: gemMap.rare || 0,
    epic: gemMap.epic || 0,
    legendary: gemMap.legendary || 0,
    mythic: gemMap.mythic || 0,
    hidden: gemMap.hidden || 0
  };
}

async function addGems(userId, gemType, amount) {
  const existing = await db.select().from(letheEvolutionGems)
    .where(and(eq(letheEvolutionGems.visitorId, userId), eq(letheEvolutionGems.gemType, gemType)))
    .limit(1);
  
  if (existing.length === 0) {
    await db.insert(letheEvolutionGems).values({ visitorId: userId, gemType, quantity: amount });
  } else {
    await db.update(letheEvolutionGems)
      .set({ quantity: sql`${letheEvolutionGems.quantity} + ${amount}` })
      .where(and(eq(letheEvolutionGems.visitorId, userId), eq(letheEvolutionGems.gemType, gemType)));
  }
}

async function evolveAnimal(userId, animalId1, animalId2, animalId3) {
  // Get all three animals
  const animals = await db.select().from(userAnimals)
    .where(and(eq(userAnimals.userId, userId), sql`${userAnimals.id} IN (${animalId1}, ${animalId2}, ${animalId3})`));
  
  if (animals.length !== 3) {
    return { success: false, error: 'Üç geçerli hayvan ID\'si gerekli.' };
  }
  
  // Check if all are the same type
  const animalTypes = [...new Set(animals.map(a => a.animalId))];
  if (animalTypes.length !== 1) {
    return { success: false, error: 'Evrim için aynı türden 3 hayvan gerekli!' };
  }
  
  // Check if any is already evolved
  const alreadyEvolved = animals.find(a => a.evolutionLevel >= 3);
  if (alreadyEvolved) {
    return { success: false, error: 'Bu hayvan zaten maksimum evrim seviyesinde!' };
  }
  
  // Check if any is in team
  const inTeam = animals.find(a => a.isInTeam);
  if (inTeam) {
    return { success: false, error: 'Takımdaki hayvanları birleştiremezsin! Önce takımdan çıkar.' };
  }
  
  // Get animal info for rarity
  const animalInfo = await db.select().from(letheAnimals)
    .where(eq(letheAnimals.animalId, animalTypes[0]))
    .limit(1);
  
  if (animalInfo.length === 0) {
    return { success: false, error: 'Hayvan bilgisi bulunamadı.' };
  }
  
  const rarity = animalInfo[0].rarity;
  const requirement = evolutionGemRequirements[rarity];
  
  // Check gems
  const userGems = await getUserGems(userId);
  if ((userGems[requirement.gemType] || 0) < requirement.amount) {
    return { success: false, error: `Evrim için ${requirement.amount} ${requirement.gemType} taşı gerekli! (Sahip: ${userGems[requirement.gemType] || 0})` };
  }
  
  // Check coins
  const profile = await getOrCreateProfile(userId);
  if (profile.coins < requirement.coinCost) {
    return { success: false, error: `Evrim için ${requirement.coinCost}💰 gerekli! (Sahip: ${profile.coins}💰)` };
  }
  
  // Find the highest level animal to keep
  const bestAnimal = animals.sort((a, b) => b.level - a.level)[0];
  const otherAnimals = animals.filter(a => a.id !== bestAnimal.id);
  
  // Calculate combined stats bonus
  const statBonus = Math.floor((otherAnimals[0].level + otherAnimals[1].level) * 2);
  const newEvolutionLevel = Math.min(bestAnimal.evolutionLevel + 1, 3);
  
  // Assign ability based on rarity
  const rarityAbilities = Object.values(abilities).filter(a => a.rarity === rarity);
  const randomAbility = rarityAbilities.length > 0 ? rarityAbilities[Math.floor(Math.random() * rarityAbilities.length)] : null;
  
  // Update the best animal
  await db.update(userAnimals)
    .set({
      evolutionLevel: newEvolutionLevel,
      hp: sql`${userAnimals.hp} + ${statBonus + 20}`,
      str: sql`${userAnimals.str} + ${Math.floor(statBonus / 2) + 5}`,
      def: sql`${userAnimals.def} + ${Math.floor(statBonus / 2) + 5}`,
      spd: sql`${userAnimals.spd} + ${Math.floor(statBonus / 3) + 3}`,
      ability: randomAbility ? randomAbility.id : bestAnimal.ability
    })
    .where(eq(userAnimals.id, bestAnimal.id));
  
  // Delete the other two animals
  for (const animal of otherAnimals) {
    await db.delete(userAnimals).where(eq(userAnimals.id, animal.id));
  }
  
  // Deduct gems and coins
  await db.update(letheEvolutionGems)
    .set({ quantity: sql`${letheEvolutionGems.quantity} - ${requirement.amount}` })
    .where(and(eq(letheEvolutionGems.visitorId, userId), eq(letheEvolutionGems.gemType, requirement.gemType)));
  
  await db.update(userLetheProfile)
    .set({ coins: sql`${userLetheProfile.coins} - ${requirement.coinCost}` })
    .where(eq(userLetheProfile.visitorId, userId));
  
  // Get updated animal
  const evolvedAnimal = await db.select().from(userAnimals)
    .where(eq(userAnimals.id, bestAnimal.id))
    .limit(1);
  
  return {
    success: true,
    animal: evolvedAnimal[0],
    animalInfo: animalInfo[0],
    newEvolutionLevel,
    statBonus,
    ability: randomAbility,
    gemsUsed: requirement.amount,
    coinsUsed: requirement.coinCost
  };
}

// ==================== TRAINING SYSTEM ====================

const trainingCooldown = 60 * 60 * 1000; // 1 hour in milliseconds

async function trainAnimal(userId, animalId) {
  const animal = await db.select().from(userAnimals)
    .where(and(eq(userAnimals.userId, userId), eq(userAnimals.id, animalId)))
    .limit(1);
  
  if (animal.length === 0) {
    return { success: false, error: 'Bu hayvan sana ait değil!' };
  }
  
  const pet = animal[0];
  
  // Check cooldown
  if (pet.lastTrained) {
    const timeSince = Date.now() - new Date(pet.lastTrained).getTime();
    if (timeSince < trainingCooldown) {
      const minutesLeft = Math.ceil((trainingCooldown - timeSince) / (1000 * 60));
      return { success: false, error: `Bu hayvan dinleniyor! ${minutesLeft} dakika bekle.`, cooldown: minutesLeft };
    }
  }
  
  // Check if max training level
  if (pet.trainingLevel >= 10) {
    return { success: false, error: 'Bu hayvan maksimum eğitim seviyesine ulaştı!' };
  }
  
  // Training cost increases with level
  const trainingCost = 100 + (pet.trainingLevel * 50);
  
  // Check coins
  const profile = await getOrCreateProfile(userId);
  if (profile.coins < trainingCost) {
    return { success: false, error: `Eğitim için ${trainingCost}💰 gerekli! (Sahip: ${profile.coins}💰)` };
  }
  
  // Random stat gains
  const statGains = {
    hp: Math.floor(Math.random() * 10) + 5,
    str: Math.floor(Math.random() * 3) + 1,
    def: Math.floor(Math.random() * 3) + 1,
    spd: Math.floor(Math.random() * 2) + 1
  };
  
  // XP gain
  const xpGain = 20 + (pet.trainingLevel * 5);
  
  // Update animal
  await db.update(userAnimals)
    .set({
      hp: sql`${userAnimals.hp} + ${statGains.hp}`,
      str: sql`${userAnimals.str} + ${statGains.str}`,
      def: sql`${userAnimals.def} + ${statGains.def}`,
      spd: sql`${userAnimals.spd} + ${statGains.spd}`,
      xp: sql`${userAnimals.xp} + ${xpGain}`,
      trainingLevel: sql`${userAnimals.trainingLevel} + 1`,
      lastTrained: new Date()
    })
    .where(eq(userAnimals.id, animalId));
  
  // Deduct coins
  await db.update(userLetheProfile)
    .set({ coins: sql`${userLetheProfile.coins} - ${trainingCost}` })
    .where(eq(userLetheProfile.visitorId, userId));
  
  // Get updated animal
  const updatedAnimal = await db.select().from(userAnimals)
    .where(eq(userAnimals.id, animalId))
    .limit(1);
  
  // Get animal info
  const animalInfo = await db.select().from(letheAnimals)
    .where(eq(letheAnimals.animalId, pet.animalId))
    .limit(1);
  
  return {
    success: true,
    animal: updatedAnimal[0],
    animalInfo: animalInfo[0],
    statGains,
    xpGain,
    cost: trainingCost,
    newTrainingLevel: pet.trainingLevel + 1
  };
}

async function getAnimalDetails(userId, animalId) {
  const animal = await db.select().from(userAnimals)
    .where(and(eq(userAnimals.userId, userId), eq(userAnimals.id, animalId)))
    .limit(1);
  
  if (animal.length === 0) {
    return null;
  }
  
  const pet = animal[0];
  const animalInfo = await db.select().from(letheAnimals)
    .where(eq(letheAnimals.animalId, pet.animalId))
    .limit(1);
  
  // Get ability info
  let abilityInfo = null;
  if (pet.ability && abilities[pet.ability]) {
    abilityInfo = abilities[pet.ability];
  }
  
  // Calculate training cooldown
  let canTrain = true;
  let trainingCooldownLeft = 0;
  if (pet.lastTrained) {
    const timeSince = Date.now() - new Date(pet.lastTrained).getTime();
    if (timeSince < trainingCooldown) {
      canTrain = false;
      trainingCooldownLeft = Math.ceil((trainingCooldown - timeSince) / (1000 * 60));
    }
  }
  
  return {
    ...pet,
    animalInfo: animalInfo[0],
    abilityInfo,
    canTrain,
    trainingCooldownLeft,
    trainingCost: 100 + (pet.trainingLevel * 50),
    maxTrainingLevel: pet.trainingLevel >= 10
  };
}

// ==================== PHASE 4: PLAYER INTERACTION SYSTEMS ====================

// === TRADING SYSTEM ===
async function createTrade(senderId, receiverId, offer) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  const [trade] = await db.insert(letheTrades).values({
    senderId,
    receiverId,
    senderAnimalId: offer.senderAnimalId || null,
    receiverAnimalId: offer.receiverAnimalId || null,
    senderCoins: offer.senderCoins || 0,
    receiverCoins: offer.receiverCoins || 0,
    senderItemType: offer.senderItemType || null,
    senderItemId: offer.senderItemId || null,
    receiverItemType: offer.receiverItemType || null,
    receiverItemId: offer.receiverItemId || null,
    status: 'pending',
    expiresAt
  }).returning();
  
  return trade;
}

async function getPendingTrades(userId) {
  const trades = await db.select().from(letheTrades)
    .where(and(
      or(eq(letheTrades.senderId, userId), eq(letheTrades.receiverId, userId)),
      eq(letheTrades.status, 'pending')
    ))
    .orderBy(desc(letheTrades.createdAt));
  
  return trades;
}

async function getTrade(tradeId) {
  const [trade] = await db.select().from(letheTrades)
    .where(eq(letheTrades.id, tradeId))
    .limit(1);
  return trade;
}

async function acceptTrade(tradeId) {
  const trade = await getTrade(tradeId);
  if (!trade || trade.status !== 'pending') {
    return { success: false, error: 'Takas bulunamadı veya geçersiz' };
  }
  
  // Check expiry
  if (new Date(trade.expiresAt) < new Date()) {
    await db.update(letheTrades)
      .set({ status: 'expired' })
      .where(eq(letheTrades.id, tradeId));
    return { success: false, error: 'Takas süresi dolmuş' };
  }
  
  // Verify both parties have the items/coins
  const senderProfile = await getOrCreateProfile(trade.senderId);
  const receiverProfile = await getOrCreateProfile(trade.receiverId);
  
  // Check coins
  if (trade.senderCoins > 0 && senderProfile.coins < trade.senderCoins) {
    return { success: false, error: 'Gönderen yeterli altına sahip değil' };
  }
  if (trade.receiverCoins > 0 && receiverProfile.coins < trade.receiverCoins) {
    return { success: false, error: 'Alıcı yeterli altına sahip değil' };
  }
  
  // Check animals ownership
  if (trade.senderAnimalId) {
    const [animal] = await db.select().from(userAnimals)
      .where(and(eq(userAnimals.id, trade.senderAnimalId), eq(userAnimals.userId, trade.senderId)));
    if (!animal) return { success: false, error: 'Gönderen hayvan sahibi değil' };
  }
  if (trade.receiverAnimalId) {
    const [animal] = await db.select().from(userAnimals)
      .where(and(eq(userAnimals.id, trade.receiverAnimalId), eq(userAnimals.userId, trade.receiverId)));
    if (!animal) return { success: false, error: 'Alıcı hayvan sahibi değil' };
  }
  
  // Perform the trade
  // Transfer coins
  if (trade.senderCoins > 0) {
    await addCoins(trade.senderId, -trade.senderCoins);
    await addCoins(trade.receiverId, trade.senderCoins);
  }
  if (trade.receiverCoins > 0) {
    await addCoins(trade.receiverId, -trade.receiverCoins);
    await addCoins(trade.senderId, trade.receiverCoins);
  }
  
  // Transfer animals
  if (trade.senderAnimalId) {
    await db.update(userAnimals)
      .set({ userId: trade.receiverId, inTeam: false, teamSlot: null })
      .where(eq(userAnimals.id, trade.senderAnimalId));
  }
  if (trade.receiverAnimalId) {
    await db.update(userAnimals)
      .set({ userId: trade.senderId, inTeam: false, teamSlot: null })
      .where(eq(userAnimals.id, trade.receiverAnimalId));
  }
  
  // Update trade status
  await db.update(letheTrades)
    .set({ status: 'accepted' })
    .where(eq(letheTrades.id, tradeId));
  
  return { success: true, trade };
}

async function rejectTrade(tradeId) {
  await db.update(letheTrades)
    .set({ status: 'rejected' })
    .where(eq(letheTrades.id, tradeId));
  return { success: true };
}

async function cancelTrade(tradeId, userId) {
  const trade = await getTrade(tradeId);
  if (!trade) return { success: false, error: 'Takas bulunamadı' };
  if (trade.senderId !== userId) return { success: false, error: 'Bu takası iptal etme yetkiniz yok' };
  
  await db.update(letheTrades)
    .set({ status: 'cancelled' })
    .where(eq(letheTrades.id, tradeId));
  return { success: true };
}

// === GIFT SYSTEM ===
const giftCooldown = 60 * 60 * 1000; // 1 hour cooldown between gifts to same person
const giftCache = new Map();

function canSendGift(senderId, receiverId) {
  const key = `${senderId}-${receiverId}`;
  const lastGift = giftCache.get(key);
  if (lastGift && Date.now() - lastGift < giftCooldown) {
    return { canSend: false, remaining: Math.ceil((giftCooldown - (Date.now() - lastGift)) / 60000) };
  }
  return { canSend: true };
}

async function sendGift(senderId, receiverId, giftType, amount, animalId = null, message = null) {
  // Check cooldown
  const cooldownCheck = canSendGift(senderId, receiverId);
  if (!cooldownCheck.canSend) {
    return { success: false, error: `Bu kişiye ${cooldownCheck.remaining} dakika sonra hediye gönderebilirsiniz` };
  }
  
  const senderProfile = await getOrCreateProfile(senderId);
  
  if (giftType === 'coins') {
    if (senderProfile.coins < amount) {
      return { success: false, error: 'Yeterli altınınız yok' };
    }
    
    // Transfer coins
    await addCoins(senderId, -amount);
    await addCoins(receiverId, amount);
    
    // Log gift
    await db.insert(letheGifts).values({
      senderId,
      receiverId,
      giftType: 'coins',
      coins: amount,
      message
    });
    
    giftCache.set(`${senderId}-${receiverId}`, Date.now());
    return { success: true, type: 'coins', amount };
  }
  
  if (giftType === 'animal' && animalId) {
    // Check ownership
    const [animal] = await db.select().from(userAnimals)
      .where(and(eq(userAnimals.id, animalId), eq(userAnimals.userId, senderId)));
    
    if (!animal) {
      return { success: false, error: 'Bu hayvana sahip değilsiniz' };
    }
    
    // Get animal info for response
    const [animalInfo] = await db.select().from(letheAnimals)
      .where(eq(letheAnimals.animalId, animal.animalId));
    
    // Transfer animal
    await db.update(userAnimals)
      .set({ userId: receiverId, inTeam: false, teamSlot: null })
      .where(eq(userAnimals.id, animalId));
    
    // Log gift
    await db.insert(letheGifts).values({
      senderId,
      receiverId,
      giftType: 'animal',
      animalId,
      message
    });
    
    giftCache.set(`${senderId}-${receiverId}`, Date.now());
    return { success: true, type: 'animal', animal: animalInfo };
  }
  
  return { success: false, error: 'Geçersiz hediye türü' };
}

async function getGiftHistory(userId, limit = 20) {
  const sent = await db.select().from(letheGifts)
    .where(eq(letheGifts.senderId, userId))
    .orderBy(desc(letheGifts.createdAt))
    .limit(limit);
  
  const received = await db.select().from(letheGifts)
    .where(eq(letheGifts.receiverId, userId))
    .orderBy(desc(letheGifts.createdAt))
    .limit(limit);
  
  return { sent, received };
}

// === FRIEND SYSTEM ===
async function sendFriendRequest(userId, friendId) {
  if (userId === friendId) {
    return { success: false, error: 'Kendinizi arkadaş olarak ekleyemezsiniz' };
  }
  
  // Check if already friends or pending
  const existing = await db.select().from(letheFriends)
    .where(or(
      and(eq(letheFriends.userId, userId), eq(letheFriends.friendId, friendId)),
      and(eq(letheFriends.userId, friendId), eq(letheFriends.friendId, userId))
    ));
  
  if (existing.length > 0) {
    const status = existing[0].status;
    if (status === 'accepted') return { success: false, error: 'Zaten arkadaşsınız' };
    if (status === 'pending') return { success: false, error: 'Bekleyen istek var' };
    if (status === 'blocked') return { success: false, error: 'Bu kullanıcıyla etkileşim kuramazsınız' };
  }
  
  await db.insert(letheFriends).values({
    userId,
    friendId,
    status: 'pending'
  });
  
  return { success: true };
}

async function acceptFriendRequest(userId, requestId) {
  const [request] = await db.select().from(letheFriends)
    .where(and(eq(letheFriends.id, requestId), eq(letheFriends.friendId, userId)));
  
  if (!request || request.status !== 'pending') {
    return { success: false, error: 'İstek bulunamadı' };
  }
  
  await db.update(letheFriends)
    .set({ status: 'accepted' })
    .where(eq(letheFriends.id, requestId));
  
  return { success: true, friendId: request.userId };
}

async function rejectFriendRequest(userId, requestId) {
  await db.delete(letheFriends)
    .where(and(eq(letheFriends.id, requestId), eq(letheFriends.friendId, userId)));
  return { success: true };
}

async function removeFriend(userId, friendId) {
  await db.delete(letheFriends)
    .where(or(
      and(eq(letheFriends.userId, userId), eq(letheFriends.friendId, friendId)),
      and(eq(letheFriends.userId, friendId), eq(letheFriends.friendId, userId))
    ));
  return { success: true };
}

async function getFriends(userId) {
  const friends = await db.select().from(letheFriends)
    .where(and(
      or(eq(letheFriends.userId, userId), eq(letheFriends.friendId, userId)),
      eq(letheFriends.status, 'accepted')
    ));
  
  return friends.map(f => f.userId === userId ? f.friendId : f.userId);
}

async function getPendingFriendRequests(userId) {
  const requests = await db.select().from(letheFriends)
    .where(and(eq(letheFriends.friendId, userId), eq(letheFriends.status, 'pending')));
  return requests;
}

async function areFriends(userId1, userId2) {
  const [friendship] = await db.select().from(letheFriends)
    .where(and(
      or(
        and(eq(letheFriends.userId, userId1), eq(letheFriends.friendId, userId2)),
        and(eq(letheFriends.userId, userId2), eq(letheFriends.friendId, userId1))
      ),
      eq(letheFriends.status, 'accepted')
    ));
  return !!friendship;
}

// === CO-OP RAID SYSTEM ===
async function createRaid(guildId, hostId, bossId) {
  const boss = seedData.bosses.find(b => b.bossId === bossId);
  if (!boss) return { success: false, error: 'Boss bulunamadı' };
  
  // Check if there's already an active raid in this guild
  const [existing] = await db.select().from(letheRaids)
    .where(and(
      eq(letheRaids.guildId, guildId),
      or(eq(letheRaids.status, 'recruiting'), eq(letheRaids.status, 'active'))
    ));
  
  if (existing) {
    return { success: false, error: 'Bu sunucuda zaten aktif bir raid var', existingRaid: existing };
  }
  
  // Check host has full team
  const hostTeam = await getTeam(hostId);
  if (hostTeam.length < 3) {
    return { success: false, error: 'Raid başlatmak için 3/3 takım gerekli' };
  }
  
  const bossHp = boss.hp * 3; // Scale up for raid
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes to recruit
  const startsAt = new Date(Date.now() + 3 * 60 * 1000); // Starts in 3 minutes
  
  const [raid] = await db.insert(letheRaids).values({
    guildId,
    bossId,
    hostId,
    participants: [{ userId: hostId, damage: 0, joined: true }],
    bossHp,
    currentHp: bossHp,
    status: 'recruiting',
    maxParticipants: 5,
    startsAt,
    expiresAt
  }).returning();
  
  return { success: true, raid, boss };
}

async function joinRaid(raidId, userId) {
  const [raid] = await db.select().from(letheRaids)
    .where(eq(letheRaids.id, raidId));
  
  if (!raid) return { success: false, error: 'Raid bulunamadı' };
  if (raid.status !== 'recruiting') return { success: false, error: 'Bu raid artık katılıma açık değil' };
  
  const participants = raid.participants || [];
  if (participants.find(p => p.userId === userId)) {
    return { success: false, error: 'Zaten bu raide katıldınız' };
  }
  if (participants.length >= raid.maxParticipants) {
    return { success: false, error: 'Raid dolu' };
  }
  
  // Check user has full team
  const team = await getTeam(userId);
  if (team.length < 3) {
    return { success: false, error: 'Raid\'e katılmak için 3/3 takım gerekli' };
  }
  
  participants.push({ userId, damage: 0, joined: true });
  
  await db.update(letheRaids)
    .set({ participants })
    .where(eq(letheRaids.id, raidId));
  
  return { success: true, participantCount: participants.length };
}

async function attackRaid(raidId, userId) {
  const [raid] = await db.select().from(letheRaids)
    .where(eq(letheRaids.id, raidId));
  
  if (!raid) return { success: false, error: 'Raid bulunamadı' };
  if (raid.status !== 'active') return { success: false, error: 'Raid aktif değil' };
  
  const participants = raid.participants || [];
  const participant = participants.find(p => p.userId === userId);
  if (!participant) return { success: false, error: 'Bu raide katılmadınız' };
  
  // Get user's team and calculate damage
  const team = await getTeamWithEquipment(userId);
  let totalDamage = 0;
  const damageBreakdown = [];
  
  for (const animal of team) {
    const baseDamage = animal.attack + (animal.bonusAttack || 0);
    const critChance = 0.15;
    const isCrit = Math.random() < critChance;
    const damage = isCrit ? Math.floor(baseDamage * 1.5) : baseDamage;
    totalDamage += damage;
    damageBreakdown.push({
      name: animal.animalInfo?.name || animal.animalId,
      damage,
      isCrit
    });
  }
  
  // Apply damage
  const newHp = Math.max(0, raid.currentHp - totalDamage);
  participant.damage = (participant.damage || 0) + totalDamage;
  
  // Update raid
  if (newHp <= 0) {
    // Raid completed!
    const boss = seedData.bosses.find(b => b.bossId === raid.bossId);
    const rewards = {
      coins: boss.rewards.coins * 2,
      xp: boss.rewards.xp * 2
    };
    
    // Distribute rewards
    for (const p of participants) {
      const damageShare = p.damage / (raid.bossHp - newHp);
      const playerCoins = Math.floor(rewards.coins * damageShare) + 100; // Minimum 100
      const playerXp = Math.floor(rewards.xp * damageShare) + 50;
      
      await addCoins(p.userId, playerCoins);
      p.reward = { coins: playerCoins, xp: playerXp };
    }
    
    await db.update(letheRaids)
      .set({ 
        currentHp: 0, 
        status: 'completed', 
        participants,
        rewards 
      })
      .where(eq(letheRaids.id, raidId));
    
    return { 
      success: true, 
      completed: true, 
      damage: totalDamage, 
      damageBreakdown,
      participants,
      rewards
    };
  }
  
  await db.update(letheRaids)
    .set({ currentHp: newHp, participants })
    .where(eq(letheRaids.id, raidId));
  
  return { 
    success: true, 
    completed: false, 
    damage: totalDamage, 
    damageBreakdown,
    remainingHp: newHp,
    bossHp: raid.bossHp
  };
}

async function getActiveRaid(guildId) {
  const [raid] = await db.select().from(letheRaids)
    .where(and(
      eq(letheRaids.guildId, guildId),
      or(eq(letheRaids.status, 'recruiting'), eq(letheRaids.status, 'active'))
    ));
  return raid;
}

async function startRaid(raidId) {
  await db.update(letheRaids)
    .set({ status: 'active' })
    .where(eq(letheRaids.id, raidId));
}

// === LEADERBOARD SYSTEM ===
async function getLeaderboard(category, limit = 10) {
  let query;
  
  switch(category) {
    case 'coins':
      query = db.select({
        userId: userLetheProfile.visitorId,
        value: userLetheProfile.coins
      }).from(userLetheProfile)
        .orderBy(desc(userLetheProfile.coins))
        .limit(limit);
      break;
    
    case 'level':
      query = db.select({
        userId: userLetheProfile.visitorId,
        value: userLetheProfile.level
      }).from(userLetheProfile)
        .orderBy(desc(userLetheProfile.level))
        .limit(limit);
      break;
    
    case 'hunts':
      query = db.select({
        userId: userLetheProfile.visitorId,
        value: userLetheProfile.totalHunts
      }).from(userLetheProfile)
        .orderBy(desc(userLetheProfile.totalHunts))
        .limit(limit);
      break;
    
    case 'battles':
      query = db.select({
        userId: userLetheProfile.visitorId,
        value: userLetheProfile.battlesWon
      }).from(userLetheProfile)
        .orderBy(desc(userLetheProfile.battlesWon))
        .limit(limit);
      break;
    
    case 'pvp':
      query = db.select({
        userId: userLetheProfile.visitorId,
        value: userLetheProfile.pvpWins
      }).from(userLetheProfile)
        .orderBy(desc(userLetheProfile.pvpWins))
        .limit(limit);
      break;
    
    case 'animals':
      // Count animals per user
      query = db.select({
        userId: userAnimals.userId,
        value: sql`COUNT(*)`.as('value')
      }).from(userAnimals)
        .groupBy(userAnimals.userId)
        .orderBy(desc(sql`COUNT(*)`))
        .limit(limit);
      break;
    
    default:
      query = db.select({
        userId: userLetheProfile.visitorId,
        value: userLetheProfile.coins
      }).from(userLetheProfile)
        .orderBy(desc(userLetheProfile.coins))
        .limit(limit);
  }
  
  const results = await query;
  return results.map((r, i) => ({
    rank: i + 1,
    userId: r.userId,
    value: Number(r.value) || 0
  }));
}

async function getUserRank(userId, category) {
  const profile = await getOrCreateProfile(userId);
  let value = 0;
  
  switch(category) {
    case 'coins': value = profile.coins; break;
    case 'level': value = profile.level; break;
    case 'hunts': value = profile.totalHunts; break;
    case 'battles': value = profile.battlesWon; break;
    case 'pvp': value = profile.pvpWins; break;
    default: value = profile.coins;
  }
  
  // Get count of users with higher value
  let rankQuery;
  switch(category) {
    case 'coins':
      rankQuery = db.select({ count: sql`COUNT(*)` }).from(userLetheProfile)
        .where(sql`${userLetheProfile.coins} > ${value}`);
      break;
    case 'level':
      rankQuery = db.select({ count: sql`COUNT(*)` }).from(userLetheProfile)
        .where(sql`${userLetheProfile.level} > ${value}`);
      break;
    case 'hunts':
      rankQuery = db.select({ count: sql`COUNT(*)` }).from(userLetheProfile)
        .where(sql`${userLetheProfile.totalHunts} > ${value}`);
      break;
    case 'battles':
      rankQuery = db.select({ count: sql`COUNT(*)` }).from(userLetheProfile)
        .where(sql`${userLetheProfile.battlesWon} > ${value}`);
      break;
    case 'pvp':
      rankQuery = db.select({ count: sql`COUNT(*)` }).from(userLetheProfile)
        .where(sql`${userLetheProfile.pvpWins} > ${value}`);
      break;
    default:
      rankQuery = db.select({ count: sql`COUNT(*)` }).from(userLetheProfile)
        .where(sql`${userLetheProfile.coins} > ${value}`);
  }
  
  const [result] = await rankQuery;
  return { rank: Number(result.count) + 1, value };
}

module.exports = {
  seedDatabase,
  huntAnimal,
  getUserAnimals,
  sellAnimal,
  sellDuplicateAnimals,
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
  getAllCrates,
  getInventory,
  buyItem,
  equipItem,
  equipItemToAnimal,
  unequipFromAnimal,
  getAnimalEquipmentDetails,
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
  jobs,
  // Evolution System
  getUserGems,
  addGems,
  evolveAnimal,
  abilities,
  evolutionGemRequirements,
  // Training System
  trainAnimal,
  getAnimalDetails,
  // Special
  giveAnimalToUser,
  // Cooldowns
  checkBattleCooldown,
  setBattleCooldown,
  checkBossCooldown,
  setBossCooldown,
  // VIP System
  isVipServer,
  getVipBonuses,
  canSendDailyDm,
  markDmSent,
  getVipPromoMessage,
  VIP_CONFIG,
  // Phase 4: Trading System
  createTrade,
  getPendingTrades,
  getTrade,
  acceptTrade,
  rejectTrade,
  cancelTrade,
  // Phase 4: Gift System
  sendGift,
  getGiftHistory,
  canSendGift,
  // Phase 4: Friend System
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getFriends,
  getPendingFriendRequests,
  areFriends,
  // Phase 4: Raid System
  createRaid,
  joinRaid,
  attackRaid,
  getActiveRaid,
  startRaid,
  // Phase 4: Leaderboard System
  getLeaderboard,
  getUserRank
};
