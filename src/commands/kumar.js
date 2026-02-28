const { EmbedBuilder } = require('discord.js');
const { storage } = require('../database/storage');

const DAILY_LIMIT = 5000; // coin
const HOUSE_EDGE = 0.10; // %10 hazineye

const SLOT_EMOJIS = ['🍒', '🍋', '🍊', '🍇', '⭐', '7️⃣'];
const SLOT_MULTI = { '7️⃣': 10, '⭐': 5, '🍇': 3, '🍊': 2, '🍋': 1.5, '🍒': 1.2 };

module.exports = {
    name: 'kumar',
    aliases: ['gamble', 'casino', 'slot', 'blackjack', 'rulet', 'zar'],
    description: 'Kumar oyunları: slot, blackjack, rulet, zar.',
    usage: '!kumar <slot|blackjack|rulet|zar> <miktar>',

    async execute(message, args, client) {
        // alias ile direkt oyun çağrısı
        const cmdName = message.content.split(' ')[0].slice(1).toLowerCase();
        const directGames = ['slot', 'blackjack', 'rulet', 'zar'];
        if (directGames.includes(cmdName)) {
            return this[cmdName](message, args);
        }

        const sub = args[0]?.toLowerCase();
        if (sub === 'slot') return this.slot(message, args.slice(1));
        if (sub === 'blackjack') return this.blackjack(message, args.slice(1));
        if (sub === 'rulet') return this.rulet(message, args.slice(1));
        if (sub === 'zar') return this.zar(message, args.slice(1));
        return this.sendHelp(message);
    },

    async _checkBet(message, args) {
        const amount = parseInt(args[0]);
        if (!amount || amount < 10) {
            await message.reply('❌ Minimum bahis: 10 coin.').catch(() => { });
            return null;
        }
        const balance = await storage.getUserBalance(message.author.id, message.guild.id);
        if (balance < amount) {
            await message.reply(`❌ Yetersiz bakiye! Bakiye: **${balance}** coin.`).catch(() => { });
            return null;
        }
        // Günlük limit
        const spentToday = await storage.getDailyGambleSpent(message.author.id, message.guild.id);
        if (spentToday + amount > DAILY_LIMIT) {
            await message.reply(`❌ Günlük kumar limiti: **${DAILY_LIMIT}** coin. Bugün harcadın: **${spentToday}** coin.`).catch(() => { });
            return null;
        }
        return { amount, balance };
    },

    async _settle(userId, guildId, bet, winMulti) {
        // winMulti: >0 = kazandı, 0 = berabere, <0 = kaybetti
        const net = Math.floor(bet * winMulti);
        await storage.addToBalance(userId, guildId, net);
        await storage.addDailyGambleSpent(userId, guildId, bet);
        if (net < 0) {
            // Kayıpların %10'u hazineye
            await storage.addToTreasury(guildId, Math.floor(Math.abs(net) * HOUSE_EDGE));
        }
        return net;
    },

    // ── SLOT ──────────────────────────────────────────────────────────────────
    async slot(message, args) {
        const bet = await this._checkBet(message, args);
        if (!bet) return;

        const reel = () => SLOT_EMOJIS[Math.floor(Math.random() * SLOT_EMOJIS.length)];
        const [a, b, c] = [reel(), reel(), reel()];
        const result = `${a} ${b} ${c}`;

        let multi = 0;
        if (a === b && b === c) {
            multi = SLOT_MULTI[a] ?? 1;
        } else if (a === b || b === c || a === c) {
            multi = 0.5;
        }

        const net = await this._settle(message.author.id, message.guild.id, bet.amount, multi - 1);
        const won = multi > 0;

        return message.reply({
            embeds: [new EmbedBuilder()
                .setColor(won ? '#57F287' : '#ED4245')
                .setTitle(`🎰 Slot Makinesi`)
                .setDescription(`╔══╗\n║ ${result} ║\n╚══╝`)
                .addFields(
                    { name: 'Bahis', value: `${bet.amount} coin`, inline: true },
                    { name: won ? '🎉 Kazanç' : '💸 Kayıp', value: `${Math.abs(net)} coin`, inline: true },
                    { name: 'Çarpan', value: multi > 0 ? `×${multi}` : '—', inline: true }
                )
                .setTimestamp()]
        }).catch(() => { });
    },

    // ── BLACKJACK ─────────────────────────────────────────────────────────────
    async blackjack(message, args) {
        const bet = await this._checkBet(message, args);
        if (!bet) return;

        const deck = () => Math.min(Math.floor(Math.random() * 13) + 1, 10);
        let player = deck() + deck();
        let dealer = deck() + deck();
        const bust = (n) => n > 21;

        // Basit bot mantığı: dealer 17'de durunca
        while (dealer < 17) dealer += deck();

        let multi;
        if (bust(player)) multi = -1;
        else if (bust(dealer)) multi = 1;
        else if (player > dealer) multi = 1;
        else if (player < dealer) multi = -1;
        else multi = 0;

        const net = await this._settle(message.author.id, message.guild.id, bet.amount, multi);
        const result = multi > 0 ? '🎉 Kazandın!' : multi < 0 ? '💸 Kaybettin!' : '🤝 Berabere!';

        return message.reply({
            embeds: [new EmbedBuilder()
                .setColor(multi > 0 ? '#57F287' : multi < 0 ? '#ED4245' : '#FEE75C')
                .setTitle('🃏 Blackjack')
                .addFields(
                    { name: '🧑 Senin Elin', value: `${player}`, inline: true },
                    { name: '🤖 Dealer', value: `${dealer}`, inline: true },
                    { name: 'Sonuç', value: result, inline: true },
                    { name: 'Net', value: `${net >= 0 ? '+' : ''}${net} coin`, inline: true }
                )
                .setTimestamp()]
        }).catch(() => { });
    },

    // ── RULET ─────────────────────────────────────────────────────────────────
    async rulet(message, args) {
        const bet = await this._checkBet(message, args);
        if (!bet) return;

        const choice = args[1]?.toLowerCase();
        if (!choice) return message.reply('❌ Kullanım: `!rulet <miktar> <kırmızı|siyah|0-36>`').catch(() => { });

        const num = Math.floor(Math.random() * 37); // 0-36
        const red = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
        const color = num === 0 ? 'yeşil' : red.includes(num) ? 'kırmızı' : 'siyah';

        let multi = -1; // kaybetme
        if (choice === 'kırmızı' || choice === 'kirmizi' || choice === 'red') {
            if (color === 'kırmızı') multi = 1;
        } else if (choice === 'siyah' || choice === 'black') {
            if (color === 'siyah') multi = 1;
        } else {
            const numChoice = parseInt(choice);
            if (!isNaN(numChoice) && numChoice === num) multi = 35;
        }

        const net = await this._settle(message.author.id, message.guild.id, bet.amount, multi);

        return message.reply({
            embeds: [new EmbedBuilder()
                .setColor(multi > 0 ? '#57F287' : '#ED4245')
                .setTitle('🎡 Rulet')
                .addFields(
                    { name: 'Top Durdu', value: `**${num}** — ${color === 'kırmızı' ? '🔴' : color === 'siyah' ? '⚫' : '🟢'} ${color}`, inline: true },
                    { name: 'Tahminin', value: choice, inline: true },
                    { name: 'Net', value: `${net >= 0 ? '+' : ''}${net} coin`, inline: true }
                )
                .setTimestamp()]
        }).catch(() => { });
    },

    // ── ZAR ───────────────────────────────────────────────────────────────────
    async zar(message, args) {
        const bet = await this._checkBet(message, args);
        if (!bet) return;

        const player = Math.floor(Math.random() * 6) + 1;
        const bot = Math.floor(Math.random() * 6) + 1;
        const multi = player > bot ? 1 : player < bot ? -1 : 0;
        const net = await this._settle(message.author.id, message.guild.id, bet.amount, multi);

        const dices = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

        return message.reply({
            embeds: [new EmbedBuilder()
                .setColor(multi > 0 ? '#57F287' : multi < 0 ? '#ED4245' : '#FEE75C')
                .setTitle('🎲 Zar Yarışması')
                .addFields(
                    { name: '🧑 Sen', value: `${dices[player - 1]} (${player})`, inline: true },
                    { name: '🤖 Bot', value: `${dices[bot - 1]} (${bot})`, inline: true },
                    { name: 'Net', value: `${net >= 0 ? '+' : ''}${net} coin`, inline: true }
                )
                .setTimestamp()]
        }).catch(() => { });
    },

    sendHelp(message) {
        return message.reply({
            embeds: [new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('🎰 Kumar Oyunları')
                .addFields(
                    { name: 'Slot', value: '`!kumar slot <miktar>`' },
                    { name: 'Blackjack', value: '`!kumar blackjack <miktar>`' },
                    { name: 'Rulet', value: '`!kumar rulet <miktar> <kırmızı|siyah|0-36>`' },
                    { name: 'Zar', value: '`!kumar zar <miktar>`' }
                )
                .setFooter({ text: `Günlük limit: ${DAILY_LIMIT} coin • Kazancın %10'u hazineye gider` })]
        }).catch(() => { });
    }
};
