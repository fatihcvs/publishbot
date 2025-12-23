const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');
const seedData = require('../lethe/seedData');

const raidTimers = new Map();

module.exports = {
  name: 'raid',
  aliases: ['rd', 'coop'],
  description: 'Co-op boss raid başlat veya katıl',
  usage: '!raid [başlat/katıl/saldır/durum]',
  category: 'lethe',
  
  async execute(message, args, client, storage) {
    const userId = message.author.id;
    const guildId = message.guild.id;
    
    if (!args[0]) {
      return this.showRaidStatus(message, guildId, client);
    }
    
    const subcommand = args[0].toLowerCase();
    
    switch(subcommand) {
      case 'başlat':
      case 'start':
        return this.startRaid(message, args.slice(1), userId, guildId, client);
      
      case 'katıl':
      case 'join':
        return this.joinRaid(message, userId, guildId);
      
      case 'saldır':
      case 'attack':
      case 'vuruş':
        return this.attackRaid(message, userId, guildId);
      
      case 'durum':
      case 'status':
        return this.showRaidStatus(message, guildId, client);
      
      case 'bosslar':
      case 'bosses':
        return this.showBosses(message);
      
      default:
        return this.showHelp(message);
    }
  },
  
  showHelp(message) {
    const embed = new EmbedBuilder()
      .setColor('#e74c3c')
      .setTitle('⚔️ Co-op Raid Sistemi')
      .setDescription('Arkadaşlarınla birlikte güçlü boss\'lara karşı savaş!')
      .addFields(
        { name: '🚀 Raid Başlat', value: '`!raid başlat <boss_adı>`\nÖrnek: `!raid başlat titan`', inline: false },
        { name: '🤝 Katıl', value: '`!raid katıl`', inline: true },
        { name: '⚔️ Saldır', value: '`!raid saldır`', inline: true },
        { name: '📊 Durum', value: '`!raid durum`', inline: true },
        { name: '🐲 Boss Listesi', value: '`!raid bosslar`', inline: true }
      )
      .addFields(
        { name: '📋 Kurallar', value: '• 3/3 takım gerekli\n• Sunucuda sadece 1 aktif raid\n• 5 kişiye kadar katılım\n• Hasara göre ödül dağılımı', inline: false }
      );
    
    return message.reply({ embeds: [embed] });
  },
  
  async showBosses(message) {
    const bosses = seedData.bosses;
    
    const embed = new EmbedBuilder()
      .setColor('#e74c3c')
      .setTitle('🐲 Raid Boss Listesi')
      .setDescription('Raid\'de savaşabileceğiniz boss\'lar:');
    
    for (const boss of bosses) {
      const rewardCoins = boss.rewardMoney || 0;
      const rewardXp = boss.rewardXp || Math.floor(rewardCoins / 10);
      embed.addFields({
        name: `${boss.emoji} ${boss.name}`,
        value: `❤️ ${boss.hp * 3} HP (Raid)\n⚔️ ${boss.str || 0} STR | 🛡️ ${boss.def || 0} DEF\n💰 ${rewardCoins * 2} | ✨ ${rewardXp * 2} XP\n\`!raid başlat ${boss.bossId}\``,
        inline: true
      });
    }
    
    embed.setFooter({ text: 'Raid ödülleri normal boss savaşlarının 2 katıdır!' });
    
    return message.reply({ embeds: [embed] });
  },
  
  async startRaid(message, args, userId, guildId, client) {
    const existing = await letheStorage.getActiveRaid(guildId);
    
    if (existing) {
      const boss = seedData.bosses.find(b => b.bossId === existing.bossId);
      return message.reply(`❌ Bu sunucuda zaten aktif bir raid var!\n**${boss?.emoji || '🐲'} ${boss?.name || 'Boss'}** - ${existing.participants?.length || 1}/${existing.maxParticipants} oyuncu\nKatılmak için: \`!raid katıl\``);
    }
    
    if (!args[0]) {
      return message.reply('❌ Boss belirtmelisiniz: `!raid başlat <boss_adı>`\nBoss listesi için: `!raid bosslar`');
    }
    
    const bossId = args[0].toLowerCase();
    
    const result = await letheStorage.createRaid(guildId, userId, bossId);
    
    if (!result.success) {
      return message.reply(`❌ ${result.error}`);
    }
    
    const raid = result.raid;
    const boss = result.boss;
    
    const embed = new EmbedBuilder()
      .setColor('#e74c3c')
      .setTitle(`⚔️ RAID BAŞLADI!`)
      .setDescription(`**${boss.emoji} ${boss.name}** raid\'i başlatıldı!\n\nKatılmak için: \`!raid katıl\``)
      .addFields(
        { name: '🎯 Boss', value: `${boss.emoji} ${boss.name}`, inline: true },
        { name: '❤️ HP', value: `${raid.bossHp}`, inline: true },
        { name: '👥 Katılımcılar', value: `1/${raid.maxParticipants}`, inline: true },
        { name: '⏰ Başlama', value: '3 dakika içinde', inline: true },
        { name: '🎁 Ödüller', value: `💰 ${(boss.rewardMoney || 0) * 2} | ✨ ${(boss.rewardXp || Math.floor((boss.rewardMoney || 0) / 10)) * 2} XP`, inline: true }
      )
      .setFooter({ text: 'Katılımcılar hasara göre ödül alır!' });
    
    await message.reply({ embeds: [embed] });
    
    const timerId = setTimeout(async () => {
      const currentRaid = await letheStorage.getActiveRaid(guildId);
      if (currentRaid && currentRaid.status === 'recruiting') {
        await letheStorage.startRaid(currentRaid.id);
        
        const startEmbed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setTitle('⚔️ RAID BAŞLADI!')
          .setDescription(`**${boss.emoji} ${boss.name}** raid\'i aktif!\n\n${currentRaid.participants?.length || 1} oyuncu katıldı.\nSaldırmak için: \`!raid saldır\``)
          .addFields(
            { name: '❤️ Boss HP', value: `${currentRaid.bossHp}`, inline: true },
            { name: '👥 Takım', value: `${currentRaid.participants?.length || 1} oyuncu`, inline: true }
          );
        
        message.channel.send({ embeds: [startEmbed] });
      }
      raidTimers.delete(guildId);
    }, 3 * 60 * 1000);
    
    raidTimers.set(guildId, timerId);
  },
  
  async joinRaid(message, userId, guildId) {
    const raid = await letheStorage.getActiveRaid(guildId);
    
    if (!raid) {
      return message.reply('❌ Bu sunucuda aktif raid yok!\nBaşlatmak için: `!raid başlat <boss_adı>`');
    }
    
    if (raid.status !== 'recruiting') {
      return message.reply('❌ Raid zaten başladı! Saldırmak için: `!raid saldır`');
    }
    
    const result = await letheStorage.joinRaid(raid.id, userId);
    
    if (!result.success) {
      return message.reply(`❌ ${result.error}`);
    }
    
    const boss = seedData.bosses.find(b => b.bossId === raid.bossId);
    
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('🤝 Raid\'e Katıldınız!')
      .setDescription(`**${boss?.emoji || '🐲'} ${boss?.name || 'Boss'}** raid\'ine katıldınız!`)
      .addFields(
        { name: '👥 Katılımcılar', value: `${result.participantCount}/${raid.maxParticipants}`, inline: true }
      )
      .setFooter({ text: 'Raid başladığında saldırmayı unutmayın!' });
    
    return message.reply({ embeds: [embed] });
  },
  
  async attackRaid(message, userId, guildId) {
    const raid = await letheStorage.getActiveRaid(guildId);
    
    if (!raid) {
      return message.reply('❌ Bu sunucuda aktif raid yok!');
    }
    
    if (raid.status === 'recruiting') {
      return message.reply('❌ Raid henüz başlamadı! Bekleyin veya daha fazla oyuncu katılsın.');
    }
    
    const result = await letheStorage.attackRaid(raid.id, userId);
    
    if (!result.success) {
      return message.reply(`❌ ${result.error}`);
    }
    
    const boss = seedData.bosses.find(b => b.bossId === raid.bossId);
    
    if (result.completed) {
      const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('🎉 RAID TAMAMLANDI!')
        .setDescription(`**${boss?.emoji || '🐲'} ${boss?.name || 'Boss'}** yenildi!`)
        .addFields(
          { name: '⚔️ Son Vuruş', value: `${message.author} - ${result.damage} hasar`, inline: false }
        );
      
      let rewardText = '';
      for (const p of result.participants) {
        rewardText += `<@${p.userId}>: ${p.damage} hasar → 💰 ${p.reward?.coins || 0}\n`;
      }
      embed.addFields({ name: '🎁 Ödüller', value: rewardText || 'Hesaplanıyor...' });
      
      return message.reply({ embeds: [embed] });
    }
    
    const damageText = result.damageBreakdown.map(d => 
      `${d.name}: ${d.damage}${d.isCrit ? ' 💥' : ''}`
    ).join('\n');
    
    const hpPercent = Math.round((result.remainingHp / result.bossHp) * 100);
    const hpBar = '█'.repeat(Math.floor(hpPercent / 10)) + '░'.repeat(10 - Math.floor(hpPercent / 10));
    
    const embed = new EmbedBuilder()
      .setColor('#e74c3c')
      .setTitle(`⚔️ ${message.author.username} saldırdı!`)
      .setDescription(`**${boss?.emoji || '🐲'} ${boss?.name || 'Boss'}**\n\n${hpBar} ${result.remainingHp}/${result.bossHp} HP`)
      .addFields(
        { name: '💥 Toplam Hasar', value: `${result.damage}`, inline: true },
        { name: '🐾 Takım Hasarı', value: damageText, inline: true }
      )
      .setFooter({ text: 'Saldırmaya devam edin: !raid saldır' });
    
    return message.reply({ embeds: [embed] });
  },
  
  async showRaidStatus(message, guildId, client) {
    const raid = await letheStorage.getActiveRaid(guildId);
    
    if (!raid) {
      const embed = new EmbedBuilder()
        .setColor('#95a5a6')
        .setTitle('📊 Raid Durumu')
        .setDescription('Bu sunucuda aktif raid yok.\n\nBaşlatmak için: `!raid başlat <boss_adı>`\nBoss listesi: `!raid bosslar`');
      
      return message.reply({ embeds: [embed] });
    }
    
    const boss = seedData.bosses.find(b => b.bossId === raid.bossId);
    const hpPercent = Math.round((raid.currentHp / raid.bossHp) * 100);
    const hpBar = '█'.repeat(Math.floor(hpPercent / 10)) + '░'.repeat(10 - Math.floor(hpPercent / 10));
    
    const embed = new EmbedBuilder()
      .setColor(raid.status === 'recruiting' ? '#3498db' : '#e74c3c')
      .setTitle(`${raid.status === 'recruiting' ? '🔔 Katılım Açık' : '⚔️ Raid Aktif'}`)
      .setDescription(`**${boss?.emoji || '🐲'} ${boss?.name || 'Boss'}**`)
      .addFields(
        { name: '❤️ HP', value: `${hpBar}\n${raid.currentHp}/${raid.bossHp}`, inline: false },
        { name: '👥 Katılımcılar', value: `${raid.participants?.length || 0}/${raid.maxParticipants}`, inline: true },
        { name: '📊 Durum', value: raid.status === 'recruiting' ? 'Katılım açık' : 'Savaş devam ediyor', inline: true }
      );
    
    if (raid.participants && raid.participants.length > 0) {
      let participantText = '';
      for (const p of raid.participants.slice(0, 5)) {
        try {
          const user = await client.users.fetch(p.userId).catch(() => null);
          participantText += `${user?.username || 'Oyuncu'}: ${p.damage || 0} hasar\n`;
        } catch (e) {
          participantText += `Oyuncu: ${p.damage || 0} hasar\n`;
        }
      }
      embed.addFields({ name: '🏆 Hasar Tablosu', value: participantText || 'Henüz hasar yok' });
    }
    
    if (raid.status === 'recruiting') {
      embed.setFooter({ text: 'Katılmak için: !raid katıl' });
    } else {
      embed.setFooter({ text: 'Saldırmak için: !raid saldır' });
    }
    
    return message.reply({ embeds: [embed] });
  }
};
