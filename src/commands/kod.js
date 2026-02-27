const { EmbedBuilder } = require('discord.js');
const { db } = require('../database/db');
const { userLetheProfile } = require('../../shared/schema');
const { eq } = require('drizzle-orm');

// server.js'deki redeem store'una erişim
// Bot başladığında web server'dan import edilir; burada dinamik require ile alıyoruz
function getWebServer() {
    try { return require('../web/server'); } catch { return null; }
}

async function addCoinsToUser(userId, amount) {
    const [existing] = await db.select().from(userLetheProfile)
        .where(eq(userLetheProfile.visitorId, userId)).limit(1);

    if (existing) {
        await db.update(userLetheProfile)
            .set({ coins: (existing.coins || 0) + amount })
            .where(eq(userLetheProfile.visitorId, userId));
        return (existing.coins || 0) + amount;
    } else {
        await db.insert(userLetheProfile).values({
            visitorId: userId,
            coins: amount,
            level: 1,
            xp: 0
        });
        return amount;
    }
}

module.exports = {
    name: 'kod',
    aliases: ['redeem', 'kodkullan', 'hediyekod', 'kodu'],
    description: 'Ödül kodu kullan (coin veya hayvan kazanmak için)',
    usage: '!kod <KOD>',
    category: 'lethe',

    async execute(message, args, client, storage) {
        // Lethe Game aktif mi?
        const guildData = await storage.getGuild(message.guild.id);
        if (guildData?.modules && guildData.modules.economy === false) {
            return message.reply('❌ Lethe Game bu sunucuda devre dışı.');
        }

        if (!args[0]) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#5865f2')
                    .setTitle('🎁 Ödül Kodu Kullan')
                    .setDescription('Bir kodu kullanmak için:\n```\n!kod <KOD>\n```\nÖrnek: `!kod PUBLISHER100`')
                    .setFooter({ text: 'Kodlar büyük/küçük harfe duyarsızdır.' })
                ]
            });
        }

        const inputCode = args[0].toUpperCase().trim();
        const userId = message.author.id;

        // Server.js'deki redeem store'una erişim (global üzerinden)
        const redeemStore = global._redeemCodesHelper;

        if (!redeemStore) {
            // Fallback: API üzerinden dene
            return message.reply('❌ Kod sistemi şu an kullanılamıyor. Bot yeniden başlatılıyor olabilir.');
        }

        const result = redeemStore.useCode(inputCode, userId);

        if (result === 'not_found') {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#ed4245')
                    .setTitle('❌ Geçersiz Kod')
                    .setDescription(`\`${inputCode}\` kodu bulunamadı veya pasif durumda.`)
                ]
            });
        }
        if (result === 'expired') {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#ed4245')
                    .setTitle('⌛ Kodun Süresi Dolmuş')
                    .setDescription('Bu kodun geçerlilik süresi sona erdi.')
                ]
            });
        }
        if (result === 'limit_reached') {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#ed4245')
                    .setTitle('🚫 Limit Doldu')
                    .setDescription('Bu kod maksimum kullanım sayısına ulaştı.')
                ]
            });
        }
        if (result === 'already_used') {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#faa61a')
                    .setTitle('⚠️ Daha Önce Kullanıldı')
                    .setDescription('Bu kodu zaten kullandınız.')
                ]
            });
        }

        // Ödülü ver
        try {
            if (result.rewardType === 'coins') {
                const newBalance = await addCoinsToUser(userId, result.rewardValue);
                return message.reply({
                    embeds: [new EmbedBuilder()
                        .setColor('#f59e0b')
                        .setTitle('🎉 Kod Kullanıldı!')
                        .setDescription(`**${inputCode}** kodu başarıyla kullanıldı!`)
                        .addFields(
                            { name: '💰 Kazanılan', value: `**${result.rewardValue.toLocaleString('tr-TR')} coin**`, inline: true },
                            { name: '👤 Yeni Bakiye', value: `**${newBalance.toLocaleString('tr-TR')} coin**`, inline: true }
                        )
                        .setFooter({ text: `${message.author.username} tarafından kullanıldı` })
                        .setTimestamp()
                    ]
                });
            } else if (result.rewardType === 'animal') {
                // Hayvan ödülü — letheStorage ile ekle
                const letheStorage = require('../lethe/letheStorage');
                const profile = await letheStorage.getOrCreateProfile(userId);

                // Mevcut envantere hayvan ekle (basit yöntem: avla mantığı)
                const { userAnimals, letheAnimals } = require('../../shared/schema');
                const [animalDef] = await db.select().from(letheAnimals)
                    .where(eq(letheAnimals.id, result.rewardAnimal)).limit(1);

                if (!animalDef) throw new Error('Hayvan tanımı bulunamadı');

                await db.insert(userAnimals).values({
                    visitorId: userId,
                    animalId: result.rewardAnimal,
                    obtainedAt: new Date(),
                    source: 'redeem_code'
                });

                return message.reply({
                    embeds: [new EmbedBuilder()
                        .setColor('#57f287')
                        .setTitle('🎉 Hayvan Ödülü Kazanıldı!')
                        .setDescription(`**${inputCode}** kodu başarıyla kullanıldı!`)
                        .addFields(
                            { name: '🦁 Kazanılan Hayvan', value: `**${animalDef.name || result.rewardAnimal}**`, inline: true }
                        )
                        .setFooter({ text: `${message.author.username} tarafından kullanıldı` })
                        .setTimestamp()
                    ]
                });
            }
        } catch (err) {
            console.error('[kod] Ödül verme hatası:', err);
            return message.reply('⚠️ Kod kullanıldı fakat ödül verilemedi. Lütfen bot sahibine bildirin.');
        }
    }
};
