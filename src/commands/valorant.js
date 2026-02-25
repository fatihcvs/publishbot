const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

// Uses the Henrikdev API — free, no key required for some endpoints
// Rate limit: 30 req/min on free tier
const HENRIK_BASE = 'https://api.henrikdev.xyz/valorant/v1';

// Rank emoji map
const RANK_EMOJIS = {
    'Iron': '⚫', 'Bronze': '🟤', 'Silver': '⬜', 'Gold': '🟡',
    'Platinum': '🔵', 'Diamond': '💎', 'Ascendant': '🟢', 'Immortal': '🔴',
    'Radiant': '🌟', 'Unranked': '❓'
};

function getRankEmoji(rank) {
    const tier = Object.keys(RANK_EMOJIS).find(k => rank?.startsWith(k));
    return tier ? RANK_EMOJIS[tier] : '❓';
}

module.exports = {
    name: 'valorant',
    aliases: ['val', 'valostat', 'valstats'],
    description: 'Valorant oyuncu istatistiklerini gösterir.',
    usage: '!valorant [OyuncuAdı#TAG] [bölge=eu/na/ap/kr/br/latam]',
    cooldown: 10,

    async execute(message, args) {
        if (!args[0]) {
            return message.reply('❌ Kullanım: `!valorant OyuncuAdı#TAG` veya `!valorant OyuncuAdı#TAG eu`\nBölgeler: `eu` `na` `ap` `kr` `br` `latam`');
        }

        // Parse name#tag
        const inputFull = args[0];
        const region = (args[1] || 'eu').toLowerCase();

        if (!inputFull.includes('#')) {
            return message.reply('❌ Lütfen oyuncu adını **Ad#TAG** formatında girin. Örnek: `!valorant Shroud#NA1`');
        }

        const [name, tag] = inputFull.split('#');

        try {
            await message.channel.sendTyping();

            // Fetch MMR data (rank)
            const mmrRes = await axios.get(
                `${HENRIK_BASE}/mmr/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
                {
                    timeout: 8000,
                    headers: { 'User-Agent': 'Publisher-Bot/1.0' }
                }
            );

            const mmr = mmrRes.data?.data;
            if (!mmr) {
                return message.reply(`❌ **${inputFull}** için Valorant verisi bulunamadı. Oyuncu adı ve TAG doğru mu?`);
            }

            const rankName = mmr.currenttierpatched || 'Unranked';
            const elo = mmr.elo || 0;
            const ranked_rating = mmr.ranking_in_tier ?? 0;
            const ratingToNext = mmr.mmr_change_to_last_game ?? 0;
            const peakRank = mmr.highest_rank?.patched_tier || 'Bilinmiyor';
            const rankEmoji = getRankEmoji(rankName);

            const embed = new EmbedBuilder()
                .setColor('#ff4655')
                .setTitle(`${rankEmoji} ${name}#${tag} — Valorant`)
                .setThumbnail(mmr.images?.large || 'https://media.valorant-api.com/ranks/3/largeicon.png')
                .addFields(
                    { name: '🏅 Mevcut Rank', value: `**${rankName}**`, inline: true },
                    { name: '🎯 Rating (RR)', value: `**${ranked_rating} RR**`, inline: true },
                    { name: '📊 ELO', value: `**${elo}**`, inline: true },
                    { name: '📈 Son Maç Değişimi', value: `${ratingToNext >= 0 ? '+' : ''}${ratingToNext} RR`, inline: true },
                    { name: '🏆 En Yüksek Rank', value: peakRank, inline: true },
                    { name: '🌍 Bölge', value: region.toUpperCase(), inline: true }
                )
                .setFooter({ text: 'HenrikDev API · Veriler anlık olmayabilir.' })
                .setTimestamp();

            return message.reply({ embeds: [embed] });

        } catch (error) {
            if (error.response?.status === 404) {
                return message.reply(`❌ **${inputFull}** bulunamadı. Oyuncu adı ve TAG formatını kontrol edin.`);
            }
            if (error.response?.status === 429) {
                return message.reply('⏳ API istek limiti aşıldı. 1 dakika bekleyin.');
            }
            console.error('[Valorant] Error:', error.message);
            return message.reply(`❌ Valorant API hatası: ${error.response?.data?.message || error.message}`);
        }
    }
};
