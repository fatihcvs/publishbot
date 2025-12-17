const { EmbedBuilder } = require('discord.js');
const { storage } = require('../../database/storage');

const animals = [
  { name: 'Tavşan', emoji: '🐰', rarity: 'common', value: 8, weight: 30 },
  { name: 'Sincap', emoji: '🐿️', rarity: 'common', value: 6, weight: 28 },
  { name: 'Ördek', emoji: '🦆', rarity: 'common', value: 12, weight: 20 },
  { name: 'Tilki', emoji: '🦊', rarity: 'uncommon', value: 30, weight: 12 },
  { name: 'Geyik', emoji: '🦌', rarity: 'rare', value: 60, weight: 6 },
  { name: 'Kurt', emoji: '🐺', rarity: 'rare', value: 80, weight: 3 },
  { name: 'Ayı', emoji: '🐻', rarity: 'epic', value: 150, weight: 0.8 },
  { name: 'Kaplan', emoji: '🐅', rarity: 'legendary', value: 300, weight: 0.2 }
];

const failEvents = [
  { text: 'Hayvan kaçtı! Bir dahaki sefere daha hızlı ol.', emoji: '💨' },
  { text: 'Silahın tutukluk yaptı!', emoji: '🔫' },
  { text: 'Ayağın dala takıldı ve hayvanı ürkütttün.', emoji: '🌿' }
];

const rarityColors = {
  common: '#808080',
  uncommon: '#00ff00',
  rare: '#0099ff',
  epic: '#9900ff',
  legendary: '#ff9900'
};

module.exports = {
  name: 'hunt',
  aliases: ['avla', 'av', 'avcilik', 'avcılık'],
  description: 'Hayvan avla ve satarak para kazan!',
  usage: '!hunt',
  
  async execute(message, args, client) {
    let userEco = await storage.getUserEconomy(message.guild.id, message.author.id);
    if (!userEco) userEco = await storage.createUserEconomy(message.guild.id, message.author.id);

    const waitEmbed = new EmbedBuilder()
      .setTitle('🏹 Avcılık')
      .setColor('#228B22')
      .setDescription('Ormanda iz sürüyorsun... 🌲')
      .setFooter({ text: message.author.username });

    const waitMsg = await message.reply({ embeds: [waitEmbed] });

    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));

    const failChance = Math.random();
    if (failChance < 0.2) {
      const fail = failEvents[Math.floor(Math.random() * failEvents.length)];
      
      const failEmbed = new EmbedBuilder()
        .setTitle('🏹 Av Başarısız!')
        .setColor('#ff0000')
        .setDescription(`${fail.emoji} ${fail.text}`)
        .setFooter({ text: `${message.author.username} • Tekrar denemek için 40 saniye bekle` });
      
      return waitMsg.edit({ embeds: [failEmbed] });
    }

    let cumulativeWeight = 0;
    const roll = Math.random() * animals.reduce((sum, a) => sum + a.weight, 0);
    let caught = animals[0];
    
    for (const animal of animals) {
      cumulativeWeight += animal.weight;
      if (roll <= cumulativeWeight) {
        caught = animal;
        break;
      }
    }

    const value = caught.value;
    await storage.updateUserBalance(message.guild.id, message.author.id, value);
    await storage.incrementUserStats(message.guild.id, message.author.id, 'animalsHunted');

    const totalHunted = (await storage.getUserStats(message.guild.id, message.author.id))?.animalsHunted || 1;

    const embed = new EmbedBuilder()
      .setTitle('🏹 Av Başarılı!')
      .setColor(rarityColors[caught.rarity] || '#228B22')
      .setDescription(`
# ${caught.emoji} ${caught.name}

Bir **${caught.rarity.toUpperCase()}** hayvan avladın!
      `)
      .addFields(
        { name: '💰 Değer', value: `+${value} coin`, inline: true },
        { name: '🎯 Toplam Av', value: `${totalHunted} hayvan`, inline: true }
      )
      .setFooter({ text: `${message.author.username} • Tekrar avlanmak için 40 saniye bekle` });

    if (caught.rarity === 'epic' || caught.rarity === 'legendary') {
      embed.addFields({ name: '🏆 Nadir Av!', value: 'Muhteşem bir hayvan avladın!', inline: false });
    }

    await waitMsg.edit({ embeds: [embed] });
  }
};
