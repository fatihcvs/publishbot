const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    name: 'steam',
    aliases: ['oyun', 'steamoyun'],
    description: 'Steam\'de bir oyunu arar ve detaylarını gösterir.',
    usage: '!steam [Oyun Adı]',
    cooldown: 10,

    async execute(message, args) {
        if (!args[0]) {
            return message.reply('❌ Lütfen aramak istediğiniz oyunu yazın. Örnek: `!steam Cyberpunk 2077`');
        }

        const gameName = args.join(' ');

        try {
            await message.channel.sendTyping();

            // Helper func for reliable fetching
            const fetchWithRetry = async (url, retries = 3) => {
                for (let i = 0; i < retries; i++) {
                    try {
                        return await axios.get(url, { timeout: 8000 });
                    } catch (err) {
                        if (i === retries - 1) throw err;
                        await new Promise(r => setTimeout(r, 1000));
                    }
                }
            };

            // Steam Store search API (no API key required)
            const searchRes = await fetchWithRetry(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(gameName)}&l=turkish&cc=TR`);

            const results = searchRes.data?.items;
            if (!results || results.length === 0) {
                return message.reply(`❌ **${gameName}** için Steam'de sonuç bulunamadı.`);
            }

            const game = results[0];
            const appId = game.id;

            // Fetch full game details
            const detailRes = await fetchWithRetry(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=turkish&cc=TR`);

            const detail = detailRes.data?.[appId]?.data;
            if (!detail) {
                return message.reply(`❌ **${gameName}** için oyun detayları alınamadı.`);
            }

            // Price info
            let priceText = '**Ücretsiz**';
            if (detail.is_free) {
                priceText = '**Ücretsiz**';
            } else if (detail.price_overview) {
                const price = detail.price_overview;
                const finalPrice = (price.final / 100).toFixed(2);
                const origPrice = (price.initial / 100).toFixed(2);
                if (price.discount_percent > 0) {
                    priceText = `~~₺${origPrice}~~ → **₺${finalPrice}** (%${price.discount_percent} indirim 🎉)`;
                } else {
                    priceText = `**₺${finalPrice}**`;
                }
            } else {
                priceText = 'Fiyat bilgisi yok';
            }

            // Developers & publishers
            const developers = (detail.developers || []).slice(0, 2).join(', ') || 'Bilinmiyor';
            const publishers = (detail.publishers || []).slice(0, 2).join(', ') || 'Bilinmiyor';

            // Short description - strip HTML
            const shortDesc = (detail.short_description || '')
                .replace(/<[^>]+>/g, '')
                .substring(0, 200);

            // Genres
            const genres = (detail.genres || []).map(g => g.description).slice(0, 4).join(', ') || 'Belirtilmemiş';

            // Release date
            const releaseDate = detail.release_date?.date || 'Bilinmiyor';

            // Review score
            let reviewText = '';
            if (detail.metacritic) {
                const score = detail.metacritic.score;
                const emoji = score >= 80 ? '🟢' : score >= 60 ? '🟡' : '🔴';
                reviewText = `${emoji} ${score}/100 (Metacritic)`;
            }

            const embed = new EmbedBuilder()
                .setColor('#1b2838')
                .setTitle(`🎮 ${detail.name}`)
                .setURL(`https://store.steampowered.com/app/${appId}`)
                .setThumbnail(`https://cdn.akamai.steamstatic.com/steam/apps/${appId}/capsule_231x87.jpg`)
                .setImage(`https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`)
                .setDescription(shortDesc || 'Açıklama bulunamadı.')
                .addFields(
                    { name: '💰 Fiyat', value: priceText, inline: true },
                    { name: '📅 Çıkış Tarihi', value: releaseDate, inline: true },
                    { name: '🎮 Tür', value: genres, inline: true },
                    { name: '👨‍💻 Geliştirici', value: developers, inline: true },
                    { name: '🏢 Yayıncı', value: publishers, inline: true },
                );

            if (reviewText) {
                embed.addFields({ name: '⭐ Metacritic', value: reviewText, inline: true });
            }

            embed
                .addFields({ name: '🔗 Steam Sayfası', value: `[Oyunu Görüntüle](https://store.steampowered.com/app/${appId})`, inline: false })
                .setFooter({ text: 'Steam Store API · Publisher Bot' })
                .setTimestamp();

            return message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('[Steam] Error:', error.message);
            return message.reply(`❌ Steam API şu an yanıt vermiyor. Daha sonra tekrar deneyin.\n\`\`\`${error.message}\`\`\``);
        }
    }
};
