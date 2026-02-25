const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

// Uses the unofficial Riot Games Community Dragon / OP.GG unofficial API
// No API key needed for basic data via the community Dragon CDN
// Real rank data uses the op.gg public API

const COMMUNITY_DRAGON_VERSION_URL = 'https://ddragon.leagueoflegends.com/api/versions.json';

const TIER_COLORS = {
    IRON: '#2c2c2c', BRONZE: '#8C6239', SILVER: '#A8A8A8',
    GOLD: '#FFD700', PLATINUM: '#00B4B4', EMERALD: '#00C848',
    DIAMOND: '#8080FF', MASTER: '#9B59B6', GRANDMASTER: '#E74C3C',
    CHALLENGER: '#EAB308', UNRANKED: '#5865F2'
};

const TIER_EMOJIS = {
    IRON: '⚫', BRONZE: '🟤', SILVER: '⬜', GOLD: '🟡', PLATINUM: '🔵',
    EMERALD: '🟢', DIAMOND: '💎', MASTER: '🟣', GRANDMASTER: '🔴',
    CHALLENGER: '🌟', UNRANKED: '❓'
};

module.exports = {
    name: 'lol',
    aliases: ['lolstats', 'league', 'leaguestats'],
    description: 'League of Legends oyuncu istatistiklerini gösterir.',
    usage: '!lol [OyuncuAdı#TAG] [bölge=euw1/tr1/na1/br1/kr]',
    cooldown: 10,

    async execute(message, args) {
        if (!args[0]) {
            return message.reply(
                '❌ Kullanım: `!lol OyuncuAdı#TAG` veya `!lol OyuncuAdı#TAG tr1`\n' +
                '**Bölgeler:** `euw1` `tr1` `na1` `na2` `br1` `kr` `eun1` `jp1` `oc1` `la1` `la2`'
            );
        }

        const riotApiKey = process.env.RIOT_API_KEY;
        if (!riotApiKey) {
            return message.reply(
                '⚙️ **LOL komutu için Riot API key gerekli.**\n' +
                '1. [developer.riot.games](https://developer.riot.games) adresinden ücretsiz key alın.\n' +
                '2. `.env` dosyasına `RIOT_API_KEY=RGAPI-xxx` ekleyin.\n' +
                '3. Botu yeniden başlatın.'
            );
        }

        const inputFull = args[0];
        const region = (args[1] || 'euw1').toLowerCase();

        if (!inputFull.includes('#')) {
            return message.reply('❌ Lütfen Riot ID\'ini **Ad#TAG** formatında girin. Örnek: `!lol FakerLol#KR1`');
        }

        const [gameName, tagLine] = inputFull.split('#');

        // Map region to routing value (Riot has platform vs regional routing)
        const ROUTING = {
            'euw1': 'europe', 'eune1': 'europe', 'eun1': 'europe',
            'tr1': 'europe', 'ru': 'europe',
            'na1': 'americas', 'na2': 'americas', 'br1': 'americas', 'la1': 'americas', 'la2': 'americas',
            'kr': 'asia', 'jp1': 'asia',
            'oc1': 'sea', 'sg2': 'sea', 'vn2': 'sea'
        };
        const routing = ROUTING[region] || 'europe';

        try {
            await message.channel.sendTyping();

            // Step 1: Get PUUID via Riot Account API
            const accountRes = await axios.get(
                `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
                { headers: { 'X-Riot-Token': riotApiKey }, timeout: 10000 }
            );
            const puuid = accountRes.data.puuid;

            // Step 2: Get summoner info
            const summonerRes = await axios.get(
                `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
                { headers: { 'X-Riot-Token': riotApiKey }, timeout: 10000 }
            );
            const summoner = summonerRes.data;

            // Step 3: Get ranked stats
            const rankedRes = await axios.get(
                `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summoner.id}`,
                { headers: { 'X-Riot-Token': riotApiKey }, timeout: 10000 }
            );
            const rankedData = rankedRes.data;

            // Step 4: Get latest patch for icon CDN
            const versionRes = await axios.get(COMMUNITY_DRAGON_VERSION_URL, { timeout: 5000 });
            const latestPatch = versionRes.data[0];

            // Find Solo and Flex queue
            const soloRank = rankedData.find(q => q.queueType === 'RANKED_SOLO_5x5') || null;
            const flexRank = rankedData.find(q => q.queueType === 'RANKED_FLEX_SR') || null;

            const formatRank = (rank) => {
                if (!rank) return 'Unranked';
                const emoji = TIER_EMOJIS[rank.tier] || '❓';
                const wr = ((rank.wins / (rank.wins + rank.losses)) * 100).toFixed(1);
                return `${emoji} **${rank.tier} ${rank.rank}** · ${rank.leaguePoints} LP\n${rank.wins}W ${rank.losses}L (${wr}% WR)`;
            };

            const color = soloRank ? (TIER_COLORS[soloRank.tier] || '#5865F2') : '#5865F2';

            const summonerLevel = summoner.summonerLevel;
            const iconUrl = `https://ddragon.leagueoflegends.com/cdn/${latestPatch}/img/profileicon/${summoner.profileIconId}.png`;

            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle(`⚔️ ${gameName}#${tagLine} — League of Legends`)
                .setThumbnail(iconUrl)
                .addFields(
                    { name: '🏆 Solo/Duo Rank', value: formatRank(soloRank), inline: true },
                    { name: '🤝 Flex Rank', value: formatRank(flexRank), inline: true },
                    { name: '🔰 Seviye', value: `**${summonerLevel}**`, inline: true },
                    { name: '🌍 Bölge', value: region.toUpperCase(), inline: true }
                )
                .setFooter({ text: 'Riot Games API · Publisher Bot' })
                .setTimestamp();

            return message.reply({ embeds: [embed] });

        } catch (error) {
            if (error.response?.status === 403) {
                return message.reply('❌ Riot API key geçersiz veya süresi dolmuş. `.env` dosyasını kontrol edin.');
            }
            if (error.response?.status === 404) {
                return message.reply(`❌ **${inputFull}** bulunamadı. Riot ID ve TAG doğru mu? Bölge: **${region}**`);
            }
            if (error.response?.status === 429) {
                return message.reply('⏳ API istek limiti aşıldı. Biraz bekleyin.');
            }
            console.error('[LOL] Error:', error.message);
            return message.reply(`❌ LOL API hatası: ${error.response?.data?.status?.message || error.message}`);
        }
    }
};
