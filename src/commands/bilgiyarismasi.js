const { EmbedBuilder } = require('discord.js');
const { db } = require('../../database/db');
const { userEconomy } = require('../../../shared/schema');
const { eq, and } = require('drizzle-orm');

const questions = [
    { q: 'Güneş sistemindeki en büyük gezegen hangisidir?', a: 'Jüpiter' },
    { q: 'Türkiye\'nin başkenti neresidir?', a: 'Ankara' },
    { q: 'Hangi gezegene "Kızıl Gezegen" denir?', a: 'Mars' },
    { q: 'En sert doğal madde nedir?', a: 'Elmas' },
    { q: 'İstiklal Marşı\'nın şairi kimdir?', a: 'Mehmet Akif Ersoy' },
    { q: 'Dünya\'nın en uzun nehri hangisidir?', a: 'Nil' },
    { q: 'Suyu oluşturan iki element nedir?', a: 'Hidrojen ve Oksijen', alt: ['hidrojen oksijen', 'oksijen hidrojen', 'H2O'] },
    { q: 'Pi sayısının ilk üç rakamı nedir?', a: '3.14', alt: ['3,14'] }
];

const activeTrivia = new Set();

module.exports = {
    name: 'bilgi',
    aliases: ['trivia', 'yarışma', 'bilgiyarismasi'],
    description: 'Bilgi yarışması oynayarak sunucu parası kazanın.',

    async execute(message, args, client) {
        if (activeTrivia.has(message.channel.id)) {
            return message.reply('❌ Bu kanalda zaten devam eden bir yarışma var!');
        }

        activeTrivia.add(message.channel.id);

        const randomQ = questions[Math.floor(Math.random() * questions.length)];
        const reward = Math.floor(Math.random() * 200) + 100; // 100 - 300 coins

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🏆 Bilgi Yarışması Başladı!')
            .setDescription(`**Soru:** ${randomQ.q}\n\nİlk doğru cevabı veren **${reward} 💰** kazanacak!\n*Süreniz 30 saniye.*`);

        await message.channel.send({ embeds: [embed] });

        const filter = m => !m.author.bot;
        const collector = message.channel.createMessageCollector({ filter, time: 30000 });

        let winner = null;

        collector.on('collect', m => {
            const content = m.content.toLowerCase().trim();
            const mainAnswer = randomQ.a.toLowerCase();

            let isCorrect = content === mainAnswer;
            if (!isCorrect && randomQ.alt) {
                isCorrect = randomQ.alt.some(altText => content === altText.toLowerCase());
            }

            if (isCorrect) {
                winner = m.author;
                collector.stop('answered');
            }
        });

        collector.on('end', async (collected, reason) => {
            activeTrivia.delete(message.channel.id);

            if (reason === 'answered' && winner) {
                // Economy Injection
                let [userRow] = await db.select().from(userEconomy)
                    .where(and(eq(userEconomy.guildId, message.guild.id), eq(userEconomy.userId, winner.id)))
                    .limit(1);

                if (!userRow) {
                    await db.insert(userEconomy).values({
                        guildId: message.guild.id,
                        userId: winner.id,
                        balance: reward,
                        bank: 0
                    });
                } else {
                    await db.update(userEconomy)
                        .set({ balance: (userRow.balance || 0) + reward })
                        .where(eq(userEconomy.id, userRow.id));
                }

                return message.channel.send(`🎉 **Tebrikler <@${winner.id}>!** Doğru cevap: **${randomQ.a}**. Ödül olarak **${reward} 💰** kazandın!`);
            } else {
                return message.channel.send(`⏰ Süre doldu! Maalesef kimse doğru bilemedi. Doğru cevap: **${randomQ.a}**`);
            }
        });
    }
};
