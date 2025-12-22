const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');

module.exports = {
  name: 'siralama',
  aliases: ['sıralama', 'leaderboard', 'lb', 'top', 'lider'],
  description: 'Lethe Game global sıralamalarını görüntüle',
  usage: '!siralama [kategori]',
  category: 'lethe',
  
  async execute(message, args, client, storage) {
    const userId = message.author.id;
    const category = args[0]?.toLowerCase() || 'coins';
    
    const categories = {
      'coins': { name: 'Altın', emoji: '💰', dbKey: 'coins' },
      'para': { name: 'Altın', emoji: '💰', dbKey: 'coins' },
      'altın': { name: 'Altın', emoji: '💰', dbKey: 'coins' },
      'level': { name: 'Seviye', emoji: '⭐', dbKey: 'level' },
      'seviye': { name: 'Seviye', emoji: '⭐', dbKey: 'level' },
      'lv': { name: 'Seviye', emoji: '⭐', dbKey: 'level' },
      'hunts': { name: 'Av Sayısı', emoji: '🎯', dbKey: 'hunts' },
      'av': { name: 'Av Sayısı', emoji: '🎯', dbKey: 'hunts' },
      'battles': { name: 'Savaş Zaferleri', emoji: '⚔️', dbKey: 'battles' },
      'savaş': { name: 'Savaş Zaferleri', emoji: '⚔️', dbKey: 'battles' },
      'pvp': { name: 'PvP Zaferleri', emoji: '🏆', dbKey: 'pvp' },
      'düello': { name: 'PvP Zaferleri', emoji: '🏆', dbKey: 'pvp' },
      'animals': { name: 'Hayvan Sayısı', emoji: '🐾', dbKey: 'animals' },
      'hayvan': { name: 'Hayvan Sayısı', emoji: '🐾', dbKey: 'animals' },
      'koleksiyon': { name: 'Hayvan Sayısı', emoji: '🐾', dbKey: 'animals' },
      'xp': { name: 'Sunucu XP', emoji: '✨', dbKey: 'server_xp' }
    };
    
    if (category === 'yardım' || category === 'help') {
      return this.showHelp(message);
    }
    
    if (category === 'xp' || category === 'sunucu') {
      return this.showServerLeaderboard(message, client, storage);
    }
    
    const categoryInfo = categories[category];
    if (!categoryInfo) {
      return this.showHelp(message);
    }
    
    const leaderboard = await letheStorage.getLeaderboard(categoryInfo.dbKey, 10);
    const userRank = await letheStorage.getUserRank(userId, categoryInfo.dbKey);
    
    const embed = new EmbedBuilder()
      .setColor('#f1c40f')
      .setTitle(`${categoryInfo.emoji} ${categoryInfo.name} Sıralaması`)
      .setDescription('🌍 Global lider tablosu - Tüm sunuculardan oyuncular');
    
    if (leaderboard.length === 0) {
      embed.addFields({ name: 'Sıralama', value: 'Henüz veri yok!' });
    } else {
      let leaderboardText = '';
      const medals = ['🥇', '🥈', '🥉'];
      
      for (let i = 0; i < leaderboard.length; i++) {
        const entry = leaderboard[i];
        const medal = medals[i] || `**${i + 1}.**`;
        
        try {
          const user = await client.users.fetch(entry.userId).catch(() => null);
          const username = user ? user.username : `Oyuncu ${entry.userId.slice(-4)}`;
          const isYou = entry.userId === userId ? ' ⬅️' : '';
          
          leaderboardText += `${medal} **${username}** - ${this.formatValue(entry.value, categoryInfo.dbKey)}${isYou}\n`;
        } catch (e) {
          leaderboardText += `${medal} Oyuncu - ${this.formatValue(entry.value, categoryInfo.dbKey)}\n`;
        }
      }
      
      embed.addFields({ name: 'Top 10', value: leaderboardText });
    }
    
    const inTop10 = leaderboard.some(e => e.userId === userId);
    if (!inTop10 && userRank.rank > 0) {
      embed.addFields({
        name: '📍 Senin Sıran',
        value: `**#${userRank.rank}** - ${this.formatValue(userRank.value, categoryInfo.dbKey)}`,
        inline: false
      });
    }
    
    const categoryButtons = [
      { id: 'coins', label: '💰', style: ButtonStyle.Secondary },
      { id: 'level', label: '⭐', style: ButtonStyle.Secondary },
      { id: 'hunts', label: '🎯', style: ButtonStyle.Secondary },
      { id: 'battles', label: '⚔️', style: ButtonStyle.Secondary },
      { id: 'pvp', label: '🏆', style: ButtonStyle.Secondary }
    ];
    
    const row = new ActionRowBuilder();
    for (const btn of categoryButtons) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`lb_${btn.id}_${message.author.id}`)
          .setLabel(btn.label)
          .setStyle(categoryInfo.dbKey === btn.id ? ButtonStyle.Primary : btn.style)
      );
    }
    
    const reply = await message.reply({ embeds: [embed], components: [row] });
    
    const collector = reply.createMessageComponentCollector({
      filter: i => i.customId.startsWith('lb_') && i.customId.endsWith(message.author.id),
      time: 60000
    });
    
    collector.on('collect', async (interaction) => {
      const [, newCategory, authorId] = interaction.customId.split('_');
      
      if (authorId !== interaction.user.id) {
        return interaction.reply({ content: 'Bu butonlar sana ait değil!', ephemeral: true });
      }
      
      const newCategoryInfo = categories[newCategory];
      const newLeaderboard = await letheStorage.getLeaderboard(newCategoryInfo.dbKey, 10);
      const newUserRank = await letheStorage.getUserRank(interaction.user.id, newCategoryInfo.dbKey);
      
      const newEmbed = new EmbedBuilder()
        .setColor('#f1c40f')
        .setTitle(`${newCategoryInfo.emoji} ${newCategoryInfo.name} Sıralaması`)
        .setDescription('🌍 Global lider tablosu - Tüm sunuculardan oyuncular');
      
      if (newLeaderboard.length === 0) {
        newEmbed.addFields({ name: 'Sıralama', value: 'Henüz veri yok!' });
      } else {
        let leaderboardText = '';
        const medals = ['🥇', '🥈', '🥉'];
        
        for (let i = 0; i < newLeaderboard.length; i++) {
          const entry = newLeaderboard[i];
          const medal = medals[i] || `**${i + 1}.**`;
          
          try {
            const user = await client.users.fetch(entry.userId).catch(() => null);
            const username = user ? user.username : `Oyuncu ${entry.userId.slice(-4)}`;
            const isYou = entry.userId === interaction.user.id ? ' ⬅️' : '';
            
            leaderboardText += `${medal} **${username}** - ${this.formatValue(entry.value, newCategoryInfo.dbKey)}${isYou}\n`;
          } catch (e) {
            leaderboardText += `${medal} Oyuncu - ${this.formatValue(entry.value, newCategoryInfo.dbKey)}\n`;
          }
        }
        
        newEmbed.addFields({ name: 'Top 10', value: leaderboardText });
      }
      
      const inTop10 = newLeaderboard.some(e => e.userId === interaction.user.id);
      if (!inTop10 && newUserRank.rank > 0) {
        newEmbed.addFields({
          name: '📍 Senin Sıran',
          value: `**#${newUserRank.rank}** - ${this.formatValue(newUserRank.value, newCategoryInfo.dbKey)}`,
          inline: false
        });
      }
      
      const newRow = new ActionRowBuilder();
      for (const btn of categoryButtons) {
        newRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`lb_${btn.id}_${interaction.user.id}`)
            .setLabel(btn.label)
            .setStyle(newCategoryInfo.dbKey === btn.id ? ButtonStyle.Primary : btn.style)
        );
      }
      
      await interaction.update({ embeds: [newEmbed], components: [newRow] });
    });
    
    collector.on('end', () => {
      const disabledRow = new ActionRowBuilder();
      for (const btn of categoryButtons) {
        disabledRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`lb_${btn.id}_disabled`)
            .setLabel(btn.label)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        );
      }
      reply.edit({ components: [disabledRow] }).catch(() => {});
    });
  },
  
  async showServerLeaderboard(message, client, storage) {
    const limit = 10;
    
    try {
      const leaderboard = await storage.getLeaderboard(message.guild.id, limit);

      if (!leaderboard || leaderboard.length === 0) {
        return message.reply('Henüz sıralamada kimse yok! Mesaj yazarak XP kazanmaya başlayın.');
      }

      const medals = ['🥇', '🥈', '🥉'];
      let description = '';

      for (let i = 0; i < leaderboard.length; i++) {
        const user = leaderboard[i];
        const member = await message.guild.members.fetch(user.userId).catch(() => null);
        const username = member ? member.user.username : 'Bilinmeyen Kullanıcı';
        const medal = medals[i] || `**${i + 1}.**`;

        description += `${medal} ${username}\n`;
        description += `   ⭐ Seviye ${user.level} • ✨ ${user.xp.toLocaleString()} XP\n\n`;
      }

      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle(`🏆 ${message.guild.name} Sunucu Sıralaması`)
        .setDescription(description)
        .setThumbnail(message.guild.iconURL({ dynamic: true }))
        .setFooter({ text: `Top ${leaderboard.length} üye | Lethe Game sıralaması için: !siralama coins` })
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Leaderboard command error:', error);
      message.reply('Sıralama alınırken bir hata oluştu!');
    }
  },
  
  formatValue(value, category) {
    switch(category) {
      case 'coins': return `${value?.toLocaleString() || 0}💰`;
      case 'level': return `Lv.${value || 1}`;
      case 'hunts': return `${value?.toLocaleString() || 0} av`;
      case 'battles': return `${value?.toLocaleString() || 0} zafer`;
      case 'pvp': return `${value?.toLocaleString() || 0} zafer`;
      case 'animals': return `${value?.toLocaleString() || 0} hayvan`;
      default: return value?.toString() || '0';
    }
  },
  
  showHelp(message) {
    const embed = new EmbedBuilder()
      .setColor('#f1c40f')
      .setTitle('🏆 Sıralama Kategorileri')
      .setDescription('Lethe Game global sıralamalarını görüntüle!')
      .addFields(
        { name: '💰 Altın', value: '`!siralama coins`', inline: true },
        { name: '⭐ Seviye', value: '`!siralama level`', inline: true },
        { name: '🎯 Av Sayısı', value: '`!siralama hunts`', inline: true },
        { name: '⚔️ Savaş', value: '`!siralama battles`', inline: true },
        { name: '🏆 PvP', value: '`!siralama pvp`', inline: true },
        { name: '🐾 Hayvan', value: '`!siralama animals`', inline: true },
        { name: '✨ Sunucu XP', value: '`!siralama xp`', inline: true }
      )
      .setFooter({ text: 'Kısa komutlar: !lb, !top, !lider' });
    
    return message.reply({ embeds: [embed] });
  }
};
