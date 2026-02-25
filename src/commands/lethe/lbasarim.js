const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const letheStorage = require('../../lethe/letheStorage');

module.exports = {
    name: 'lbaşarım',
    aliases: ['lbasarim', 'lachievements', 'lethebaşarım', 'lethebasarim'],
    description: 'Lethe Game başarım ve rozetlerini görüntüler',
    letheGame: true,
    async execute(message, args, client) {
        const targetUser = message.mentions.users.first() || message.author;
        const achievementsData = await letheStorage.getLetheAchievements(targetUser.id);

        const allAchs = achievementsData.all;
        const unlockedList = achievementsData.unlocked;
        const unlockedIds = new Set(unlockedList.map(a => a.achievementId));

        if (allAchs.length === 0) {
            return message.reply('Oyun başarımları henüz yüklenmemiş.');
        }

        // Gruplama
        const categories = {
            'Avcılık (Hunts)': allAchs.filter(a => a.requirement === 'hunts'),
            'Savaş (Battles)': allAchs.filter(a => a.requirement === 'battles_won'),
            'Ekonomi (Balance)': allAchs.filter(a => a.requirement === 'balance'),
            'Seviye (Level)': allAchs.filter(a => a.requirement === 'level'),
            'Boss (Boss Kills)': allAchs.filter(a => a.requirement === 'bosses_killed'),
            'Koleksiyon & Biyom (Collection)': allAchs.filter(a => a.requirement === 'collection' || a.requirement.startsWith('region_'))
        };

        const categoryKeys = Object.keys(categories).filter(k => categories[k].length > 0);
        let currentCatIndex = 0;

        const generateEmbed = (index) => {
            const catName = categoryKeys[index];
            const achsInCat = categories[catName];

            let description = `*${targetUser.username} Lethe Game Başarımları*\n\n`;
            let unlockedCount = 0;

            for (const ach of achsInCat) {
                const isUnlocked = unlockedIds.has(ach.achievementId);
                if (isUnlocked) unlockedCount++;

                const statusIcon = isUnlocked ? '✅' : '🔒';
                const nameFormat = isUnlocked ? `**${ach.name}**` : `~~${ach.name}~~`;
                const rewardText = [];
                if (ach.rewardMoney > 0) rewardText.push(`+${ach.rewardMoney}💰`);
                if (ach.rewardXp > 0) rewardText.push(`+${ach.rewardXp} XP`);
                const rewardStr = rewardText.length > 0 ? ` [Ödül: ${rewardText.join(', ')}]` : '';

                description += `${statusIcon} ${ach.emoji} ${nameFormat}\n> *${ach.description}*${rewardStr}\n\n`;
            }

            const totalUnlocked = unlockedIds.size;
            const totalAchs = allAchs.length;
            const progress = Math.round((totalUnlocked / totalAchs) * 100);

            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle(`🏅 Başarımlar: ${catName}`)
                .setDescription(description)
                .addFields({ name: 'Genel İlerleme', value: `Kazanılan: **${totalUnlocked}/${totalAchs}** (%${progress})` })
                .setFooter({ text: `Kategori ${index + 1} / ${categoryKeys.length}` })
                .setTimestamp();

            if (targetUser.displayAvatarURL) {
                embed.setThumbnail(targetUser.displayAvatarURL({ dynamic: true }));
            }

            return embed;
        };

        if (categoryKeys.length <= 1) {
            return message.reply({ embeds: [generateEmbed(0)] });
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ach_prev')
                    .setLabel('◀️ Kategori')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('ach_next')
                    .setLabel('Kategori ▶️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(categoryKeys.length <= 1)
            );

        const msg = await message.reply({ embeds: [generateEmbed(0)], components: [row] });

        const collector = msg.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async (interaction) => {
            if (interaction.user.id !== message.author.id) {
                return interaction.reply({ content: 'Bu butonlar sana ait değil!', ephemeral: true });
            }

            if (interaction.customId === 'ach_prev') {
                currentCatIndex = Math.max(0, currentCatIndex - 1);
            } else if (interaction.customId === 'ach_next') {
                currentCatIndex = Math.min(categoryKeys.length - 1, currentCatIndex + 1);
            }

            const newRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('ach_prev')
                        .setLabel('◀️ Kategori')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentCatIndex === 0),
                    new ButtonBuilder()
                        .setCustomId('ach_next')
                        .setLabel('Kategori ▶️')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentCatIndex === categoryKeys.length - 1)
                );

            await interaction.update({ embeds: [generateEmbed(currentCatIndex)], components: [newRow] });
        });

        collector.on('end', () => {
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId('ach_prev').setLabel('◀️ Kategori').setStyle(ButtonStyle.Primary).setDisabled(true),
                    new ButtonBuilder().setCustomId('ach_next').setLabel('Kategori ▶️').setStyle(ButtonStyle.Primary).setDisabled(true)
                );
            msg.edit({ components: [disabledRow] }).catch(() => { });
        });
    }
};
