/**
 * Faz 9 — Anti-Abuse: Ekonomi farming tespiti ve şüpheli işlem loglama
 */

const FARM_WINDOW_MS = 60_000; // 1 dakika
const FARM_MAX_CALLS = 5;      // dakikada max 5 komut

// userId → [timestamp, timestamp, ...]
const farmMap = new Map();

/**
 * Returns true if user is farming (too many calls in window).
 * Also cleans expired entries.
 */
function checkFarm(userId) {
    const now = Date.now();
    const timestamps = (farmMap.get(userId) || []).filter(t => now - t < FARM_WINDOW_MS);
    timestamps.push(now);
    farmMap.set(userId, timestamps);
    return timestamps.length > FARM_MAX_CALLS;
}

/**
 * Detects suspiciously large coin changes and logs them.
 * @param {object} message - Discord message object
 * @param {number} amount  - Coin amount gained
 * @param {string} source  - Command name (e.g. 'çalış')
 * @param {number} THRESHOLD - Report threshold (default 10000)
 */
async function checkSuspiciousAmount(message, amount, source, THRESHOLD = 10_000) {
    if (!message?.guild) return;
    if (amount < THRESHOLD) return;

    try {
        const { EmbedBuilder } = require('discord.js');
        const { storage } = require('../database/storage');
        const guildData = await storage.getGuild(message.guild.id);
        const logChannelId = guildData?.modLogChannel || guildData?.logChannel;
        if (!logChannelId) return;

        const logChannel = message.guild.channels.cache.get(logChannelId);
        if (!logChannel) return;

        await logChannel.send({
            embeds: [new EmbedBuilder()
                .setColor('#FF6B35')
                .setTitle('⚠️ Şüpheli Ekonomi İşlemi')
                .addFields(
                    { name: 'Kullanıcı', value: `${message.author.tag} (${message.author.id})`, inline: true },
                    { name: 'Komut', value: `!${source}`, inline: true },
                    { name: 'Miktar', value: `${amount.toLocaleString()} 🪙`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Anti-Abuse Sistemi' })
            ]
        });
    } catch { /* sessizce geç */ }
}

/**
 * Clears farm data for a user (e.g. after cooldown reset)
 */
function resetFarm(userId) {
    farmMap.delete(userId);
}

module.exports = { checkFarm, checkSuspiciousAmount, resetFarm };
