const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { storage } = require('../database/storage');

module.exports = {
    name: 'şablon',
    aliases: ['sablon', 'template', 'mesaj-sablon'],
    description: 'Sistem mesajı şablonlarını özelleştir: hoşgeldin, veda, seviye atlama.',
    usage: '!şablon <tür> <metin> | !şablon önizle <tür>',
    permissions: [PermissionFlagsBits.ManageGuild],

    TYPES: {
        hosgeldin: 'welcome',
        hoşgeldin: 'welcome',
        welcome: 'welcome',
        veda: 'goodbye',
        goodbye: 'goodbye',
        seviyeatlama: 'levelup',
        'seviye-atlama': 'levelup',
        levelup: 'levelup',
    },

    DEFAULTS: {
        welcome: '👋 Merhaba {user}, **{server}** sunucusuna hoş geldin! Toplam üye sayısı: **{member_count}**',
        goodbye: '👋 **{username}** sunucudan ayrıldı. Kalan üye: **{member_count}**',
        levelup: '🎉 Tebrikler {user}! **{server}** sunucusunda **{level}**. seviyeye ulaştın!'
    },

    VARS: '`{user}` `{username}` `{server}` `{level}` `{member_count}` `{inviter}`',

    async execute(message, args, client) {
        const sub = args[0]?.toLowerCase();

        if (sub === 'önizle' || sub === 'onizle' || sub === 'preview') {
            return this.preview(message, args[1]);
        }
        if (sub === 'sıfırla' || sub === 'sifirla' || sub === 'reset') {
            return this.reset(message, args[1]);
        }
        if (sub === 'liste' || sub === 'list') {
            return this.list(message);
        }

        const typeKey = this.TYPES[sub];
        if (!typeKey) return this.sendHelp(message);

        const text = args.slice(1).join(' ');
        if (!text) return message.reply(`❌ Şablon metni boş olamaz!\nDeğişkenler: ${this.VARS}`).catch(() => { });

        await storage.setTemplate(message.guild.id, typeKey, text);
        return message.reply({
            embeds: [new EmbedBuilder()
                .setColor('#57F287')
                .setTitle('✅ Şablon Güncellendi')
                .addFields(
                    { name: 'Tür', value: typeKey, inline: true },
                    { name: 'Metin', value: text.slice(0, 200) }
                )
                .setFooter({ text: `!şablon önizle ${sub} ile test edebilirsiniz.` })
                .setTimestamp()]
        }).catch(() => { });
    },

    async preview(message, typeArg) {
        const typeKey = this.TYPES[typeArg?.toLowerCase() || ''] || typeArg;
        if (!typeKey || !this.DEFAULTS[typeKey]) {
            return message.reply(`❌ Geçerli türler: \`hosgeldin\`, \`veda\`, \`seviyeatlama\``).catch(() => { });
        }
        const template = await storage.getTemplate(message.guild.id, typeKey) || this.DEFAULTS[typeKey];
        const rendered = this.render(template, {
            user: `<@${message.author.id}>`,
            username: message.author.username,
            server: message.guild.name,
            level: '5',
            member_count: message.guild.memberCount,
            inviter: `<@${message.author.id}>`
        });
        return message.reply({
            embeds: [new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle(`👁️ Önizleme: ${typeKey}`)
                .setDescription(rendered)
                .setTimestamp()]
        }).catch(() => { });
    },

    async list(message) {
        const types = ['welcome', 'goodbye', 'levelup'];
        const fields = [];
        for (const t of types) {
            const tmpl = await storage.getTemplate(message.guild.id, t) || `_(varsayılan)_ ${this.DEFAULTS[t]}`;
            fields.push({ name: t, value: tmpl.slice(0, 100) + (tmpl.length > 100 ? '…' : '') });
        }
        return message.reply({ embeds: [new EmbedBuilder().setColor('#5865F2').setTitle('📋 Aktif Şablonlar').addFields(fields).setTimestamp()] }).catch(() => { });
    },

    async reset(message, typeArg) {
        const typeKey = this.TYPES[typeArg?.toLowerCase() || ''] || typeArg;
        if (!typeKey) return message.reply('❌ Geçerli tür belirt.').catch(() => { });
        await storage.setTemplate(message.guild.id, typeKey, null);
        return message.reply(`✅ \`${typeKey}\` şablonu varsayılana sıfırlandı.`).catch(() => { });
    },

    render(template, vars) {
        return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
    },

    sendHelp(message) {
        return message.reply({
            embeds: [new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('📋 Mesaj Şablonları')
                .addFields(
                    { name: 'Ayarla', value: '`!şablon hosgeldin <metin>`\n`!şablon veda <metin>`\n`!şablon seviyeatlama <metin>`' },
                    { name: 'Önizle', value: '`!şablon önizle hosgeldin`' },
                    { name: 'Listele', value: '`!şablon liste`' },
                    { name: 'Sıfırla', value: '`!şablon sıfırla hosgeldin`' },
                    { name: 'Değişkenler', value: this.VARS }
                )]
        }).catch(() => { });
    }
};
