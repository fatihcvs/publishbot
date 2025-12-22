const { eq, and, gte, lte, sql } = require('drizzle-orm');

const EVENT_TYPES = {
  XP_BOOST: 'xp_boost',
  RARE_BOOST: 'rare_boost',
  GOLD_BOOST: 'gold_boost',
  BOSS_RUSH: 'boss_rush',
  SPECIAL_HUNT: 'special_hunt',
  COMMUNITY: 'community'
};

const EVENT_EMOJIS = {
  xp_boost: '✨',
  rare_boost: '🎯',
  gold_boost: '💰',
  boss_rush: '👹',
  special_hunt: '🦄',
  community: '🌍'
};

const DEFAULT_EVENTS = [
  {
    eventId: 'weekend_xp',
    name: 'Hafta Sonu XP Şöleni',
    description: 'Hafta sonu boyunca 2x XP kazan!',
    type: 'xp_boost',
    multiplier: 200,
    isRecurring: true,
    recurringPattern: 'weekend'
  },
  {
    eventId: 'weekend_gold',
    name: 'Altın Yağmuru',
    description: 'Hafta sonu boyunca %50 ekstra altın!',
    type: 'gold_boost',
    multiplier: 150,
    isRecurring: true,
    recurringPattern: 'weekend'
  },
  {
    eventId: 'rare_friday',
    name: 'Nadir Cuma',
    description: 'Cuma günleri nadir hayvan şansı 2 kat!',
    type: 'rare_boost',
    multiplier: 200,
    isRecurring: true,
    recurringPattern: 'friday'
  }
];

const COMMUNITY_GOAL_TEMPLATES = [
  {
    goalId: 'weekly_hunts',
    name: 'Haftalık Av Hedefi',
    description: 'Topluluk olarak bu hafta {target} hayvan avlayın!',
    targetType: 'hunts',
    targetValue: 10000,
    rewardCoins: 500,
    rewardGems: 5
  },
  {
    goalId: 'weekly_battles',
    name: 'Savaş Festivali',
    description: 'Topluluk olarak {target} savaş yapın!',
    targetType: 'battles',
    targetValue: 5000,
    rewardCoins: 750,
    rewardGems: 10
  },
  {
    goalId: 'weekly_boss',
    name: 'Boss Avcıları',
    description: 'Topluluk olarak {target} boss öldürün!',
    targetType: 'boss_kills',
    targetValue: 500,
    rewardCoins: 1000,
    rewardGems: 15
  }
];

class EventSystem {
  constructor() {
    this.db = null;
    this.schema = null;
    this.activeEvents = new Map();
    this.activeCommunityGoals = new Map();
  }

  async initialize(db, schema) {
    this.db = db;
    this.schema = schema;
    
    await this.loadActiveEvents();
    await this.checkAndCreateRecurringEvents();
    await this.checkAndCreateCommunityGoals();
    
    setInterval(() => this.refreshEvents(), 60000);
    
    console.log('Event system initialized');
  }

  async loadActiveEvents() {
    if (!this.db || !this.schema) return;
    
    const now = new Date();
    
    try {
      const events = await this.db.select()
        .from(this.schema.letheEvents)
        .where(and(
          eq(this.schema.letheEvents.isActive, true),
          lte(this.schema.letheEvents.startTime, now),
          gte(this.schema.letheEvents.endTime, now)
        ));
      
      this.activeEvents.clear();
      for (const event of events) {
        this.activeEvents.set(event.eventId, event);
      }

      const goals = await this.db.select()
        .from(this.schema.letheCommunityGoals)
        .where(and(
          eq(this.schema.letheCommunityGoals.isCompleted, false),
          lte(this.schema.letheCommunityGoals.startTime, now),
          gte(this.schema.letheCommunityGoals.endTime, now)
        ));
      
      this.activeCommunityGoals.clear();
      for (const goal of goals) {
        this.activeCommunityGoals.set(goal.goalId, goal);
      }
    } catch (error) {
      console.error('Error loading active events:', error.message);
    }
  }

  async refreshEvents() {
    await this.loadActiveEvents();
    await this.checkAndCreateRecurringEvents();
  }

  isWeekend() {
    const day = new Date().getDay();
    return day === 0 || day === 6;
  }

  isFriday() {
    return new Date().getDay() === 5;
  }

  async checkAndCreateRecurringEvents() {
    if (!this.db || !this.schema) return;

    const now = new Date();
    
    for (const template of DEFAULT_EVENTS) {
      let shouldBeActive = false;
      
      if (template.recurringPattern === 'weekend') {
        shouldBeActive = this.isWeekend();
      } else if (template.recurringPattern === 'friday') {
        shouldBeActive = this.isFriday();
      }
      
      const existing = this.activeEvents.get(template.eventId);
      
      if (shouldBeActive && !existing) {
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        
        try {
          await this.db.insert(this.schema.letheEvents).values({
            eventId: template.eventId,
            name: template.name,
            description: template.description,
            type: template.type,
            multiplier: template.multiplier,
            startTime: now,
            endTime: endOfDay,
            isActive: true,
            isRecurring: true,
            recurringPattern: template.recurringPattern
          }).onConflictDoUpdate({
            target: this.schema.letheEvents.eventId,
            set: {
              isActive: true,
              startTime: now,
              endTime: endOfDay
            }
          });
          
          await this.loadActiveEvents();
        } catch (error) {
          console.error('Error creating recurring event:', error.message);
        }
      } else if (!shouldBeActive && existing) {
        try {
          await this.db.update(this.schema.letheEvents)
            .set({ isActive: false })
            .where(eq(this.schema.letheEvents.eventId, template.eventId));
          
          this.activeEvents.delete(template.eventId);
        } catch (error) {
          console.error('Error deactivating event:', error.message);
        }
      }
    }
  }

  async checkAndCreateCommunityGoals() {
    if (!this.db || !this.schema) return;
    
    if (this.activeCommunityGoals.size === 0) {
      const template = COMMUNITY_GOAL_TEMPLATES[Math.floor(Math.random() * COMMUNITY_GOAL_TEMPLATES.length)];
      
      const now = new Date();
      const endOfWeek = new Date(now);
      endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
      endOfWeek.setHours(23, 59, 59, 999);
      
      const goalId = `${template.goalId}_${Date.now()}`;
      
      try {
        await this.db.insert(this.schema.letheCommunityGoals).values({
          goalId: goalId,
          name: template.name,
          description: template.description.replace('{target}', template.targetValue.toLocaleString()),
          targetType: template.targetType,
          targetValue: template.targetValue,
          currentValue: 0,
          rewardCoins: template.rewardCoins,
          rewardGems: template.rewardGems,
          startTime: now,
          endTime: endOfWeek,
          isCompleted: false
        });
        
        await this.loadActiveEvents();
      } catch (error) {
        console.error('Error creating community goal:', error.message);
      }
    }
  }

  getActiveEvents() {
    return Array.from(this.activeEvents.values());
  }

  getActiveCommunityGoals() {
    return Array.from(this.activeCommunityGoals.values());
  }

  getEventBonus(type) {
    let totalMultiplier = 100;
    
    for (const event of this.activeEvents.values()) {
      if (event.type === type) {
        totalMultiplier = Math.max(totalMultiplier, event.multiplier);
      }
    }
    
    return totalMultiplier / 100;
  }

  getXPMultiplier() {
    return this.getEventBonus('xp_boost');
  }

  getGoldMultiplier() {
    return this.getEventBonus('gold_boost');
  }

  getRareMultiplier() {
    return this.getEventBonus('rare_boost');
  }

  isBossRushActive() {
    for (const event of this.activeEvents.values()) {
      if (event.type === 'boss_rush') return true;
    }
    return false;
  }

  async contributeToCommunityGoal(type, amount = 1) {
    if (!this.db || !this.schema) return null;
    
    for (const goal of this.activeCommunityGoals.values()) {
      if (goal.targetType === type && !goal.isCompleted) {
        try {
          const newValue = Math.min(goal.currentValue + amount, goal.targetValue);
          
          await this.db.update(this.schema.letheCommunityGoals)
            .set({ 
              currentValue: newValue,
              isCompleted: newValue >= goal.targetValue,
              completedAt: newValue >= goal.targetValue ? new Date() : null
            })
            .where(eq(this.schema.letheCommunityGoals.goalId, goal.goalId));
          
          goal.currentValue = newValue;
          
          if (newValue >= goal.targetValue) {
            goal.isCompleted = true;
            return { completed: true, goal };
          }
          
          return { completed: false, goal, contribution: amount };
        } catch (error) {
          console.error('Error contributing to community goal:', error.message);
        }
      }
    }
    return null;
  }

  async recordParticipation(userId, goalId, contribution = 1) {
    if (!this.db || !this.schema) return;
    
    try {
      const existing = await this.db.select()
        .from(this.schema.letheEventParticipation)
        .where(and(
          eq(this.schema.letheEventParticipation.goalId, goalId),
          eq(this.schema.letheEventParticipation.userId, userId)
        ))
        .limit(1);
      
      if (existing.length > 0) {
        await this.db.update(this.schema.letheEventParticipation)
          .set({ contribution: sql`${this.schema.letheEventParticipation.contribution} + ${contribution}` })
          .where(and(
            eq(this.schema.letheEventParticipation.goalId, goalId),
            eq(this.schema.letheEventParticipation.userId, userId)
          ));
      } else {
        await this.db.insert(this.schema.letheEventParticipation).values({
          eventId: 'community',
          goalId,
          userId,
          contribution
        });
      }
    } catch (error) {
      console.error('Error recording participation:', error.message);
    }
  }

  async getTopContributors(goalId, limit = 10) {
    if (!this.db || !this.schema) return [];
    
    try {
      return await this.db.select()
        .from(this.schema.letheEventParticipation)
        .where(eq(this.schema.letheEventParticipation.goalId, goalId))
        .orderBy(sql`${this.schema.letheEventParticipation.contribution} DESC`)
        .limit(limit);
    } catch (error) {
      console.error('Error getting top contributors:', error.message);
      return [];
    }
  }

  async claimCommunityReward(userId, goalId) {
    if (!this.db || !this.schema) return null;
    
    try {
      const goal = await this.db.select()
        .from(this.schema.letheCommunityGoals)
        .where(and(
          eq(this.schema.letheCommunityGoals.goalId, goalId),
          eq(this.schema.letheCommunityGoals.isCompleted, true)
        ))
        .limit(1);
      
      if (goal.length === 0) return { error: 'Hedef henüz tamamlanmadı!' };
      
      const participation = await this.db.select()
        .from(this.schema.letheEventParticipation)
        .where(and(
          eq(this.schema.letheEventParticipation.goalId, goalId),
          eq(this.schema.letheEventParticipation.userId, userId)
        ))
        .limit(1);
      
      if (participation.length === 0) return { error: 'Bu hedefe katkıda bulunmadın!' };
      if (participation[0].rewardClaimed) return { error: 'Ödülünü zaten aldın!' };
      
      await this.db.update(this.schema.letheEventParticipation)
        .set({ rewardClaimed: true })
        .where(and(
          eq(this.schema.letheEventParticipation.goalId, goalId),
          eq(this.schema.letheEventParticipation.userId, userId)
        ));
      
      return {
        success: true,
        coins: goal[0].rewardCoins,
        gems: goal[0].rewardGems,
        contribution: participation[0].contribution
      };
    } catch (error) {
      console.error('Error claiming community reward:', error.message);
      return { error: 'Bir hata oluştu!' };
    }
  }

  async createSpecialEvent(name, description, type, multiplier, durationHours, bonusData = {}) {
    if (!this.db || !this.schema) return null;
    
    const now = new Date();
    const endTime = new Date(now.getTime() + durationHours * 60 * 60 * 1000);
    const eventId = `special_${Date.now()}`;
    
    try {
      await this.db.insert(this.schema.letheEvents).values({
        eventId,
        name,
        description,
        type,
        multiplier,
        bonusData,
        startTime: now,
        endTime,
        isActive: true,
        isRecurring: false
      });
      
      await this.loadActiveEvents();
      return this.activeEvents.get(eventId);
    } catch (error) {
      console.error('Error creating special event:', error.message);
      return null;
    }
  }

  formatTimeRemaining(endTime) {
    const now = new Date();
    const diff = endTime - now;
    
    if (diff <= 0) return 'Bitti';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} gün ${hours % 24} saat`;
    }
    
    return `${hours} saat ${minutes} dakika`;
  }
}

const eventSystem = new EventSystem();

module.exports = {
  eventSystem,
  EVENT_TYPES,
  EVENT_EMOJIS
};
