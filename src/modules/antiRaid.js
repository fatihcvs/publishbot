const { EmbedBuilder, PermissionsBitField, GuildVerificationLevel } = require('discord.js');

class AntiRaidSystem {
    constructor(client, storage) {
        this.client = client;
        this.storage = storage;
        this.joinTracker = new Map(); // guildId => Array of join timestamps
        this.raidCooldowns = new Map(); // guildId => cooldown timestamp to prevent repeated actions
    }

    async checkRaid(member) {
        const guildId = member.guild.id;
        const guildData = await this.storage.getGuild(guildId);

        // Check if anti-raid is enabled for this guild
        const antiraidConfig = guildData?.antiraidConfig || {};
        if (!antiraidConfig.enabled) return false;

        const threshold = antiraidConfig.threshold || 5; // joins
        const timeFrame = (antiraidConfig.timeFrame || 10) * 1000; // seconds -> ms
        const action = antiraidConfig.action || 'kick'; // 'kick', 'ban', 'alert'
        const accountAgeDays = antiraidConfig.accountAgeDays || 0;

        // 1. Account Age Check
        if (accountAgeDays > 0) {
            const now = new Date();
            const accountCreatedAt = member.user.createdAt;
            const ageInDays = (now - accountCreatedAt) / (1000 * 60 * 60 * 24);

            if (ageInDays < accountAgeDays) {
                await this.takeAction(member, action, `Hesap yaşı çok yeni (${Math.round(ageInDays)} gün). Gerekli: ${accountAgeDays} gün. (Anti-Raid Sistemi)`);
                return true; // Handled as raid/suspicious
            }
        }

        // 2. Mass Join Check
        const now = Date.now();
        if (!this.joinTracker.has(guildId)) {
            this.joinTracker.set(guildId, []);
        }

        const joins = this.joinTracker.get(guildId);
        // Remove expired joins
        const recentJoins = joins.filter(timestamp => now - timestamp.time < timeFrame);
        recentJoins.push({ id: member.id, time: now });
        this.joinTracker.set(guildId, recentJoins);

        if (recentJoins.length >= threshold) {
            // Trigger Raid Mode!
            if (!this.raidCooldowns.has(guildId) || now > this.raidCooldowns.get(guildId)) {
                await this.handleRaid(member.guild, recentJoins, action, antiraidConfig);
                // Cooldown for raid alerts/actions: 5 minutes
                this.raidCooldowns.set(guildId, now + 5 * 60 * 1000);
            } else if (action === 'kick' || action === 'ban') {
                // Still under raid mode -> continue punishing
                await this.takeAction(member, action, `Raid Modu Aktif: Toplu giriş saldırısı tespit edildi.`);
            }
            return true;
        }

        return false;
    }

    async takeAction(member, action, reason) {
        try {
            if (!member.kickable || !member.bannable) return;

            if (action === 'kick') {
                await member.kick(reason);
            } else if (action === 'ban') {
                await member.ban({ reason });
            }
        } catch (error) {
            console.error(`[AntiRaid] Failed to take action (${action}) on ${member.id}:`, error);
        }
    }

    async handleRaid(guild, participants, action, config) {
        console.log(`[AntiRaid] Raid detected in ${guild.name} (${guild.id})! Participansts: ${participants.length}`);

        // Attempt to raise verification level if it's not already high
        if (guild.members.me.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            try {
                if (guild.verificationLevel < GuildVerificationLevel.High) {
                    await guild.setVerificationLevel(GuildVerificationLevel.High, 'Anti-Raid: Otomatik koruma devrede.');
                }
            } catch (e) {
                console.error('[AntiRaid] Güvenlik seviyesi artırılamadı:', e);
            }
        }

        // Punish the collected accounts
        if (action === 'kick' || action === 'ban') {
            for (const p of participants) {
                try {
                    const member = await guild.members.fetch(p.id);
                    if (member) {
                        await this.takeAction(member, action, `Raid Saldırısı Tespiti (${config.threshold} giriş / ${config.timeFrame || 10} sn)`);
                    }
                } catch (e) { } // Member might have left already
            }
        }

        this.sendLog(guild, participants.length, action, config);
    }

    async sendLog(guild, joinCount, action, config) {
        const guildData = await this.storage.getGuild(guild.id);
        const targetLogChannel = guildData?.modLogChannel || guildData?.logChannel;
        if (!targetLogChannel) return;

        try {
            const logChannel = await guild.channels.fetch(targetLogChannel);
            if (!logChannel) return;

            const actionName = action === 'ban' ? 'Banlandi' : action === 'kick' ? 'Kicklendi' : 'Sadece Uyarı';

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🚨 DİKKAT: RAID SALDIRISI TESPİT EDİLDİ 🚨')
                .setDescription('Sunucunuza olağandışı bir üye girişi dalgası / bot saldırısı saptandı!')
                .addFields(
                    { name: 'Tespit Edilen', value: `${config.timeFrame || 10} saniyede ${joinCount} giriş!`, inline: true },
                    { name: 'Uygulanan İşlem', value: actionName, inline: true },
                    { name: 'Güvenlik Önlemi', value: 'Sunucu doğrulama seviyesi geçici olarak (Yüksek) düzeyine çekildi.', inline: false }
                )
                .setTimestamp()
                .setFooter({ text: 'Anti-Raid Sistemi Devrede' });

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('[AntiRaid] Log sending failed:', error);
        }
    }
}

module.exports = AntiRaidSystem;
