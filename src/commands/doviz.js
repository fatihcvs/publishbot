const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    name: 'döviz',
    aliases: ['para', 'kur', 'borsa', 'doviz'],
    description: 'Güncel döviz ve altın kurlarını gösterir.',
    cooldown: 5,

    async execute(message, args, client) {
        // Using an open API that doesn't strictly require Keys for basic fetching
        const url = 'https://finans.truncgil.com/today.json';

        try {
            message.channel.sendTyping();
            const response = await axios.get(url);
            const data = response.data;

            if (!data || !data.USD) {
                throw new Error('Geçersiz API Yanıtı');
            }

            const usd = data.USD;
            const eur = data.EUR;
            const gbp = data.GBP;
            const gramAltin = data['gram-altin'];

            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle('💱 Güncel Döviz ve Altın Kurları')
                .addFields(
                    { name: '🇺🇸 Dolar (USD)', value: `Alış: ${usd.Alış} ₺\nSatış: ${usd.Satış} ₺\nDeğişim: ${usd.Değişim}`, inline: true },
                    { name: '🇪🇺 Euro (EUR)', value: `Alış: ${eur.Alış} ₺\nSatış: ${eur.Satış} ₺\nDeğişim: ${eur.Değişim}`, inline: true },
                    { name: '🇬🇧 Sterlin (GBP)', value: `Alış: ${gbp.Alış} ₺\nSatış: ${gbp.Satış} ₺\nDeğişim: ${gbp.Değişim}`, inline: true },
                    { name: '🪙 Gram Altın', value: `Alış: ${gramAltin.Alış} ₺\nSatış: ${gramAltin.Satış} ₺\nDeğişim: ${gramAltin.Değişim}`, inline: true },
                    { name: '📊 Güncelleme', value: data.Update_Date || 'Bilinmiyor', inline: true }
                )
                .setFooter({ text: 'Truncgil Finans API kullanılarak çekildi.' })
                .setTimestamp();

            return message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Currency fetch error:', error.message);
            return message.reply(`❌ Döviz kurları çekilirken bir hata oluştu. API geçici olarak yanıt vermiyor olabilir.`);
        }
    }
};
