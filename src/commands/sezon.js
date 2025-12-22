const { EmbedBuilder } = require('discord.js');
const { getCurrentSeason, getSeasonInfo, seasonalAnimals } = require('../lethe/seedData');

const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'hidden'];
const rarityEmojis = {
  common: '⬜',
  uncommon: '🟩',
  rare: '🟦',
  epic: '🟪',
  legendary: '🟨',
  mythic: '🟧',
  hidden: '❓'
};

const rarityNames = {
  common: 'Yaygın',
  uncommon: 'Sıradışı',
  rare: 'Nadir',
  epic: 'Epik',
  legendary: 'Efsanevi',
  mythic: 'Mitik',
  hidden: 'Gizli'
};

module.exports = {
  name: 'sezon',
  aliases: ['season', 'mevsim', 'seasonal'],
  description: 'Aktif sezonu ve sezonluk hayvanları gösterir',
  category: 'lethe',
  async execute(message, args, client, storage) {
    const guildData = await storage.getGuild(message.guild.id);
    if (guildData?.modules && guildData.modules.economy === false) {
      return message.reply('❌ Lethe Game bu sunucuda devre dışı.');
    }

    const currentSeason = getCurrentSeason();
    const seasonInfo = getSeasonInfo(currentSeason);
    
    const subCommand = args[0]?.toLowerCase();

    if (subCommand === 'tüm' || subCommand === 'all' || subCommand === 'hepsi') {
      const seasons = ['spring', 'summer', 'fall', 'winter'];
      const embeds = [];

      for (const season of seasons) {
        const sInfo = getSeasonInfo(season);
        const sAnimals = seasonalAnimals.filter(a => a.season === season);
        
        const animalsByRarity = {};
        for (const animal of sAnimals) {
          if (!animalsByRarity[animal.rarity]) {
            animalsByRarity[animal.rarity] = [];
          }
          animalsByRarity[animal.rarity].push(animal);
        }

        let description = '';
        for (const rarity of rarityOrder) {
          if (animalsByRarity[rarity]) {
            const animals = animalsByRarity[rarity];
            description += `\n**${rarityEmojis[rarity]} ${rarityNames[rarity]}** (${animals.length})\n`;
            description += animals.map(a => `${a.emoji} ${a.name}`).join(' • ') + '\n';
          }
        }

        const isActive = season === currentSeason;
        
        const embed = new EmbedBuilder()
          .setColor(sInfo.color)
          .setTitle(`${sInfo.emoji} ${sInfo.name} Hayvanları ${isActive ? '(AKTİF)' : ''}`)
          .setDescription(description || 'Bu sezon için hayvan yok.')
          .addFields({ name: '📅 Dönem', value: sInfo.months, inline: true })
          .setFooter({ text: isActive ? '✅ Bu sezon şu anda aktif!' : '⏳ Bu sezon şu anda aktif değil' });

        embeds.push(embed);
      }

      return message.reply({ embeds: embeds.slice(0, 4) });
    }

    // Show current season
    const currentSeasonAnimals = seasonalAnimals.filter(a => a.season === currentSeason);
    
    const animalsByRarity = {};
    for (const animal of currentSeasonAnimals) {
      if (!animalsByRarity[animal.rarity]) {
        animalsByRarity[animal.rarity] = [];
      }
      animalsByRarity[animal.rarity].push(animal);
    }

    let animalList = '';
    for (const rarity of rarityOrder) {
      if (animalsByRarity[rarity]) {
        const animals = animalsByRarity[rarity];
        animalList += `\n**${rarityEmojis[rarity]} ${rarityNames[rarity]}** (${animals.length})\n`;
        animalList += animals.map(a => `${a.emoji} ${a.name}`).join(' • ') + '\n';
      }
    }

    const embed = new EmbedBuilder()
      .setColor(seasonInfo.color)
      .setTitle(`${seasonInfo.emoji} ${seasonInfo.name} Sezonu`)
      .setDescription(`Şu anda **${seasonInfo.name}** sezonu aktif!\n\nBu sezonda özel hayvanları yakalayabilirsin. Bu hayvanlar sadece ${seasonInfo.months} ayları arasında yakalanabilir.`)
      .addFields(
        { name: '📅 Dönem', value: seasonInfo.months, inline: true },
        { name: '🦁 Hayvan Sayısı', value: `${currentSeasonAnimals.length}`, inline: true },
        { name: `${seasonInfo.emoji} Bu Sezonun Hayvanları`, value: animalList || 'Hayvan bulunamadı.', inline: false }
      )
      .setFooter({ text: 'Tüm sezonları görmek için: !sezon tüm | Avlanmak için: !a' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
