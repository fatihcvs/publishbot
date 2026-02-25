const { EmbedBuilder } = require('discord.js');
const { db } = require('../../database/db');
const { userProfiles } = require('../../../shared/schema');
const { eq, and } = require('drizzle-orm');

module.exports = {
    name: 'biyografi',
    aliases: ['bio', 'hakkımda', 'aboutmme', 'aboutme'],
    description: 'Profil kartınızda görünecek kısa biyografinizi ayarlarsınız.',
    usage: '!biyografi [Metin]',

    async execute(message, args, client) {
        const text = args.join(' ');

        if (!text) {
            return message.reply('❌ Lütfen biyografinize yazmak istediğiniz metni girin. Örnek: `!biyografi Sadece müzik dinlemeyi seven biri.`');
        }

        if (text.length > 70) {
            return message.reply('❌ Biyografiniz **70 karakterden** uzun olamaz. Lütfen daha kısa tutun.');
        }

        let [userRow] = await db.select().from(userProfiles)
            .where(and(eq(userProfiles.guildId, message.guild.id), eq(userProfiles.userId, message.author.id)))
            .limit(1);

        if (!userRow) {
            await db.insert(userProfiles).values({
                guildId: message.guild.id,
                userId: message.author.id,
                biography: text
            });
        } else {
            await db.update(userProfiles)
                .set({ biography: text })
                .where(eq(userProfiles.id, userRow.id));
        }

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('📝 Biyografi Güncellendi')
            .setDescription(`Profil biyografiniz başarıyla güncellendi!\n\n**Yeni Biyografi:**\n*${text}*`)
            .setFooter({ text: 'Görmek için !profil yazabilirsiniz.' })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }
};
