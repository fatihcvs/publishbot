const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { storage } = require('../database/storage');

module.exports = {
    name: 'mağaza-yönet',
    aliases: ['magaza-yonet', 'mağaza-yönetim', 'shop-admin', 'mağaza-yönetici'],
    description: 'Sunucu mağazasını yönet: ürün ekle/sil/stok.',
    usage: '!mağaza-yönet [ekle|sil|stok|liste]',
    permissions: [PermissionFlagsBits.ManageGuild],

    async execute(message, args, client) {
        const sub = args[0]?.toLowerCase();

        switch (sub) {
            case 'ekle': case 'add':
                return this.add(message, args.slice(1));
            case 'sil': case 'delete': case 'remove':
                return this.del(message, args.slice(1));
            case 'stok': case 'stock':
                return this.setStock(message, args.slice(1));
            case 'liste': case 'list':
                return this.list(message);
            default:
                return this.sendHelp(message);
        }
    },

    async add(message, args) {
        // Format: ekle <ad> <fiyat> <tip: rol|unvan|özel> [@rol] [açıklama]
        const name = args[0];
        const price = parseInt(args[1]);
        const type = args[2]?.toLowerCase() || 'özel';

        if (!name || !price || price < 1) {
            return message.reply('❌ Kullanım: `!mağaza-yönet ekle <ad> <fiyat> [rol|unvan|özel] [@rol]`').catch(() => { });
        }

        const roleId = message.mentions.roles.first()?.id || null;
        if (type === 'rol' && !roleId) {
            return message.reply('❌ Rol tipi seçtiniz ama rol etiketlemediniz.').catch(() => { });
        }

        const item = await storage.addShopItem(message.guild.id, {
            name,
            price,
            type,
            roleId,
            description: args.slice(roleId ? 4 : 3).join(' ') || null,
            stock: null // sonsuz
        });

        return message.reply({
            embeds: [new EmbedBuilder()
                .setColor('#57F287')
                .setTitle('✅ Mağazaya Ürün Eklendi')
                .addFields(
                    { name: 'Ad', value: name, inline: true },
                    { name: 'Fiyat', value: `${price} coin`, inline: true },
                    { name: 'Tip', value: type, inline: true },
                    { name: 'ID', value: `#${item?.id || '?'}`, inline: true }
                )
                .setTimestamp()]
        }).catch(() => { });
    },

    async del(message, args) {
        const id = parseInt(args[0]);
        if (!id) return message.reply('❌ Kullanım: `!mağaza-yönet sil <id>`').catch(() => { });
        await storage.removeShopItem(message.guild.id, id);
        return message.reply(`✅ Ürün #${id} mağazadan kaldırıldı.`).catch(() => { });
    },

    async setStock(message, args) {
        const id = parseInt(args[0]);
        const amount = parseInt(args[1]);
        if (!id || isNaN(amount)) return message.reply('❌ Kullanım: `!mağaza-yönet stok <id> <adet>` (sonsuz için -1)').catch(() => { });
        await storage.updateShopItemStock(id, amount === -1 ? null : amount);
        return message.reply(`✅ #${id} stok güncellendi → ${amount === -1 ? '∞' : amount}`).catch(() => { });
    },

    async list(message) {
        const items = await storage.getShopItems(message.guild.id);
        if (!items || !items.length) return message.reply('Mağazada ürün yok.').catch(() => { });

        const lines = items.map(i =>
            `**#${i.id}** ${i.name} — ${i.price} coin | Tip: ${i.type} | Stok: ${i.stock === null ? '∞' : i.stock}${i.roleId ? ` | <@&${i.roleId}>` : ''}`
        );

        return message.reply({
            embeds: [new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle(`🏪 Mağaza Yönetimi (${items.length} ürün)`)
                .setDescription(lines.join('\n'))
                .setTimestamp()]
        }).catch(() => { });
    },

    sendHelp(message) {
        return message.reply({
            embeds: [new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('🏪 Mağaza Yönetimi')
                .addFields(
                    { name: 'Ekle', value: '`!mağaza-yönet ekle <ad> <fiyat> [rol|unvan|özel] [@rol]`' },
                    { name: 'Sil', value: '`!mağaza-yönet sil <id>`' },
                    { name: 'Stok', value: '`!mağaza-yönet stok <id> <adet>` (-1 = sonsuz)' },
                    { name: 'Liste', value: '`!mağaza-yönet liste`' }
                )]
        }).catch(() => { });
    }
};
