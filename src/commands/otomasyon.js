const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'otomasyon',
    aliases: ['automation', 'auto', 'ifthen'],
    description: 'IF-THEN otomasyon kuralları: üye katılma, ayrılma gibi olaylarda otomatik aksiyonlar.',
    usage: '!otomasyon [ekle|liste|sil|aç|kapat]',
    permissions: [PermissionFlagsBits.ManageGuild],

    async execute(message, args, client) {
        const { db } = require('../database/db');
        const sub = args[0]?.toLowerCase();

        switch (sub) {
            case 'ekle': case 'add':
                return this.add(message, args.slice(1), db, client);
            case 'liste': case 'list':
                return this.list(message, db);
            case 'sil': case 'delete': case 'remove':
                return this.del(message, args.slice(1), db);
            case 'aç': case 'ac': case 'on': case 'kapat': case 'off':
                return this.toggle(message, args, db);
            default:
                return this.sendHelp(message);
        }
    },

    async add(message, args, db, client) {
        // Format: !otomasyon ekle <ad> <tetikleyici> <aksiyon> [koşul]
        // Tetikleyiciler: uje_katildi, uye_ayrildi, mesaj_iceriyor:<kelime>
        // Aksiyonlar: rol_ver:<rol_id>, rol_al:<rol_id>, mesaj_gondir:#kanal:<metin>, dm_gonder:<metin>
        // Örnek: !otomasyon ekle hosgel uye_katildi rol_ver:123456789
        if (args.length < 3) {
            return message.reply([
                '❌ Kullanım: `!otomasyon ekle <ad> <tetikleyici> <aksiyon>`',
                '',
                '**Tetikleyiciler:**',
                '• `uye_katildi` — Sunucuya üye katıldı',
                '• `uye_ayrildi` — Üye sunucudan ayrıldı',
                '• `mesaj_iceriyor:<kelime>` — Mesajda belirli kelime var',
                '',
                '**Aksiyonlar:**',
                '• `rol_ver:<@rol>` — Rol ver',
                '• `rol_al:<@rol>` — Rol al',
                '• `mesaj_gonder:<#kanal>:<metin>` — Kanala mesaj gönder',
                '• `dm_gonder:<metin>` — Üyeye DM gönder',
                '',
                '**Örnek:**',
                '`!otomasyon ekle yeni-uye uye_katildi rol_ver:@Member`'
            ].join('\n')).catch(() => { });
        }

        const name = args[0];
        const trigger = args[1];
        const action = args.slice(2).join(' ');

        // Tetikleyici doğrulama
        const validTriggers = ['uye_katildi', 'uye_ayrildi', 'mesaj_iceriyor'];
        const triggerBase = trigger.split(':')[0];
        if (!validTriggers.includes(triggerBase)) {
            return message.reply(`❌ Geçersiz tetikleyici: \`${triggerBase}\`\nKullanılabilir: ${validTriggers.map(t => `\`${t}\``).join(', ')}`).catch(() => { });
        }

        // Aksiyon parse
        const actionBase = action.split(':')[0];
        const validActions = ['rol_ver', 'rol_al', 'mesaj_gonder', 'dm_gonder'];
        if (!validActions.includes(actionBase)) {
            return message.reply(`❌ Geçersiz aksiyon: \`${actionBase}\`\nKullanılabilir: ${validActions.map(a => `\`${a}\``).join(', ')}`).catch(() => { });
        }

        // Rol ID çıkar
        let actionData = {};
        if (actionBase === 'rol_ver' || actionBase === 'rol_al') {
            const roleId = action.split(':')[1]?.replace(/[<@&>]/g, '');
            const role = message.guild.roles.cache.get(roleId) || message.mentions.roles.first();
            if (!role) return message.reply('❌ Geçerli bir rol etiketleyin.').catch(() => { });
            actionData = { type: actionBase, roleId: role.id };
        } else if (actionBase === 'mesaj_gonder') {
            const parts = action.split(':');
            const channelId = parts[1]?.replace(/[<#>]/g, '');
            const text = parts.slice(2).join(':');
            actionData = { type: 'mesaj_gonder', channelId, text };
        } else if (actionBase === 'dm_gonder') {
            actionData = { type: 'dm_gonder', text: action.split(':').slice(1).join(':') };
        }

        // Tetikleyici data
        const triggerData = { type: triggerBase };
        if (triggerBase === 'mesaj_iceriyor') {
            triggerData.keyword = trigger.split(':').slice(1).join(':');
        }

        try {
            const { automationRules } = require('../../shared/schema');
            await db.insert(automationRules).values({
                guildId: message.guild.id,
                name,
                trigger: triggerData,
                conditions: [],
                actions: [actionData],
                enabled: true,
                priority: 0
            });

            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#57F287')
                    .setTitle('✅ Otomasyon Kuralı Eklendi')
                    .addFields(
                        { name: 'Ad', value: name, inline: true },
                        { name: 'Tetikleyici', value: `\`${trigger}\``, inline: true },
                        { name: 'Aksiyon', value: `\`${actionBase}\``, inline: true }
                    )
                    .setFooter({ text: '!otomasyon liste ile görebilirsiniz.' })
                    .setTimestamp()]
            }).catch(() => { });
        } catch (err) {
            console.error('[otomasyon.add]', err);
            return message.reply('❌ Kural oluşturulurken bir hata oluştu. DB migration çalıştırıldı mı?').catch(() => { });
        }
    },

    async list(message, db) {
        try {
            const { automationRules } = require('../../shared/schema');
            const { eq } = require('drizzle-orm');
            const rules = await db.select().from(automationRules).where(eq(automationRules.guildId, message.guild.id));

            if (!rules.length) return message.reply('Bu sunucuda otomasyon kuralı yok.').catch(() => { });

            const lines = rules.map(r => {
                const trig = r.trigger?.type || '?';
                const acts = (r.actions || []).map(a => a.type).join(', ');
                return `${r.enabled ? '🟢' : '🔴'} **#${r.id} ${r.name}** — Tetik: \`${trig}\` → \`${acts}\``;
            });

            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle(`⚙️ Otomasyon Kuralları (${rules.length})`)
                    .setDescription(lines.join('\n'))
                    .setTimestamp()]
            }).catch(() => { });
        } catch (err) {
            return message.reply('❌ Kurallar yüklenemedi.').catch(() => { });
        }
    },

    async del(message, args, db) {
        const id = parseInt(args[0]);
        if (!id) return message.reply('❌ Kullanım: `!otomasyon sil <id>`').catch(() => { });
        try {
            const { automationRules } = require('../../shared/schema');
            const { eq, and } = require('drizzle-orm');
            await db.delete(automationRules).where(and(eq(automationRules.id, id), eq(automationRules.guildId, message.guild.id)));
            return message.reply(`✅ Kural #${id} silindi.`).catch(() => { });
        } catch (err) {
            return message.reply('❌ Silinemedi.').catch(() => { });
        }
    },

    async toggle(message, args, db) {
        const sub = args[0]?.toLowerCase();
        const id = parseInt(args[1]);
        if (!id) return message.reply('❌ Kullanım: `!otomasyon aç/kapat <id>`').catch(() => { });
        const enable = sub === 'aç' || sub === 'ac' || sub === 'on';
        try {
            const { automationRules } = require('../../shared/schema');
            const { eq, and } = require('drizzle-orm');
            await db.update(automationRules).set({ enabled: enable }).where(and(eq(automationRules.id, id), eq(automationRules.guildId, message.guild.id)));
            return message.reply(`✅ Kural #${id} ${enable ? '**açıldı**' : '**kapatıldı**'}.`).catch(() => { });
        } catch (err) {
            return message.reply('❌ Güncelleme başarısız.').catch(() => { });
        }
    },

    sendHelp(message) {
        return message.reply({
            embeds: [new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('⚙️ Otomasyon Sistemi')
                .addFields(
                    { name: 'Ekle', value: '`!otomasyon ekle <ad> <tetikleyici> <aksiyon>`' },
                    { name: 'Listele', value: '`!otomasyon liste`' },
                    { name: 'Sil', value: '`!otomasyon sil <id>`' },
                    { name: 'Aç/Kapat', value: '`!otomasyon aç <id>` / `!otomasyon kapat <id>`' }
                )
                .setFooter({ text: 'Tetikleyiciler: uye_katildi | uye_ayrildi | mesaj_iceriyor:<kelime>' })]
        }).catch(() => { });
    }
};
