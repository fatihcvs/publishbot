const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');

const rarityColors = {
  common: '#9ca3af',
  uncommon: '#10b981',
  rare: '#3b82f6',
  epic: '#8b5cf6',
  legendary: '#f59e0b',
  mythic: '#f97316',
  hidden: '#ef4444',
  eternal: '#ffd700'
};

const rarityEmojis = {
  common: '⬜',
  uncommon: '🟩',
  rare: '🟦',
  epic: '🟪',
  legendary: '🟨',
  mythic: '🟧',
  hidden: '❓',
  eternal: '👑'
};

const rarityOrder = ['eternal', 'hidden', 'mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common'];

module.exports = {
  name: 'koleksiyon',
  aliases: ['collection', 'hayvanlar', 'animals', 'zoo'],
  description: 'Yakaladığın hayvanları görüntüle',
  category: 'lethe',
  async execute(message, args, client, storage) {
    const guildData = await storage.getGuild(message.guild.id);
    if (guildData?.modules && guildData.modules.economy === false) {
      return message.reply('❌ Lethe Game bu sunucuda devre dışı.');
    }
    
    const letheChannels = guildData?.modules?.letheChannels || [];
    if (letheChannels.length > 0 && !letheChannels.includes(message.channel.id)) {
      return message.reply(`❌ Lethe Game komutları sadece belirlenen kanallarda çalışır! \`!oyunkanal liste\` ile kontrol et.`);
    }
    
    const animals = await letheStorage.getUserAnimals(message.author.id);

    if (animals.length === 0) {
      return message.reply('🔍 Henüz hiç hayvan yakalamamışsın! `!avla` komutuyla başla.');
    }

    const animalGroups = {};
    for (const a of animals) {
      const key = a.animalInfo.animalId;
      if (!animalGroups[key]) {
        animalGroups[key] = {
          info: a.animalInfo,
          animals: [],
          count: 0,
          hasTeamMember: false
        };
      }
      animalGroups[key].animals.push(a.userAnimal);
      animalGroups[key].count++;
      if (a.userAnimal.isInTeam) {
        animalGroups[key].hasTeamMember = true;
      }
    }

    const groupedList = Object.values(animalGroups).sort((a, b) => {
      const aIndex = rarityOrder.indexOf(a.info.rarity);
      const bIndex = rarityOrder.indexOf(b.info.rarity);
      if (aIndex !== bIndex) return aIndex - bIndex;
      return b.count - a.count;
    });

    const itemsPerPage = 15;
    const totalPages = Math.ceil(groupedList.length / itemsPerPage);
    let currentPage = 0;

    const generateEmbed = (page) => {
      const start = page * itemsPerPage;
      const end = start + itemsPerPage;
      const pageGroups = groupedList.slice(start, end);

      const description = pageGroups.map((group) => {
        const info = group.info;
        const rarityEmoji = rarityEmojis[info.rarity] || '⬜';
        const teamIndicator = group.hasTeamMember ? '⭐' : '';
        const countText = group.count > 1 ? ` x${group.count}` : '';
        const ids = group.animals.map(a => a.id).join(', ');
        return `${teamIndicator}${info.emoji} **${info.name}**${countText} ${rarityEmoji} | ID: \`${ids}\``;
      }).join('\n');

      const embed = new EmbedBuilder()
        .setColor('#8b5cf6')
        .setTitle(`🦁 ${message.author.username} - Koleksiyon`)
        .setDescription(description)
        .setFooter({ text: `Sayfa ${page + 1}/${totalPages} | ${groupedList.length} tür, ${animals.length} hayvan` })
        .setTimestamp();

      return embed;
    };

    if (totalPages <= 1) {
      return message.reply({ embeds: [generateEmbed(0)] });
    }

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('prev')
          .setLabel('◀️ Önceki')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('Sonraki ▶️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(totalPages <= 1)
      );

    const msg = await message.reply({ embeds: [generateEmbed(0)], components: [row] });

    const collector = msg.createMessageComponentCollector({ time: 60000 });

    collector.on('collect', async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({ content: 'Bu butonlar sana ait değil!', ephemeral: true });
      }

      if (interaction.customId === 'prev') {
        currentPage = Math.max(0, currentPage - 1);
      } else if (interaction.customId === 'next') {
        currentPage = Math.min(totalPages - 1, currentPage + 1);
      }

      const newRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('prev')
            .setLabel('◀️ Önceki')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage === 0),
          new ButtonBuilder()
            .setCustomId('next')
            .setLabel('Sonraki ▶️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage === totalPages - 1)
        );

      await interaction.update({ embeds: [generateEmbed(currentPage)], components: [newRow] });
    });

    collector.on('end', () => {
      const disabledRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('prev')
            .setLabel('◀️ Önceki')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('next')
            .setLabel('Sonraki ▶️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        );
      msg.edit({ components: [disabledRow] }).catch(() => {});
    });
  }
};
