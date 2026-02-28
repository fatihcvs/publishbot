const { EmbedBuilder } = require('discord.js');
const { storage } = require('../database/storage');

module.exports = {
    name: 'sunucu-mağaza',
    aliases: ['sunucumagaza', 'sunucu-magaza', 'smagaza', 'smağaza'],
    description: 'Sunucunun özel mağazası — rol ve ünvan satın al.',
    usage: '!sunucu-mağaza [satın-al <id>]',

    async execute(message, args, client) {
        const sub = args[0]?.toLowerCase();

        if (sub === 'satın-al' || sub === 'satin-al' || sub === 'buy') {
            return this.buy(message, args.slice(1));
        }
        return this.show(message);
    },

    async show(message) {
        const items = await storage.getShopItems(message.guild.id);

        if (!items || items.length === 0) {
            return message.reply([
                '🏪 Bu sunucunun mağazasında henüz ürün yok.',
                'Moderatörler eklemek için: `!mağaza-yönet ekle <ad> <fiyat> rol/unvan [@rol]`'
            ].join('\n')).catch(() => { });
        }

        const balance = await storage.getUserBalance(message.author.id, message.guild.id);

        const lines = items.filter(i => i.stock !== 0).map(i => {
            const stockTxt = i.stock === null ? '∞' : i.stock;
            const roleTxt = i.roleId ? ` → <@&${i.roleId}>` : '';
            return `**#${i.id} ${i.name}** — 💰 ${i.price} coin${roleTxt}\n${i.description ? `> ${i.description}` : ''} _(Stok: ${stockTxt})_`;
        });

        return message.reply({
            embeds: [new EmbedBuilder()
                .setColor('#f59e0b')
                .setTitle('🏪 Sunucu Mağazası')
                .setDescription(lines.join('\n\n'))
                .setFooter({ text: `Bakiyeniz: ${balance} coin • Satın almak için: !sunucu-mağaza satın-al <id>` })
                .setTimestamp()]
        }).catch(() => { });
    },

    async buy(message, args) {
        const id = parseInt(args[0]);
        if (!id) return message.reply('❌ Kullanım: `!sunucu-mağaza satın-al <id>`').catch(() => { });

        const items = await storage.getShopItems(message.guild.id);
        const item = items.find(i => i.id === id);
        if (!item) return message.reply('❌ Bu ID\'ye ait ürün bulunamadı.').catch(() => { });
        if (item.stock === 0) return message.reply('❌ Bu ürün tükenmiş!').catch(() => { });

        const balance = await storage.getUserBalance(message.author.id, message.guild.id);
        if (balance < item.price) {
            return message.reply(`❌ Yetersiz bakiye! Gerekli: **${item.price}** coin, Mevcut: **${balance}** coin.`).catch(() => { });
        }

        // Bakiyeyi düş
        await storage.addToBalance(message.author.id, message.guild.id, -item.price);

        // Rol ver
        if (item.roleId) {
            const role = message.guild.roles.cache.get(item.roleId);
            if (role) {
                await message.member.roles.add(role).catch(() => { });
            }
        }

        // Ünvan (nickname prefix)
        if (item.type === 'unvan' && item.name) {
            const currentNick = message.member.nickname || message.author.username;
            await message.member.setNickname(`[${item.name}] ${currentNick}`).catch(() => { });
        }

        // Stok azalt
        if (item.stock !== null) {
            await storage.updateShopItemStock(id, item.stock - 1);
        }

        return message.reply({
            embeds: [new EmbedBuilder()
                .setColor('#57F287')
                .setTitle('✅ Satın Alma Başarılı!')
                .addFields(
                    { name: 'Ürün', value: item.name, inline: true },
                    { name: 'Ödenen', value: `${item.price} coin`, inline: true },
                    { name: 'Kalan', value: `${balance - item.price} coin`, inline: true }
                )
                .setTimestamp()]
        }).catch(() => { });
    }
};
