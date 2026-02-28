const { EmbedBuilder } = require('discord.js');
const { isPremium, PLANS } = require('../modules/premium');

module.exports = {
    name: 'premium',
    aliases: ['premium-durum', 'vip'],
    description: 'Sunucunun premium durumunu görüntüle.',
    usage: '!premium',

    async execute(message, args, client, storage) {
        const guildData = await storage.getGuild(message.guild.id);

        const hasPremium = await isPremium(message.guild.id, storage);
        const plan = guildData?.premiumPlan || 'basic';
        const planInfo = PLANS[plan] || PLANS.basic;
        const expiresAt = guildData?.premiumExpiresAt;

        if (!hasPremium) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#7d8094')
                    .setTitle('⚫ Premium Yok')
                    .setDescription([
                        'Bu sunucuda **Publisher Premium** aktif değil.',
                        '',
                        '**Premium Avantajlar:**',
                        '• ⭐ Basic — Müzik sistemi + Gelişmiş analitik',
                        '• 💎 Pro — Sınırsız özel komut + Custom prefix',
                        '• 🚀 Unlimited — Tüm özellikler + Öncelikli destek',
                        '',
                        'Premium için bot sahibiyle iletişime geçin.'
                    ].join('\n'))
                    .setFooter({ text: 'Publisher Premium' })
                    .setTimestamp()]
            }).catch(() => { });
        }

        const expireTxt = expiresAt
            ? `<t:${Math.floor(new Date(expiresAt).getTime() / 1000)}:F>`
            : '♾️ Süresiz';

        return message.reply({
            embeds: [new EmbedBuilder()
                .setColor(planInfo.color)
                .setTitle(`✨ Premium Aktif — ${planInfo.label}`)
                .addFields(
                    { name: '📅 Bitiş', value: expireTxt, inline: true },
                    { name: '🏠 Sunucu', value: message.guild.name, inline: true }
                )
                .setThumbnail(message.guild.iconURL())
                .setFooter({ text: 'Publisher Premium • Teşekkürler!' })
                .setTimestamp()]
        }).catch(() => { });
    }
};
