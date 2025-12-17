const { EmbedBuilder } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');

const evolutionEmojis = ['', '⭐', '⭐⭐', '⭐⭐⭐'];

const rarityColors = {
  common: '#9ca3af',
  uncommon: '#10b981',
  rare: '#3b82f6',
  epic: '#8b5cf6',
  legendary: '#f59e0b',
  mythic: '#f97316',
  hidden: '#ef4444'
};

const gemEmojis = {
  common: '⬜',
  uncommon: '🟩',
  rare: '🟦',
  epic: '🟪',
  legendary: '🟨',
  mythic: '🟧',
  hidden: '❓'
};

module.exports = {
  name: 'evrim',
  aliases: ['ev', 'evolve', 'evolution', 'birleştir'],
  description: 'Aynı türden 3 hayvanı birleştirerek evrimleştir',
  usage: '!evrim <hayvan_id1> <hayvan_id2> <hayvan_id3> veya !evrim taşlar',
  category: 'lethe',
  async execute(message, args, client, storage) {
    const guildData = await storage.getGuild(message.guild.id);
    if (guildData?.modules && guildData.modules.economy === false) {
      return message.reply('❌ Lethe Game bu sunucuda devre dışı.');
    }

    if (args[0] === 'taşlar' || args[0] === 'gems' || args[0] === 'taslar') {
      const gems = await letheStorage.getUserGems(message.author.id);
      
      const embed = new EmbedBuilder()
        .setColor('#8b5cf6')
        .setTitle('💎 Evrim Taşların')
        .setDescription('Hayvanları evrimleştirmek için taşlar gerekli!')
        .addFields(
          { name: `${gemEmojis.common} Yaygın`, value: `${gems.common}`, inline: true },
          { name: `${gemEmojis.uncommon} Sıradışı`, value: `${gems.uncommon}`, inline: true },
          { name: `${gemEmojis.rare} Nadir`, value: `${gems.rare}`, inline: true },
          { name: `${gemEmojis.epic} Epik`, value: `${gems.epic}`, inline: true },
          { name: `${gemEmojis.legendary} Efsanevi`, value: `${gems.legendary}`, inline: true },
          { name: `${gemEmojis.mythic} Mitik`, value: `${gems.mythic}`, inline: true },
          { name: `${gemEmojis.hidden} Gizli`, value: `${gems.hidden}`, inline: true }
        )
        .addFields({
          name: '📜 Nasıl Kazanılır?',
          value: 'Hayvan avlarken düşük şansla evrim taşı kazanırsın! Nadir hayvanlar daha değerli taşlar düşürür.',
          inline: false
        })
        .setFooter({ text: 'Evrim için: !evrim <id1> <id2> <id3>' })
        .setTimestamp();
      
      return message.reply({ embeds: [embed] });
    }

    if (args[0] === 'bilgi' || args[0] === 'info') {
      const requirements = letheStorage.evolutionGemRequirements;
      
      let reqText = '';
      for (const [rarity, req] of Object.entries(requirements)) {
        reqText += `${gemEmojis[rarity]} **${rarity}**: ${req.amount} taş + ${req.coinCost}💰\n`;
      }
      
      const embed = new EmbedBuilder()
        .setColor('#8b5cf6')
        .setTitle('✨ Evrim Sistemi')
        .setDescription('Aynı türden 3 hayvanı birleştirerek daha güçlü bir hayvan elde et!')
        .addFields(
          { name: '🔄 Nasıl Çalışır?', value: '1. Aynı türden 3 hayvan topla\n2. Gerekli evrim taşlarını kazan\n3. `!evrim <id1> <id2> <id3>` ile birleştir\n4. En güçlü hayvan kalır, diğerleri harcanır', inline: false },
          { name: '📊 Evrim Seviyeleri', value: '⭐ Seviye 1: +20 HP, +5 STR, +5 DEF\n⭐⭐ Seviye 2: +40 HP, +10 STR, +10 DEF\n⭐⭐⭐ Seviye 3: +60 HP, +15 STR, +15 DEF (MAX)', inline: false },
          { name: '💎 Gereksinimler', value: reqText, inline: false },
          { name: '🎁 Bonus', value: 'Evrimleşen hayvan rastgele bir yetenek kazanır!', inline: false }
        )
        .setTimestamp();
      
      return message.reply({ embeds: [embed] });
    }

    if (args.length < 3) {
      const embed = new EmbedBuilder()
        .setColor('#f59e0b')
        .setTitle('✨ Evrim Sistemi')
        .setDescription('Aynı türden 3 hayvanı birleştirerek evrimleştir!')
        .addFields(
          { name: '📖 Kullanım', value: '`!evrim <hayvan_id1> <hayvan_id2> <hayvan_id3>`', inline: false },
          { name: '💎 Taşlarını Gör', value: '`!evrim taşlar`', inline: true },
          { name: '📜 Detaylı Bilgi', value: '`!evrim bilgi`', inline: true }
        )
        .setFooter({ text: 'Hayvan ID\'lerini !koleksiyon ile görebilirsin' })
        .setTimestamp();
      
      return message.reply({ embeds: [embed] });
    }

    const id1 = parseInt(args[0]);
    const id2 = parseInt(args[1]);
    const id3 = parseInt(args[2]);

    if (isNaN(id1) || isNaN(id2) || isNaN(id3)) {
      return message.reply('❌ Geçerli hayvan ID\'leri girmelisin!');
    }

    if (id1 === id2 || id1 === id3 || id2 === id3) {
      return message.reply('❌ Farklı hayvanlar seçmelisin! (Aynı tür, farklı ID)');
    }

    const result = await letheStorage.evolveAnimal(message.author.id, id1, id2, id3);

    if (!result.success) {
      return message.reply(`❌ ${result.error}`);
    }

    const { animal, animalInfo, newEvolutionLevel, statBonus, ability, gemsUsed, coinsUsed } = result;

    const embed = new EmbedBuilder()
      .setColor(rarityColors[animalInfo.rarity] || '#8b5cf6')
      .setTitle(`✨ EVRİM BAŞARILI! ✨`)
      .setDescription(`${animalInfo.emoji} **${animalInfo.name}** evrimleşti!\n${evolutionEmojis[newEvolutionLevel]} Evrim Seviyesi: **${newEvolutionLevel}/3**`)
      .addFields(
        { name: '📊 Yeni Statlar', value: `❤️ HP: ${animal.hp}\n⚔️ STR: ${animal.str}\n🛡️ DEF: ${animal.def}\n⚡ SPD: ${animal.spd}`, inline: true },
        { name: '📈 Bonus', value: `+${statBonus + 20} HP\n+${Math.floor(statBonus / 2) + 5} STR\n+${Math.floor(statBonus / 2) + 5} DEF\n+${Math.floor(statBonus / 3) + 3} SPD`, inline: true }
      );

    if (ability) {
      embed.addFields({
        name: `${ability.emoji} Yetenek Kazanıldı!`,
        value: `**${ability.name}**\n${ability.description}`,
        inline: false
      });
    }

    embed.addFields({
      name: '💰 Harcanan',
      value: `${gemsUsed} ${gemEmojis[animalInfo.rarity]} taş\n${coinsUsed}💰`,
      inline: false
    });

    embed.setFooter({ text: `2 hayvan harcanarak birleştirildi | ID: ${animal.id}` })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
