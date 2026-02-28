const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'etkinlik',
    aliases: ['event', 'etk'],
    description: 'Discord Zamanlanmış Etkinlikleri yönetir.',
    usage: '!etkinlik [oluştur/liste/iptal]',
    permissions: [PermissionFlagsBits.ManageEvents],

    async execute(message, args, client) {
        const sub = args[0]?.toLowerCase();
        switch (sub) {
            case 'oluştur': case 'olustur': case 'create':
                return this.create(message, args.slice(1), client);
            case 'liste': case 'list':
                return this.list(message, client);
            case 'iptal': case 'cancel': case 'sil':
                return this.cancel(message, args.slice(1), client);
            default:
                return this.sendHelp(message);
        }
    },

    async create(message, args, client) {
        // Kullanım: !etkinlik oluştur <tarih YYYY-MM-DD HH:MM> "<başlık>" "<açıklama>"
        // Tarih: args[0] = YYYY-MM-DD, args[1] = HH:MM, sonrası quoted
        const raw = args.join(' ');
        const titleMatch = raw.match(/"([^"]+)"/);
        const descMatch = raw.match(/"([^"]+)".*?"([^"]+)"/);

        const dateStr = args[0]; // YYYY-MM-DD
        const timeStr = args[1]; // HH:MM

        if (!dateStr || !timeStr || !titleMatch) {
            return message.reply([
                '❌ Kullanım: `!etkinlik oluştur <YYYY-MM-DD> <HH:MM> "<başlık>" "<açıklama>"`',
                '💡 Örnek: `!etkinlik oluştur 2026-03-15 20:00 "Turnuva" "1v1 oyun turnuvası"`'
            ].join('\n')).catch(() => { });
        }

        let startTime;
        try {
            startTime = new Date(`${dateStr}T${timeStr}:00`);
            if (isNaN(startTime.getTime())) throw new Error('Geçersiz tarih');
            if (startTime <= new Date()) return message.reply('❌ Başlangıç zamanı gelecekte olmalı!').catch(() => { });
        } catch {
            return message.reply('❌ Tarih formatı hatalı. Örnek: `2026-03-15 20:00`').catch(() => { });
        }

        const title = titleMatch[1];
        const description = descMatch?.[2] || '';

        try {
            const event = await message.guild.scheduledEvents.create({
                name: title,
                scheduledStartTime: startTime,
                privacyLevel: 2,       // GUILD_ONLY
                entityType: 3,         // EXTERNAL
                entityMetadata: { location: message.guild.name },
                description: description || undefined
            });

            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('📅 Etkinlik Oluşturuldu')
                .addFields(
                    { name: '🏷️ Başlık', value: event.name, inline: true },
                    { name: '📅 Başlangıç', value: `<t:${Math.floor(startTime.getTime() / 1000)}:F>`, inline: true },
                    { name: '🆔 ID', value: event.id, inline: true }
                )
                .setFooter({ text: '!etkinlik liste ile görüntüleyebilirsiniz.' })
                .setTimestamp();

            if (description) embed.addFields({ name: '📝 Açıklama', value: description });
            return message.reply({ embeds: [embed] }).catch(() => { });
        } catch (err) {
            console.error('[Event.create]', err);
            return message.reply('❌ Etkinlik oluşturulamadı. Botun "Etkinlik Yönet" yetkisi var mı?').catch(() => { });
        }
    },

    async list(message, client) {
        const events = await message.guild.scheduledEvents.fetch().catch(() => null);
        if (!events || events.size === 0) return message.reply('Bu sunucuda zamanlanmış etkinlik yok.').catch(() => { });

        const lines = events.map(e => {
            const ts = Math.floor(e.scheduledStartTimestamp / 1000);
            return `📅 **${e.name}** — <t:${ts}:R> • Katılımcı: ${e.userCount || 0} • ID: \`${e.id}\``;
        }).join('\n');

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('📅 Zamanlanmış Etkinlikler')
            .setDescription(lines)
            .setTimestamp();

        return message.reply({ embeds: [embed] }).catch(() => { });
    },

    async cancel(message, args, client) {
        const eventId = args[0];
        if (!eventId) return message.reply('❌ Kullanım: `!etkinlik iptal <etkinlik_id>`').catch(() => { });

        try {
            const event = await message.guild.scheduledEvents.fetch(eventId).catch(() => null);
            if (!event) return message.reply('Etkinlik bulunamadı!').catch(() => { });
            await event.delete('Moderatör tarafından iptal edildi');
            return message.reply(`✅ **${event.name}** etkinliği iptal edildi.`).catch(() => { });
        } catch (err) {
            console.error('[Event.cancel]', err);
            return message.reply('❌ Etkinlik iptal edilemedi.').catch(() => { });
        }
    },

    sendHelp(message) {
        const embed = new EmbedBuilder().setColor('#5865F2').setTitle('📅 Etkinlik Yönetimi')
            .addFields(
                { name: 'Oluştur', value: '`!etkinlik oluştur <YYYY-MM-DD> <HH:MM> "<başlık>" "<açıklama>"`' },
                { name: 'Listele', value: '`!etkinlik liste`' },
                { name: 'İptal', value: '`!etkinlik iptal <id>`' }
            );
        return message.reply({ embeds: [embed] }).catch(() => { });
    }
};
