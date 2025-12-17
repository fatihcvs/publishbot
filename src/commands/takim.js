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
  name: 'takim',
  aliases: ['takım', 'team', 'petler', 'pets'],
  description: 'Savaş takımını görüntüle',
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
    
    const team = await letheStorage.getTeam(message.author.id);

    const embed = new EmbedBuilder()
      .setColor('#8b5cf6')
      .setTitle(`⚔️ ${message.author.username} - Savaş Takımı`)
      .setTimestamp();

    if (team.length === 0) {
      embed.setDescription('Takımın boş! `!takımekle <hayvan_id>` ile hayvan ekle.');
    } else {
      const teamDescription = team.map(t => {
        const info = t.animalInfo;
        const user = t.userAnimal;
        const rarityEmoji = rarityEmojis[info.rarity] || '⬜';
        const nickname = user.nickname ? `"${user.nickname}"` : info.name;
        
        return `**Slot ${user.teamSlot}:** ${info.emoji} ${nickname} ${rarityEmoji}\n` +
               `Lv.${user.level} | ❤️ ${user.hp} | ⚔️ ${user.str} | 🛡️ ${user.def} | ⚡ ${user.spd}`;
      }).join('\n\n');

      embed.setDescription(teamDescription);

      const totalHp = team.reduce((sum, t) => sum + t.userAnimal.hp, 0);
      const totalStr = team.reduce((sum, t) => sum + t.userAnimal.str, 0);
      const totalDef = team.reduce((sum, t) => sum + t.userAnimal.def, 0);
      const avgSpd = Math.round(team.reduce((sum, t) => sum + t.userAnimal.spd, 0) / team.length);

      embed.addFields(
        { name: '📊 Takım İstatistikleri', value: `❤️ ${totalHp} | ⚔️ ${totalStr} | 🛡️ ${totalDef} | ⚡ ${avgSpd}`, inline: false }
      );
    }

    embed.setFooter({ text: `${team.length}/3 slot dolu` });

    await message.reply({ embeds: [embed] });
  }
};
