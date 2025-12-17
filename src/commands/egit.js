const { EmbedBuilder } = require('discord.js');
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

const evolutionEmojis = ['', '⭐', '⭐⭐', '⭐⭐⭐'];

module.exports = {
  name: 'eğit',
  aliases: ['eg', 'egit', 'train', 'antrenman'],
  description: 'Hayvanını eğiterek güçlendir',
  usage: '!eğit <hayvan_id>',
  category: 'lethe',
  async execute(message, args, client, storage) {
    const guildData = await storage.getGuild(message.guild.id);
    if (guildData?.modules && guildData.modules.economy === false) {
      return message.reply('❌ Lethe Game bu sunucuda devre dışı.');
    }

    if (!args[0] || args[0] === 'bilgi' || args[0] === 'info') {
      const embed = new EmbedBuilder()
        .setColor('#10b981')
        .setTitle('🏋️ Eğitim Sistemi')
        .setDescription('Hayvanlarını eğiterek statlarını artır!')
        .addFields(
          { name: '📖 Kullanım', value: '`!eğit <hayvan_id>`', inline: false },
          { name: '⏰ Cooldown', value: 'Her hayvan için 1 saat', inline: true },
          { name: '📊 Maksimum Seviye', value: '10 eğitim seviyesi', inline: true },
          { name: '💰 Maliyet', value: '100💰 + (seviye × 50💰)', inline: true },
          { name: '📈 Kazanımlar', value: '• +5-15 HP\n• +1-4 STR\n• +1-4 DEF\n• +1-3 SPD\n• XP kazanımı', inline: false }
        )
        .setFooter({ text: 'Hayvan ID\'lerini !koleksiyon ile görebilirsin' })
        .setTimestamp();
      
      return message.reply({ embeds: [embed] });
    }

    const animalId = parseInt(args[0]);
    if (isNaN(animalId)) {
      return message.reply('❌ Geçerli bir hayvan ID\'si girmelisin!');
    }

    const result = await letheStorage.trainAnimal(message.author.id, animalId);

    if (!result.success) {
      if (result.cooldown) {
        return message.reply(`⏰ Bu hayvan dinleniyor! **${result.cooldown}** dakika sonra tekrar eğitebilirsin.`);
      }
      return message.reply(`❌ ${result.error}`);
    }

    const { animal, animalInfo, statGains, xpGain, cost, newTrainingLevel } = result;

    const embed = new EmbedBuilder()
      .setColor(rarityColors[animalInfo.rarity] || '#10b981')
      .setTitle(`🏋️ Eğitim Tamamlandı!`)
      .setDescription(`${animalInfo.emoji} **${animalInfo.name}** ${animal.nickname ? `"${animal.nickname}"` : ''} eğitildi!\n${evolutionEmojis[animal.evolutionLevel] || ''} Eğitim Seviyesi: **${newTrainingLevel}/10**`)
      .addFields(
        { 
          name: '📈 Stat Artışları', 
          value: `❤️ HP: +${statGains.hp}\n⚔️ STR: +${statGains.str}\n🛡️ DEF: +${statGains.def}\n⚡ SPD: +${statGains.spd}`, 
          inline: true 
        },
        { 
          name: '📊 Güncel Statlar', 
          value: `❤️ HP: ${animal.hp}\n⚔️ STR: ${animal.str}\n🛡️ DEF: ${animal.def}\n⚡ SPD: ${animal.spd}`, 
          inline: true 
        },
        { name: '✨ XP Kazanıldı', value: `+${xpGain} XP`, inline: true }
      );

    if (animal.ability) {
      const abilityInfo = letheStorage.abilities[animal.ability];
      if (abilityInfo) {
        embed.addFields({
          name: `${abilityInfo.emoji} Yetenek`,
          value: `**${abilityInfo.name}**\n${abilityInfo.description}`,
          inline: false
        });
      }
    }

    embed.addFields({ name: '💰 Harcanan', value: `${cost}💰`, inline: false });

    const nextCost = 100 + (newTrainingLevel * 50);
    if (newTrainingLevel < 10) {
      embed.setFooter({ text: `Sonraki eğitim maliyeti: ${nextCost}💰 | 1 saat sonra tekrar eğitebilirsin` });
    } else {
      embed.setFooter({ text: 'Maksimum eğitim seviyesine ulaşıldı!' });
    }

    embed.setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
