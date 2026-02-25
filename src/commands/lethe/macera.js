const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const letheStorage = require('../../lethe/letheStorage');
const { adventureNpcs } = require('../../lethe/seedData');
const { db } = require('../../database/db');
const { userLetheProfile } = require('../../../shared/schema');
const { eq, sql } = require('drizzle-orm');

module.exports = {
    name: 'macera',
    aliases: ['adventure', 'macerayaatıl'],
    description: 'Bulunduğun bölgedeki NPC ile maceraya atıl (Enerji harcar)',
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
        const ENERGY_COST = 15;

        if (profile.explorationEnergy < ENERGY_COST) {
            return message.reply(`❌ Bu maceraya atılmak için yeterli enerjin yok! Gereken: ${ENERGY_COST} ⚡ | Mevcut: ${profile.explorationEnergy} ⚡`);
        }

        // Find Region NPC
        const npc = adventureNpcs.find(n => n.regionId === profile.currentRegionId);
        if (!npc) {
            return message.reply('❌ Bulunduğun bölgede konuşabileceğin bir NPC yok gibi görünüyor.');
        }

        const embed = new EmbedBuilder()
            .setColor('#3b82f6')
            .setTitle(`⛺ ${npc.name} ile Karşılaştın!`)
            .setDescription(`**${npc.name}:** "${npc.dialog}"\n\nBu NPC sana rastgele bir görev verecek veya başından geçen bir hikayeyi anlatacak. Maceraya atılmak ${ENERGY_COST} ⚡ Enerjiye mal olacak.`)
            .setFooter({ text: 'Not: Başarı ihtimali tamamen şansa bağlıdır.' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('adv_accept')
                    .setLabel('Maceraya Atıl')
                    .setEmoji('⚔️')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('adv_decline')
                    .setLabel('Vazgeç')
                    .setEmoji('✖️')
                    .setStyle(ButtonStyle.Secondary)
            );

        const msg = await message.reply({ embeds: [embed], components: [row] });

        // Create collector
        const filter = i => i.user.id === message.author.id;
        const collector = msg.createMessageComponentCollector({ filter, time: 30000, max: 1 });

        collector.on('collect', async interaction => {
            if (interaction.customId === 'adv_decline') {
                return interaction.update({ content: 'Maceradan vazgeçtin.', embeds: [], components: [] });
            }

            if (interaction.customId === 'adv_accept') {
                // Double check energy
                const currentProfile = await letheStorage.getOrCreateProfile(message.author.id);
                if (currentProfile.explorationEnergy < ENERGY_COST) {
                    return interaction.update({ content: '❌ Enerjin yetersiz!', embeds: [], components: [] });
                }

                // Deduct Energy
                await db.update(userLetheProfile)
                    .set({ explorationEnergy: sql`${userLetheProfile.explorationEnergy} - ${ENERGY_COST}` })
                    .where(eq(userLetheProfile.visitorId, message.author.id));

                // Lethe Storage Add Coins will trigger Process Achievements directly
                const isSuccess = Math.random() > 0.40; // 60% success rate
                let rewardText = '';
                let resultEmbed = new EmbedBuilder().setTitle('⚔️ Macera Sonucu');

                if (isSuccess) {
                    const coinReward = Math.floor(Math.random() * 200) + 50; // 50-250
                    const xpReward = Math.floor(Math.random() * 50) + 10;

                    await letheStorage.addCoins(message.author.id, coinReward);

                    // Raw XP Add
                    await db.update(userLetheProfile)
                        .set({ xp: sql`${userLetheProfile.xp} + ${xpReward}` })
                        .where(eq(userLetheProfile.visitorId, message.author.id));

                    await letheStorage.checkLevelUp(message.author.id);

                    resultEmbed.setColor('#10b981')
                        .setDescription(`**${npc.name}:** "Harika bir iş çıkardın cesur savaşçı! İşte ödülün."\n\n**Kazanımlar:**\n💰 +${coinReward} Altın\n⭐ +${xpReward} XP`)
                        .setFooter({ text: `${ENERGY_COST} ⚡ Enerji harcandı.` });
                } else {
                    resultEmbed.setColor('#ef4444')
                        .setDescription(`**${npc.name}:** "Maalesef bu sefer işler ters gitti. Dikkatli olmalısın."\n\n*Görev başarısız oldu ve hiçbir şey kazanamadın.*`)
                        .setFooter({ text: `${ENERGY_COST} ⚡ Enerji harcandı.` });
                }

                // Hazine Haritası Parçası Düşme Şansı (%15 - Phase 7 Part 2)
                const mapDropChance = Math.random();
                if (mapDropChance <= 0.15) {
                    await db.update(userLetheProfile)
                        .set({ mapPieces: sql`${userLetheProfile.mapPieces} + 1` })
                        .where(eq(userLetheProfile.visitorId, message.author.id));

                    resultEmbed.addFields({ name: '🗺️ Gizemli Buluntu!', value: 'Yerde parlayan bir şey var... **1x Hazine Haritası Parçası** buldun!' });
                }

                await interaction.update({ embeds: [resultEmbed], components: [] });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                msg.edit({ content: '⏱️ Süre doldu, maceraya atılamadın.', embeds: [], components: [] }).catch(() => { });
            }
        });
    }
};
