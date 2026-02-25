const { db } = require('../database/db');
const { letheClans, letheClanMembers, userLetheProfile } = require('../../shared/schema');
const { eq, and, sql, desc, sum } = require('drizzle-orm');

class ClanSystem {
    // Klan oluşturma bedeli
    static CREATE_COST = 50000;

    // Max üye sayısı (Seviye başına +5 artar)
    static getMaxMembers(level) {
        return 10 + (level * 5);
    }

    // Sonraki seviye için gereken XP
    static getRequiredXp(currentLevel) {
        return currentLevel * 5000;
    }

    /**
     * Kullanıcının klanını getirir
     */
    async getUserClan(userId) {
        if (!db) return null;

        const memberRecord = await db.select()
            .from(letheClanMembers)
            .where(eq(letheClanMembers.userId, userId))
            .limit(1);

        if (memberRecord.length === 0) return null;

        const clanRecord = await db.select()
            .from(letheClans)
            .where(eq(letheClans.id, memberRecord[0].clanId))
            .limit(1);

        if (clanRecord.length === 0) return null;

        return {
            ...clanRecord[0],
            memberData: memberRecord[0]
        };
    }

    /**
     * Bir klanın tüm üyelerini getirir
     */
    async getClanMembers(clanId) {
        if (!db) return [];
        return await db.select()
            .from(letheClanMembers)
            .where(eq(letheClanMembers.clanId, clanId))
            .orderBy(desc(letheClanMembers.contributionXp));
    }

    /**
     * Klan etiketiyle arama
     */
    async getClanByTag(tag) {
        if (!db) return null;
        const clanRecord = await db.select()
            .from(letheClans)
            .where(eq(letheClans.id, tag.toUpperCase()))
            .limit(1);
        return clanRecord[0] || null;
    }

    /**
     * Adıyla arama
     */
    async getClanByName(name) {
        if (!db) return null;
        const clanRecord = await db.select()
            .from(letheClans)
            .where(sql`LOWER(${letheClans.name}) = LOWER(${name})`)
            .limit(1);
        return clanRecord[0] || null;
    }

    /**
     * Yeni bir klan oluşturur
     */
    async createClan(userId, name, tag) {
        if (!db) return { success: false, error: 'Veritabanı bağlantısı yok.' };

        const cleanTag = tag.toUpperCase();

        // Etiket ve isim kontrolü
        const existingTag = await this.getClanByTag(cleanTag);
        if (existingTag) return { success: false, error: 'Bu klan etiketi (Tag) zaten kullanılıyor.' };

        const existingName = await this.getClanByName(name);
        if (existingName) return { success: false, error: 'Bu klan adı zaten kullanılıyor.' };

        await db.insert(letheClans).values({
            id: cleanTag,
            name: name,
            leaderId: userId,
            level: 1,
            xp: 0,
            coins: 0
        });

        await db.insert(letheClanMembers).values({
            clanId: cleanTag,
            userId: userId,
            role: 'leader'
        });

        await db.update(userLetheProfile)
            .set({ clanId: cleanTag })
            .where(eq(userLetheProfile.visitorId, userId));

        return { success: true, clanId: cleanTag };
    }

    /**
     * Klana üye ekler
     */
    async joinClan(userId, clanId) {
        if (!db) return { success: false };

        const clan = await this.getClanByTag(clanId);
        if (!clan) return { success: false, error: 'Klan bulunamadı.' };

        const members = await this.getClanMembers(clanId);
        if (members.length >= ClanSystem.getMaxMembers(clan.level)) {
            return { success: false, error: 'Klan maksimum üye sayısına ulaşmış.' };
        }

        await db.insert(letheClanMembers).values({
            clanId: clanId,
            userId: userId,
            role: 'member'
        });

        await db.update(userLetheProfile)
            .set({ clanId: clanId })
            .where(eq(userLetheProfile.visitorId, userId));

        return { success: true };
    }

    /**
     * Klandan ayrılma veya atılma
     */
    async leaveClan(userId) {
        if (!db) return { success: false };

        const clan = await this.getUserClan(userId);
        if (!clan) return { success: false, error: 'Zaten bir klanda değilsin.' };

        if (clan.memberData.role === 'leader') {
            const allMembers = await this.getClanMembers(clan.id);
            if (allMembers.length > 1) {
                return { success: false, error: 'Lider klandan ayrılamaz. Önce liderliği başkasına devretmelisin veya klanı dağıtmalısın.' };
            }

            // Tek üye liderse ve çıkıyorsa klanı dağıt
            await db.delete(letheClans).where(eq(letheClans.id, clan.id));
        }

        await db.delete(letheClanMembers)
            .where(and(eq(letheClanMembers.clanId, clan.id), eq(letheClanMembers.userId, userId)));

        await db.update(userLetheProfile)
            .set({ clanId: null })
            .where(eq(userLetheProfile.visitorId, userId));

        return { success: true };
    }

    /**
     * Klana XP ve Altın Ekler (Bağış yapma veya görevler üzerinden)
     */
    async addClanProgress(clanId, userId, amountCoin, amountXp) {
        if (!db) return { success: false };

        const clan = await this.getClanByTag(clanId);
        if (!clan) return { success: false };

        let newXp = clan.xp + amountXp;
        let newLevel = clan.level;
        let requiredXp = ClanSystem.getRequiredXp(newLevel);
        let leveledUp = false;

        // Seviye atlama kontrolü
        while (newXp >= requiredXp && newLevel < 50) {
            newXp -= requiredXp;
            newLevel++;
            requiredXp = ClanSystem.getRequiredXp(newLevel);
            leveledUp = true;
        }

        // Klanı güncelle
        await db.update(letheClans)
            .set({
                coins: sql`${letheClans.coins} + ${amountCoin}`,
                xp: newXp,
                level: newLevel
            })
            .where(eq(letheClans.id, clanId));

        // Üyenin şahsi katkısını güncelle
        await db.update(letheClanMembers)
            .set({
                contributionCoins: sql`${letheClanMembers.contributionCoins} + ${amountCoin}`,
                contributionXp: sql`${letheClanMembers.contributionXp} + ${amountXp}`
            })
            .where(and(eq(letheClanMembers.clanId, clanId), eq(letheClanMembers.userId, userId)));

        return { success: true, leveledUp, oldLevel: clan.level, newLevel };
    }

    /**
     * Leaderboard için klanları getirir
     */
    async getTopClans(limit = 10, by = 'level') {
        if (!db) return [];

        const orderClause = by === 'coins' ? desc(letheClans.coins) : desc(letheClans.level);

        return await db.select()
            .from(letheClans)
            .orderBy(orderClause, desc(letheClans.xp))
            .limit(limit);
    }
}

const clanSystem = new ClanSystem();
module.exports = { clanSystem, ClanSystem };
