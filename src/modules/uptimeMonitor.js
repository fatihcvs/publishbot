/**
 * Faz 9 — Uptime Monitor
 * Her 5 dakikada DB ping + Discord API ping.
 * Başarısız olursa BOT_OWNER_ID (DM) veya LOG_CHANNEL'a bildirim gönderir.
 */

const INTERVAL_MS = 5 * 60_000; // 5 dakika

let monitor = null;

function start(client, storage) {
    if (monitor) return; // zaten çalışıyor

    monitor = setInterval(async () => {
        const results = { db: false, discord: false };

        // 1) DB ping
        try {
            await storage.getGuild('__uptime_probe__');
            results.db = true;
        } catch { results.db = false; }

        // 2) Discord API ping
        try {
            results.discord = client.isReady() && client.ws.ping > 0;
        } catch { results.discord = false; }

        const allOk = results.db && results.discord;
        if (allOk) return;

        // Bildirim gönder
        const ownerId = process.env.BOT_OWNER_ID;
        const logChannelId = process.env.LOG_CHANNEL_ID;

        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setColor('#ED4245')
            .setTitle('🚨 Bot Servis Sorunu Tespit Edildi')
            .addFields(
                { name: 'Veritabanı', value: results.db ? '✅ OK' : '❌ Hata', inline: true },
                { name: 'Discord API', value: results.discord ? '✅ OK' : '❌ Yanıt yok', inline: true },
                { name: 'Ping', value: `${client.ws.ping ?? '?'} ms`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Publisher Uptime Monitor' });

        // DM'e gönder
        if (ownerId) {
            try {
                const owner = await client.users.fetch(ownerId);
                await owner.send({ embeds: [embed] });
            } catch { /* DM kapalı olabilir */ }
        }

        // Log kanalına gönder
        if (logChannelId) {
            try {
                const ch = client.channels.cache.get(logChannelId);
                if (ch) await ch.send({ embeds: [embed] });
            } catch { /* kanal yoksa geç */ }
        }

    }, INTERVAL_MS);

    monitor.unref(); // Node.js'in kapanmasını engellemesin
    console.log('[UptimeMonitor] Başlatıldı — her 5dk kontrol ediyor.');
}

function stop() {
    if (monitor) { clearInterval(monitor); monitor = null; }
}

module.exports = { start, stop };
