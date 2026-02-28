const { EmbedBuilder } = require('discord.js');

const PLANS = {
    basic: { label: '⭐ Basic', color: '#FEE75C' },
    pro: { label: '💎 Pro', color: '#5865F2' },
    unlimited: { label: '🚀 Unlimited', color: '#EB459E' }
};

/**
 * Checks if a guild has active premium and returns true/false.
 * Uses storage.getGuild() — premium field in guild data.
 */
async function isPremium(guildId, storage) {
    try {
        const g = await storage.getGuild(guildId);
        if (!g?.premium) return false;
        if (g.premiumExpiresAt && new Date(g.premiumExpiresAt) < new Date()) {
            // Süresi dolmuş — arka planda kaldır
            storage.upsertGuild(guildId, { premium: false, premiumExpiresAt: null }).catch(() => { });
            return false;
        }
        return true;
    } catch { return false; }
}

/**
 * Guard for Discord.js commands.
 * Usage: if (!(await requirePremium(message, storage))) return;
 */
async function requirePremium(message, storage) {
    const ok = await isPremium(message.guild.id, storage);
    if (!ok) {
        await message.reply({
            embeds: [new EmbedBuilder()
                .setColor('#FEE75C')
                .setTitle('⭐ Premium Gerekiyor')
                .setDescription([
                    'Bu özellik **Publisher Premium** gerektirir.',
                    '',
                    '• Premium almak için sunucu yöneticinizle iletişime geçin.',
                    '• Bot sahibi admin panelinden aktif edebilir.',
                    '',
                    '`!premium` komutuyla mevcut durumunuzu görüntüleyebilirsiniz.'
                ].join('\n'))
                .setFooter({ text: 'Publisher Premium' })
                .setTimestamp()]
        }).catch(() => { });
        return false;
    }
    return true;
}

module.exports = { isPremium, requirePremium, PLANS };
