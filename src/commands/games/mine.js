const { EmbedBuilder } = require('discord.js');
const { storage } = require('../../database/storage');

const ores = [
  { name: 'Kömür', emoji: '�ite', rarity: 'common', value: 5, weight: 35 },
  { name: 'Demir', emoji: '🔩', rarity: 'common', value: 10, weight: 25 },
  { name: 'Bakır', emoji: '🟤', rarity: 'uncommon', value: 20, weight: 18 },
  { name: 'Gümüş', emoji: '⚪', rarity: 'uncommon', value: 35, weight: 12 },
  { name: 'Altın', emoji: '🟡', rarity: 'rare', value: 75, weight: 6 },
  { name: 'Zümrüt', emoji: '💚', rarity: 'epic', value: 150, weight: 2.5 },
  { name: 'Elmas', emoji: '💎', rarity: 'legendary', value: 400, weight: 1 },
  { name: 'Yakut', emoji: '❤️', rarity: 'mythic', value: 800, weight: 0.5 }
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
  name: 'mine',
  aliases: ['maden', 'kaz', 'madencilik'],
  description: 'Maden kaz ve değerli taşlar bul!',
  usage: '!mine',
  
  async execute(message, args, client) {
    let userEco = await storage.getUserEconomy(message.guild.id, message.author.id);
    if (!userEco) userEco = await storage.createUserEconomy(message.guild.id, message.author.id);

    const stats = await storage.getUserStats(message.guild.id, message.author.id);
    const lastMine = stats?.createdAt ? new Date(stats.createdAt) : null;
    const now = new Date();
    const cooldown = 45 * 1000;

    const waitEmbed = new EmbedBuilder()
      .setTitle('⛏️ Madencilik')
      .setColor('#8B4513')
      .setDescription('Kazma sallanıyor... ⛏️')
      .setFooter({ text: message.author.username });

    const waitMsg = await message.reply({ embeds: [waitEmbed] });

    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));

    const numOres = Math.random() < 0.3 ? 2 : 1;
    const foundOres = [];
    let totalValue = 0;

    for (let i = 0; i < numOres; i++) {
      let cumulativeWeight = 0;
      const roll = Math.random() * ores.reduce((sum, o) => sum + o.weight, 0);
      
      for (const ore of ores) {
        cumulativeWeight += ore.weight;
        if (roll <= cumulativeWeight) {
          foundOres.push(ore);
          totalValue += ore.value;
          break;
        }
      }
    }

    if (foundOres.length === 0) {
      foundOres.push(ores[0]);
      totalValue = ores[0].value;
    }

    await storage.updateUserBalance(message.guild.id, message.author.id, totalValue);
    await storage.incrementUserStats(message.guild.id, message.author.id, 'oresMined', foundOres.length);

    const bestOre = foundOres.reduce((best, ore) => ore.value > best.value ? ore : best, foundOres[0]);

    const oreList = foundOres.map(o => `${o.emoji} **${o.name}** (${o.value} coin)`).join('\n');

    const embed = new EmbedBuilder()
      .setTitle('⛏️ Maden Kazıldı!')
      .setColor(rarityColors[bestOre.rarity] || '#808080')
      .setDescription(`
Kazma darbeleriyle değerli madenler buldun!

${oreList}
      `)
      .addFields(
        { name: '💰 Toplam', value: `+${totalValue} coin`, inline: true },
        { name: '⛏️ Bulunan', value: `${foundOres.length} maden`, inline: true }
      )
      .setFooter({ text: `${message.author.username} • Tekrar kazmak için 45 saniye bekle` });

    if (bestOre.rarity === 'legendary' || bestOre.rarity === 'mythic') {
      embed.addFields({ name: '💎 Nadir Buluntu!', value: 'Muhteşem bir maden buldun!', inline: false });
    }

    await waitMsg.edit({ embeds: [embed] });
  }
};
