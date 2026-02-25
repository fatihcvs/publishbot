const { EmbedBuilder } = require('discord.js');
const { getOrCreateProfile } = require('../../lethe/letheStorage');
const { db } = require('../../database/db');
const { userLetheProfile } = require('../../../shared/schema');
const { eq } = require('drizzle-orm');
const { regions } = require('../../lethe/seedData');

module.exports = {
    name: 'keşfet',
    aliases: ['kesfet', 'explore', 'bolge', 'bölge'],
    description: 'Lethe Game Biyom/Keşif Sistemi',
    letheGame: true,
    async execute(message, args, client) {
        const subCommand = args[0] ? args[0].toLowerCase() : 'bölgeler';
        const profile = await getOrCreateProfile(message.author.id);

        // Enerji yenilenmesini hesapla (Saatte 10 enerji, max 100)
        let currentEnergy = profile.explorationEnergy;
        if (profile.lastEnergyUpdate) {
            const hoursPassed = (Date.now() - new Date(profile.lastEnergyUpdate).getTime()) / (1000 * 60 * 60);
            const energyGained = Math.floor(hoursPassed * 10);
            if (energyGained > 0) {
                currentEnergy = Math.min(100, currentEnergy + energyGained);
                // Enerjiyi güncelle
                await db.update(userLetheProfile)
                    .set({
                        explorationEnergy: currentEnergy,
                        lastEnergyUpdate: new Date()
                    })
                    .where(eq(userLetheProfile.visitorId, message.author.id));
            }
        } else {
            // İlk kez kullanıyorsa güncel zamanı ata
            await db.update(userLetheProfile)
                .set({ lastEnergyUpdate: new Date() })
                .where(eq(userLetheProfile.visitorId, message.author.id));
        }

        // MEVCUT BÖLGELERİ LİSTELE (!keşfet bölgeler)
        if (subCommand === 'bölgeler' || subCommand === 'regions' || subCommand === 'liste') {
            const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('🗺️ Lethe Keşif Haritası')
                .setDescription(`Mevcut Enerjin: **${currentEnergy}** ⚡ (Saatte 10 ⚡ yenilenir)\nMevcut Bölgen: **${regions.find(r => r.id === profile.currentRegionId)?.name || 'Bilinmiyor'}**`);

            for (const region of regions) {
                const isCurrent = profile.currentRegionId === region.id;
                const status = isCurrent ? '📍 **[Şu An Buradasın]**' : `(Seviye ${region.requiredLevel}+ | Maliyet: ${region.energyCost} ⚡)`;
                embed.addFields({
                    name: `${region.emoji} ${region.name} (${region.id})`,
                    value: `${region.description}\n${status}`
                });
            }

            embed.setFooter({ text: 'Bir bölgeye gitmek için: !keşfet git <bölge_id>' });
            return message.reply({ embeds: [embed] });
        }

        // BÖLGEYE GİT (!keşfet git <bölge_id>)
        if (subCommand === 'git' || subCommand === 'travel') {
            const targetId = args[1]?.toLowerCase();
            if (!targetId) {
                return message.reply(`Lütfen bir bölge ID'si gir! Bölgeleri görmek için: \`!keşfet bölgeler\``);
            }

            const region = regions.find(r => r.id === targetId);
            if (!region) {
                return message.reply(`Böyle bir bölge bulunamadı. Lütfen geçerli bir bölge ID'si girin. (Örn: forest, desert)`);
            }

            if (profile.currentRegionId === region.id) {
                return message.reply(`Zaten **${region.emoji} ${region.name}** bölgesindesin!`);
            }

            if (profile.level < region.requiredLevel) {
                return message.reply(`Bu bölgeye gitmek için **Seviye ${region.requiredLevel}** olmalısın! (Mevcut seviyeni \`!profil\` ile görebilirsin)`);
            }

            if (currentEnergy < region.energyCost) {
                return message.reply(`Bu bölgeye seyahat etmek için enerjin yetersiz! Gereken: **${region.energyCost}** ⚡ (Mevcut: **${currentEnergy}** ⚡)`);
            }

            // Bölgeyi değiştir ve enerjiyi düşür
            await db.update(userLetheProfile)
                .set({
                    explorationEnergy: currentEnergy - region.energyCost,
                    currentRegionId: region.id
                })
                .where(eq(userLetheProfile.visitorId, message.author.id));

            const embed = new EmbedBuilder()
                .setColor('#e67e22')
                .setTitle('✈️ Seyahat Başarılı!')
                .setDescription(`Yolculuk tamamlandı! Artık **${region.emoji} ${region.name}** bölgesindesin.\n\nKalan Enerji: **${currentEnergy - region.energyCost}** ⚡`)
                .setFooter({ text: 'Burada karşılaşacağın hayvanlar bu bölgeye özel olabilir!' });

            return message.reply({ embeds: [embed] });
        }

        // YARDIM
        const helpEmbed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('🗺️ Lethe Keşif Sistemi')
            .setDescription('Farklı biyomlara seyahat et ve o bölgeye özel hayvanları avla!')
            .addFields(
                { name: 'Nasıl Kullanılır?', value: 'Enerjini kullanarak haritada yeni bölgelere gidebilirsin. Her bölgenin kendine has hayvanları (veya gelecekte düşmanları) bulunur. Gittiğin bölgede \`!avla\` komutunu kullanmaya devam edebilirsin.' },
                { name: 'Komutlar', value: '\`!keşfet\` veya \`!keşfet bölgeler\` - Tüm haritayı ve enerjini gösterir\n\`!keşfet git <bölge_id>\` - Başka bir bölgeye seyahat edersin' }
            );
        return message.reply({ embeds: [helpEmbed] });
    }
};
