const { EmbedBuilder } = require('discord.js');
const { musicManager } = require('../modules/MusicManager');

module.exports = {
    name: 'lirik',
    aliases: ['lyrics', 'soz', 'söz'],
    description: 'Aktif şarkının veya aradığınız şarkının sözlerini göster.',
    usage: '!lirik [şarkı adı]',

    async execute(message, args, client) {
        const q = musicManager.getQueue(message.guild.id);
        const query = args.join(' ') || q?.current?.title;

        if (!query) {
            return message.reply('❌ Kullanım: `!lirik <şarkı adı>` veya müzik çalarken kullanın.').catch(() => { });
        }

        const loadingMsg = await message.reply(`🔍 \`${query}\` için sözler aranıyor...`).catch(() => null);

        try {
            // Genius API ücretsiz (token gerektirmez) - oEmbed / public search
            const axios = require('axios');
            const res = await axios.get('https://api.genius.com/search', {
                params: { q: query, per_page: 1 },
                headers: {
                    Authorization: `Bearer ${process.env.GENIUS_TOKEN || 'public'}`
                },
                timeout: 8000
            }).catch(() => null);

            const hit = res?.data?.response?.hits?.[0]?.result;

            if (!hit) {
                // Fallback: sadece Genius link ver
                const safeQuery = encodeURIComponent(query);
                await loadingMsg?.edit({
                    content: '',
                    embeds: [new EmbedBuilder()
                        .setColor('#FEE75C')
                        .setTitle(`🎵 ${query}`)
                        .setDescription(`Otomatik çekilemedi. Genius'ta ara:\n[genius.com/search?q=${query}](https://genius.com/search?q=${safeQuery})`)
                        .setTimestamp()]
                }).catch(() => { });
                return;
            }

            await loadingMsg?.edit({
                content: '',
                embeds: [new EmbedBuilder()
                    .setColor('#FEE75C')
                    .setTitle(`🎵 ${hit.full_title}`)
                    .setThumbnail(hit.song_art_image_thumbnail_url || null)
                    .addFields(
                        { name: 'Sanatçı', value: hit.primary_artist?.name || '?', inline: true },
                        { name: '🔗 Genius', value: `[Tüm sözler için tıkla](${hit.url})`, inline: true }
                    )
                    .setDescription('Discord sözler API kısıtlaması nedeniyle tam metni gösteremiyoruz. Yukarıdaki linke tıkla.')
                    .setFooter({ text: 'Genius.com' })
                    .setTimestamp()]
            }).catch(() => { });
        } catch (err) {
            await loadingMsg?.edit(`❌ Sözler alınırken hata: ${err.message}`).catch(() => { });
        }
    }
};
