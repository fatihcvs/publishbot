const { EmbedBuilder } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');
const { db } = require('../database/db');
const { userLetheProfile } = require('../../shared/schema');
const { eq, sql } = require('drizzle-orm');

module.exports = {
    name: 'hazine',
    aliases: ['treasure', 'kazı', 'sandıkaç', 'kazi'],
    description: 'Topladığın harita parçalarını birleştirip hazine sandığı aç',
    letheGame: true,
    cooldown: 5,
    async execute(message, args, client, storage) {
        const guildData = await storage.getGuild(message.guild.id);
        if (guildData?.modules && guildData.modules.economy === false) {
            return message.reply('❌ Lethe Game bu sunucuda devre dışı.');
        }

        const letheChannels = guildData?.modules?.letheChannels || [];
        if (letheChannels.length > 0 && !letheChannels.includes(message.channel.id)) {
            return message.reply(`❌ Lethe Game komutları sadece belirlenen kanallarda çalışır! \`!oyunkanal liste\` ile kontrol et.`);
        }

        const profile = await letheStorage.getOrCreateProfile(message.author.id);
        const MAP_REQUIREMENT = 3;

        if (profile.mapPieces < MAP_REQUIREMENT) {
            return message.reply(`❌ Hazine sandığını bulmak için tam bir haritaya ihtiyacın var! Gereken: ${MAP_REQUIREMENT} 🗺️ | Mevcut Parça: ${profile.mapPieces} 🗺️\n*İpucu: \`!macera\` veya \`!avla\` komutlarını kullanarak parça bulabilirsin.*`);
        }

        // Yeterli parça var, sandığı açalım
        await db.update(userLetheProfile)
            .set({ mapPieces: sql`${userLetheProfile.mapPieces} - ${MAP_REQUIREMENT}` })
            .where(eq(userLetheProfile.visitorId, message.author.id));

        // Büyük Ödüller (Sandık Mekaniği)
        const coinReward = Math.floor(Math.random() * 2000) + 1000; // 1000-3000 Altın
        const xpReward = Math.floor(Math.random() * 500) + 200; // 200-700 XP

        await letheStorage.addCoins(message.author.id, coinReward);

        await db.update(userLetheProfile)
            .set({ xp: sql`${userLetheProfile.xp} + ${xpReward}` })
            .where(eq(userLetheProfile.visitorId, message.author.id));

        await letheStorage.checkLevelUp(message.author.id);

        const embed = new EmbedBuilder()
            .setColor('#f59e0b')
            .setTitle('📦 Eski Hazine Sandığı Açıldı!')
            .setDescription(`Bulduğun ${MAP_REQUIREMENT} harita parçasını birleştirdin ve bölgenin gizli hazinesini ortaya çıkardın! Mührü kırdın ve içinden şunlar çıktı:`)
            .addFields(
                { name: 'Kazanımlar', value: `💰 **${coinReward}** Altın\n⭐ **${xpReward}** XP` }
            )
            .setThumbnail('https://cdn-icons-png.flaticon.com/512/8113/8113642.png')
            .setFooter({ text: `${message.author.username} tarafından bulundu. Kalan Harita Parçası: ${profile.mapPieces - MAP_REQUIREMENT}` })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }
};
