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

const effectNames = {
  'hunt_bonus': 'Avlanma',
  'str_boost': 'STR',
  'def_boost': 'DEF',
  'spd_boost': 'SPD',
  'hp_boost': 'HP',
  'magic_boost': 'Büyü',
  'all_stats': 'Tüm Stat',
  'crit_boost': 'Kritik',
  'dodge_boost': 'Kaçınma',
  'xp_boost': 'XP',
  'coin_boost': 'Para'
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
      let teamDescription = '';
      
      for (const t of team) {
        const info = t.animalInfo;
        const user = t.userAnimal;
        const rarityEmoji = rarityEmojis[info.rarity] || '⬜';
        const nickname = user.nickname ? `"${user.nickname}"` : info.name;
        
        const equipment = await letheStorage.getAnimalEquipmentDetails(user);
        
        let equipStr = '';
        let bonusStr = '';
        let totalBonusDamage = 0;
        let totalBonusDefense = 0;
        
        if (equipment.weaponInfo) {
          equipStr += `⚔️ ${equipment.weaponInfo.emoji} ${equipment.weaponInfo.name}`;
          totalBonusDamage += equipment.weaponInfo.damage || 0;
          bonusStr += `+${equipment.weaponInfo.damage} DMG `;
        }
        if (equipment.armorInfo) {
          equipStr += equipStr ? ' | ' : '';
          equipStr += `🛡️ ${equipment.armorInfo.emoji} ${equipment.armorInfo.name}`;
          totalBonusDefense += equipment.armorInfo.defense || 0;
          bonusStr += `+${equipment.armorInfo.defense} DEF `;
        }
        if (equipment.accessoryInfo) {
          equipStr += equipStr ? ' | ' : '';
          const accEffect = effectNames[equipment.accessoryInfo.effect] || equipment.accessoryInfo.effect;
          const accValue = equipment.accessoryInfo.effectValue || 0;
          equipStr += `💍 ${equipment.accessoryInfo.emoji} ${equipment.accessoryInfo.name} (+${accValue} ${accEffect})`;
        }
        
        const effectiveStr = user.str + totalBonusDamage;
        const effectiveDef = user.def + totalBonusDefense;
        
        teamDescription += `**Slot ${user.teamSlot}:** ${info.emoji} ${nickname} ${rarityEmoji} \`ID:${user.id}\`\n`;
        teamDescription += `┣ Lv.${user.level} | ❤️ ${user.hp} | ⚔️ ${user.str}`;
        if (totalBonusDamage > 0) teamDescription += ` (+${totalBonusDamage})`;
        teamDescription += ` | 🛡️ ${user.def}`;
        if (totalBonusDefense > 0) teamDescription += ` (+${totalBonusDefense})`;
        teamDescription += ` | ⚡ ${user.spd}\n`;
        
        if (equipStr) {
          teamDescription += `┗ **Ekipman:** ${equipStr}\n`;
        } else {
          teamDescription += `┗ *Ekipman yok* - \`!kuşan ${user.id} <kategori> <eşya>\`\n`;
        }
        
        teamDescription += '\n';
      }

      embed.setDescription(teamDescription);

      const totalHp = team.reduce((sum, t) => sum + t.userAnimal.hp, 0);
      const totalStr = team.reduce((sum, t) => sum + t.userAnimal.str, 0);
      const totalDef = team.reduce((sum, t) => sum + t.userAnimal.def, 0);
      const avgSpd = Math.round(team.reduce((sum, t) => sum + t.userAnimal.spd, 0) / team.length);

      embed.addFields(
        { name: '📊 Takım İstatistikleri', value: `❤️ ${totalHp} | ⚔️ ${totalStr} | 🛡️ ${totalDef} | ⚡ ${avgSpd}`, inline: false }
      );
    }

    embed.setFooter({ text: `${team.length}/3 slot dolu | !kuşan <hayvan_id> <kategori> <eşya_id>` });

    await message.reply({ embeds: [embed] });
  }
};
