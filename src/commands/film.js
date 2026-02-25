const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

// Uses Open-Meteo's free historical weather-like layer-free API
// OMDB: http://www.omdbapi.com/ — free key required (1000 req/day)
// Fallback: TVMaze (no key) + TMDB (no key for search)

// Helper: strip HTML
function stripHtml(str) {
    return (str || '').replace(/<[^>]+>/g, '').trim();
}

// Helper: get content rating emoji
function getRatingEmoji(rating) {
    const r = (rating || '').toUpperCase();
    if (r === 'G' || r === 'TV-G') return '🟢';
    if (r === 'PG' || r === 'TV-PG') return '🟡';
    if (r === 'PG-13' || r === 'TV-14') return '🟠';
    if (r === 'R' || r === 'TV-MA') return '🔴';
    return '⬜';
}

// Search OMDB (needs OMDB_API_KEY env var — free: 1000 req/day)
async function searchOmdb(query, type = '') {
    const apiKey = process.env.OMDB_API_KEY || '';
    if (!apiKey) return null;

    const typeParam = type ? `&type=${type}` : '';
    const res = await axios.get(
        `http://www.omdbapi.com/?apikey=${apiKey}&t=${encodeURIComponent(query)}${typeParam}&plot=full`,
        { timeout: 8000 }
    );
    if (res.data.Response === 'False') return null;
    return res.data;
}

// Search TVMaze (free, no key)
async function searchTvmaze(query) {
    const res = await axios.get(
        `https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(query)}&embed=episodes`,
        { timeout: 8000 }
    );
    return res.data;
}

module.exports = {
    name: 'film',
    aliases: ['dizi', 'movie', 'serie', 'imdb', 'filmara'],
    description: 'Film veya dizi hakkında bilgi gösterir.',
    usage: '!film [Film/Dizi Adı] | !dizi [Dizi Adı]',
    cooldown: 10,

    async execute(message, args) {
        if (!args[0]) {
            return message.reply('❌ Lütfen bir film veya dizi adı yazın. Örnek: `!film Breaking Bad`');
        }

        const query = args.join(' ');

        // G4: Determine type hint strictly from the exact command invoked
        const cmdName = message.content.toLowerCase().split(' ')[0].replace('!', '');
        const isSerie = ['dizi', 'serie'].includes(cmdName);
        const isMovie = ['film', 'movie', 'filmara'].includes(cmdName);
        const compType = isSerie ? 'series' : isMovie ? 'movie' : '';

        await message.channel.sendTyping();

        try {
            // ---- Try OMDB first (if API key set) ----
            let omdbData = null;
            try {
                omdbData = await searchOmdb(query, compType);
            } catch (_) { }

            if (omdbData) {
                const typeEmoji = omdbData.Type === 'series' ? '📺' : '🎬';
                const year = omdbData.Year || '?';
                const runtime = omdbData.Runtime || '?';
                const genre = omdbData.Genre || 'Belirtilmemiş';
                const director = omdbData.Director && omdbData.Director !== 'N/A' ? omdbData.Director : null;
                const actors = omdbData.Actors && omdbData.Actors !== 'N/A' ? omdbData.Actors : 'Bilinmiyor';
                const imdbRating = omdbData.imdbRating !== 'N/A' ? `⭐ ${omdbData.imdbRating}/10` : null;
                const plot = omdbData.Plot !== 'N/A' ? omdbData.Plot.substring(0, 350) : 'Özet bulunamadı.';
                const poster = omdbData.Poster !== 'N/A' ? omdbData.Poster : null;
                const contentRating = omdbData.Rated && omdbData.Rated !== 'N/A' ? omdbData.Rated : null;
                const totalSeasons = omdbData.totalSeasons && omdbData.totalSeasons !== 'N/A' ? omdbData.totalSeasons : null;
                const imdbVotes = omdbData.imdbVotes !== 'N/A' ? omdbData.imdbVotes : null;

                const embed = new EmbedBuilder()
                    .setColor('#e8b923')
                    .setTitle(`${typeEmoji} ${omdbData.Title} (${year})`)
                    .setURL(`https://www.imdb.com/title/${omdbData.imdbID}`)
                    .setDescription(plot);

                if (poster) embed.setThumbnail(poster);

                const fields = [
                    { name: '🎭 Tür', value: genre, inline: true },
                    { name: '⏱️ Süre', value: runtime, inline: true },
                ];
                if (imdbRating) fields.push({ name: '⭐ IMDB', value: `${imdbRating}${imdbVotes ? ` (${imdbVotes})` : ''}`, inline: true });
                if (director) fields.push({ name: '🎬 Yönetmen', value: director, inline: true });
                if (contentRating) fields.push({ name: `${getRatingEmoji(contentRating)} Yaş Sınırı`, value: contentRating, inline: true });
                if (totalSeasons) fields.push({ name: '📡 Sezon', value: `${totalSeasons} sezon`, inline: true });
                fields.push({ name: '🎭 Oyuncular', value: actors, inline: false });

                embed.addFields(fields)
                    .setFooter({ text: 'OMDB API / IMDB · Publisher Bot' })
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            }

            // ---- Fallback: TVMaze (free, no key, only TV shows) ----
            const tvData = await searchTvmaze(query);

            const title = tvData.name;
            const summary = stripHtml(tvData.summary).substring(0, 350) || 'Özet bulunamadı.';
            const genres = (tvData.genres || []).join(', ') || 'Belirtilmemiş';
            const status = tvData.status === 'Running' ? '🟢 Devam Ediyor' : tvData.status === 'Ended' ? '🔴 Sona Erdi' : tvData.status || 'Bilinmiyor';
            const network = tvData.network?.name || tvData.webChannel?.name || 'Bilinmiyor';
            const premiered = tvData.premiered || 'Bilinmiyor';
            const rating = tvData.rating?.average ? `⭐ ${tvData.rating.average}/10` : 'Puanlama yok';
            const language = tvData.language || '?';
            const runtime = tvData.runtime ? `${tvData.runtime} dk` : '?';
            const officialSite = tvData.officialSite;
            const image = tvData.image?.medium;
            const tvmazeUrl = tvData.url;

            const embed = new EmbedBuilder()
                .setColor('#00a0d2')
                .setTitle(`📺 ${title}`)
                .setURL(tvmazeUrl || 'https://www.tvmaze.com')
                .setDescription(summary)
                .addFields(
                    { name: '🎭 Tür', value: genres, inline: true },
                    { name: '⏱️ Bölüm Süresi', value: runtime, inline: true },
                    { name: '⭐ Puan', value: rating, inline: true },
                    { name: '📡 Yayın Platformu', value: network, inline: true },
                    { name: '📅 İlk Yayın', value: premiered, inline: true },
                    { name: '📊 Durum', value: status, inline: true },
                    { name: '🌍 Dil', value: language, inline: true }
                );

            if (image) embed.setThumbnail(image);
            if (officialSite) embed.addFields({ name: '🔗 Resmi Site', value: officialSite, inline: false });

            embed
                .setFooter({ text: 'TVMaze API · Publisher Bot (Film/Sinema verileri için OMDB_API_KEY ayarlayın)' })
                .setTimestamp();

            return message.reply({ embeds: [embed] });

        } catch (error) {
            if (error.response?.status === 404) {
                return message.reply(`❌ **${query}** adında bir film/dizi bulunamadı.`);
            }
            console.error('[Film] Error:', error.message);
            return message.reply(`❌ Veri çekilemedi: ${error.message}`);
        }
    }
};
