const { EmbedBuilder } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');

module.exports = {
  name: 'profil',
  aliases: ['profile', 'letheprofil', 'oyuncu'],
  description: 'Lethe Game profilini görüntüle',
  category: 'lethe',
  async execute(message, args, client, storage) {
    const guildData = await storage.getGuild(message.guild.id);
    if (guildData?.modules && guildData.modules.economy === false) {
      return message.reply('❌ Lethe Game bu sunucuda devre dışı.');
    }
    
    const user = message.mentions.users.first() || message.author;
    
    const profile = await letheStorage.getProfile(user.id);
    const team = await letheStorage.getTeam(user.id);
    const animals = await letheStorage.getUserAnimals(user.id);

    const levelXp = profile.level * 100;
    const progress = Math.min(100, Math.round((profile.xp / levelXp) * 100));
    const progressBar = '█'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10));

    const winRate = profile.totalBattles > 0 
      ? Math.round((profile.battlesWon / profile.totalBattles) * 100) 
      : 0;

    const embed = new EmbedBuilder()
      .setColor('#8b5cf6')
      .setTitle(`🎮 ${user.username} - Lethe Game Profili`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '📊 Seviye', value: `Lv. **${profile.level}**\n${progressBar} ${progress}%\nXP: ${profile.xp}/${levelXp}`, inline: false },
        { name: '🎯 Avlanma', value: `Toplam: **${profile.totalHunts}**`, inline: true },
        { name: '⚔️ Savaş', value: `${profile.battlesWon}/${profile.totalBattles} (%${winRate})`, inline: true },
        { name: '🐉 Boss', value: `Öldürülen: **${profile.bossesKilled}**`, inline: true },
        { name: '🦁 Koleksiyon', value: `**${animals.length}** hayvan`, inline: true },
        { name: '⭐ Takım', value: `**${team.length}/3** slot dolu`, inline: true }
      )
      .setFooter({ text: 'Lethe Game - Avla, Savaş, Kazan!' })
      .setTimestamp();

    if (team.length > 0) {
      const teamStr = team.map(t => `${t.animalInfo.emoji} ${t.userAnimal.nickname || t.animalInfo.name}`).join(' | ');
      embed.addFields({ name: '🏆 Aktif Takım', value: teamStr, inline: false });
    }

    await message.reply({ embeds: [embed] });
  }
};
