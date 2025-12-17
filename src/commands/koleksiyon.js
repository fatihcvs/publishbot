const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');

const rarityColors = {
  common: '#9ca3af',
  uncommon: '#10b981',
  rare: '#3b82f6',
  epic: '#8b5cf6',
  legendary: '#f59e0b',
  mythic: '#f97316',
  hidden: '#ef4444'
};

const rarityEmojis = {
  common: '⬜',
  uncommon: '🟩',
  rare: '🟦',
  epic: '🟪',
  legendary: '🟨',
  mythic: '🟧',
  hidden: '❓'
};

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

    const itemsPerPage = 10;
    const totalPages = Math.ceil(animals.length / itemsPerPage);
    let currentPage = 0;

    const generateEmbed = (page) => {
      const start = page * itemsPerPage;
      const end = start + itemsPerPage;
      const pageAnimals = animals.slice(start, end);

      const description = pageAnimals.map((a, i) => {
        const info = a.animalInfo;
        const user = a.userAnimal;
        const rarityEmoji = rarityEmojis[info.rarity] || '⬜';
        const teamIndicator = user.isInTeam ? '⭐' : '';
        const nickname = user.nickname ? `"${user.nickname}"` : '';
        return `**${start + i + 1}.** ${teamIndicator}${info.emoji} ${info.name} ${nickname} ${rarityEmoji}\n` +
               `   Lv.${user.level} | ❤️${user.hp} ⚔️${user.str} 🛡️${user.def} ⚡${user.spd} | ID: \`${user.id}\``;
      }).join('\n\n');

      const embed = new EmbedBuilder()
        .setColor('#8b5cf6')
        .setTitle(`🦁 ${message.author.username} - Koleksiyon`)
        .setDescription(description)
        .setFooter({ text: `Sayfa ${page + 1}/${totalPages} | Toplam: ${animals.length} hayvan` })
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
