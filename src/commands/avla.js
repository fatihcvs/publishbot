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

const rarityNames = {
  common: '⬜ Yaygın',
  uncommon: '🟩 Sıradışı',
  rare: '🟦 Nadir',
  epic: '🟪 Epik',
  legendary: '🟨 Efsanevi',
  mythic: '🟧 Mitik',
  hidden: '❓ Gizli'
};

module.exports = {
  name: 'avla',
  aliases: ['av', 'hunt', 'yakala'],
  description: 'Hayvan avla ve koleksiyonuna ekle',
  category: 'lethe',
  async execute(message, args, client, storage) {
    const result = await letheStorage.huntAnimal(message.guild.id, message.author.id);

    if (!result.success) {
      if (result.cooldown) {
        return message.reply(`⏳ Çok hızlı avlanıyorsun! **${result.cooldown} saniye** bekle.`);
      }
      return message.reply('❌ Avlanma sırasında bir hata oluştu.');
    }

    const animal = result.animal;
    const rarityColor = rarityColors[animal.rarity] || '#9ca3af';
    const rarityName = rarityNames[animal.rarity] || animal.rarity;

    const embed = new EmbedBuilder()
      .setColor(rarityColor)
      .setTitle(`${animal.emoji} ${animal.name} Yakaladın!`)
      .setDescription(`**${rarityName}** bir hayvan yakaladın!`)
      .addFields(
        { name: '❤️ HP', value: `${animal.baseHp}`, inline: true },
        { name: '⚔️ STR', value: `${animal.baseStr}`, inline: true },
        { name: '🛡️ DEF', value: `${animal.baseDef}`, inline: true },
        { name: '⚡ SPD', value: `${animal.baseSpd}`, inline: true },
        { name: '💰 Değer', value: `${animal.sellPrice}`, inline: true },
        { name: '✨ XP', value: `+${animal.xpReward}`, inline: true }
      )
      .setFooter({ text: 'Koleksiyonunu görmek için: !koleksiyon' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
