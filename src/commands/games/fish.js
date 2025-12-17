const { EmbedBuilder } = require('discord.js');
const { storage } = require('../../database/storage');

const fishTypes = [
  { name: 'Hamsi', emoji: '🐟', rarity: 'common', value: 5, weight: 40 },
  { name: 'Palamut', emoji: '🐟', rarity: 'common', value: 10, weight: 30 },
  { name: 'Levrek', emoji: '🐠', rarity: 'uncommon', value: 25, weight: 15 },
  { name: 'Çipura', emoji: '🐠', rarity: 'uncommon', value: 30, weight: 10 },
  { name: 'Somon', emoji: '🐡', rarity: 'rare', value: 75, weight: 3 },
  { name: 'Orkinos', emoji: '🦈', rarity: 'epic', value: 200, weight: 1.5 },
  { name: 'Altın Balık', emoji: '✨', rarity: 'legendary', value: 500, weight: 0.4 },
  { name: 'Deniz Kızı Pulu', emoji: '🧜', rarity: 'mythic', value: 1000, weight: 0.1 }
];

const junkItems = [
  { name: 'Eski Bot', emoji: '👢', value: 1 },
  { name: 'Plastik Şişe', emoji: '🍾', value: 1 },
  { name: 'Yosun', emoji: '🌿', value: 2 },
  { name: 'Pas Teneke', emoji: '🥫', value: 1 }
];

const rarityColors = {
  common: '#808080',
  uncommon: '#00ff00',
  rare: '#0099ff',
  epic: '#9900ff',
  legendary: '#ff9900',
  mythic: '#ff00ff'
};

module.exports = {
  name: 'fish',
  aliases: ['balik', 'balık', 'olta'],
  description: 'Balık tut ve sat!',
  usage: '!fish',
  
  async execute(message, args, client) {
    let userEco = await storage.getUserEconomy(message.guild.id, message.author.id);
    if (!userEco) userEco = await storage.createUserEconomy(message.guild.id, message.author.id);

    const lastFish = userEco.lastWork ? new Date(userEco.lastWork) : null;
    const now = new Date();
    const cooldown = 30 * 1000;

    if (lastFish && (now - lastFish) < cooldown) {
      const remaining = Math.ceil((cooldown - (now - lastFish)) / 1000);
      return message.reply(`🎣 Oltanı hazırla! **${remaining}** saniye bekle.`);
    }

    const waitEmbed = new EmbedBuilder()
      .setTitle('🎣 Balık Tutma')
      .setColor('#5865F2')
      .setDescription('Oltayı suya attın... Bekleniyor...')
      .setFooter({ text: message.author.username });

    const waitMsg = await message.reply({ embeds: [waitEmbed] });

    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));

    const roll = Math.random() * 100;
    let caught = null;
    let isJunk = false;

    if (roll < 15) {
      isJunk = true;
      caught = junkItems[Math.floor(Math.random() * junkItems.length)];
    } else {
      let cumulativeWeight = 0;
      const fishRoll = Math.random() * fishTypes.reduce((sum, f) => sum + f.weight, 0);
      
      for (const fish of fishTypes) {
        cumulativeWeight += fish.weight;
        if (fishRoll <= cumulativeWeight) {
          caught = fish;
          break;
        }
      }
    }

    if (!caught) {
      caught = fishTypes[0];
    }

    const value = caught.value;
    await storage.updateUserBalance(message.guild.id, message.author.id, value);
    
    const totalFish = (await storage.getUserStats(message.guild.id, message.author.id))?.fishCaught || 0;
    await storage.incrementUserStats(message.guild.id, message.author.id, 'fishCaught');

    const embed = new EmbedBuilder()
      .setTitle(isJunk ? '🎣 Çöp Tuttun!' : '🎣 Balık Tuttun!')
      .setColor(isJunk ? '#808080' : (rarityColors[caught.rarity] || '#00ff00'))
      .setDescription(`
# ${caught.emoji} ${caught.name}

${isJunk ? 'Hmm... Bu sefer şanslı değildin.' : `**${caught.rarity.toUpperCase()}** bir balık!`}
      `)
      .addFields(
        { name: '💰 Değer', value: `+${value} coin`, inline: true },
        { name: '🐟 Toplam', value: `${totalFish + 1} balık`, inline: true }
      )
      .setFooter({ text: `${message.author.username} • Tekrar atmak için 30 saniye bekle` });

    if (caught.rarity === 'legendary' || caught.rarity === 'mythic') {
      embed.addFields({ name: '🎉 Tebrikler!', value: 'Nadir bir şey yakaladın!', inline: false });
    }

    await waitMsg.edit({ embeds: [embed] });
  }
};
