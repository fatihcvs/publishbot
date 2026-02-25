const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    name: 'hava',
    aliases: ['havadurumu', 'weather', 'iklim'],
    description: 'Belirtilen şehrin anlık hava durumunu gösterir.',
    usage: '!hava [Şehir]',
    cooldown: 5,

    async execute(message, args, client) {
        if (!args[0]) {
            return message.reply('❌ Lütfen hava durumunu öğrenmek istediğiniz şehri yazın. Örnek: `!hava İstanbul`');
        }

        const city = args.join(' ');

        // Use wttr.in as it provides zero-config weather JSON for locations around the globe without an API key
        const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;

        try {
            message.channel.sendTyping();
            const response = await axios.get(url);
            const data = response.data.current_condition[0];
            const queryMeta = response.data.nearest_area[0];

            const tempC = data.temp_C;
            const feelsLike = data.FeelsLikeC;
            const config = data.weatherDesc[0].value;
            const humidity = data.humidity;
            const wind = data.windspeedKmph;

            const locationName = `${queryMeta.areaName[0].value}, ${queryMeta.country[0].value}`;

            const embed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle(`🌤️ ${locationName} - Hava Durumu`)
                .addFields(
                    { name: 'Sıcaklık', value: `**${tempC}°C** (Hissedilen: ${feelsLike}°C)`, inline: true },
                    { name: 'Durum', value: config, inline: true },
                    { name: 'Nem Oranı', value: `%${humidity}`, inline: true },
                    { name: 'Rüzgar Hızı', value: `${wind} km/s`, inline: true }
                )
                .setFooter({ text: 'Wttr.in API kullanılarak çekildi.' })
                .setTimestamp();

            return message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Weather fetch error:', error.message);
            return message.reply(`❌ **${city}** adında bir şehir bulunamadı veya API geçici olarak yanıt vermiyor.`);
        }
    }
};
