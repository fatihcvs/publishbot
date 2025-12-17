const { EmbedBuilder } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');

const rarityColors = {
  common: '#9ca3af',
  uncommon: '#10b981',
  rare: '#3b82f6',
  epic: '#8b5cf6',
  legendary: '#f59e0b',
  mythic: '#f97316',
  hidden: '#ef4444',
  eternal: '#ffd700'
};

const rarityNames = {
  common: '⬜ Yaygın',
  uncommon: '🟩 Sıradışı',
  rare: '🟦 Nadir',
  epic: '🟪 Epik',
  legendary: '🟨 Efsanevi',
  mythic: '🟧 Mitik',
  hidden: '❓ Gizli',
  eternal: '👑 Ebedi'
};

module.exports = {
  name: 'avla',
  aliases: ['a', 'av', 'hunt', 'yakala'],
  description: 'Hayvan avla ve koleksiyonuna ekle',
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
    
    const result = await letheStorage.huntAnimal(message.author.id);

    if (!result.success) {
      if (result.cooldown) {
        return message.reply(`⏳ Çok hızlı avlanıyorsun! **${result.cooldown} saniye** bekle.`);
      }
      return message.reply('❌ Avlanma sırasında bir hata oluştu.');
    }

    const animal = result.animal;
    const rarityColor = rarityColors[animal.rarity] || '#9ca3af';
    const rarityName = rarityNames[animal.rarity] || animal.rarity;

    // Update quest progress
    const completedQuests = await letheStorage.updateQuestProgress(message.author.id, 'hunt', 1);
    
    // Check for rare+ catch
    const rareRarities = ['rare', 'epic', 'legendary', 'mythic', 'hidden', 'eternal'];
    if (rareRarities.includes(animal.rarity)) {
      await letheStorage.updateQuestProgress(message.author.id, 'rare_catch', 1);
    }
    
    // Check for epic+ catch
    const epicRarities = ['epic', 'legendary', 'mythic', 'hidden', 'eternal'];
    if (epicRarities.includes(animal.rarity)) {
      await letheStorage.updateQuestProgress(message.author.id, 'epic_catch', 1);
    }
    
    // Update unique catch progress
    await letheStorage.updateQuestProgress(message.author.id, 'unique_catch', 1);

    // Gem drop chance based on rarity
    const gemDropChances = {
      common: 0.05,      // 5%
      uncommon: 0.08,    // 8%
      rare: 0.12,        // 12%
      epic: 0.18,        // 18%
      legendary: 0.25,   // 25%
      mythic: 0.35,      // 35%
      hidden: 0.50,      // 50%
      eternal: 1.00      // 100%
    };
    
    const gemEmojis = {
      common: '⬜', uncommon: '🟩', rare: '🟦', epic: '🟪', legendary: '🟨', mythic: '🟧', hidden: '❓', eternal: '👑'
    };
    
    let gemDropped = null;
    const dropChance = gemDropChances[animal.rarity] || 0.05;
    if (Math.random() < dropChance) {
      gemDropped = animal.rarity;
      await letheStorage.addGems(message.author.id, animal.rarity, 1);
    }

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

    // Show gem drop
    if (gemDropped) {
      embed.addFields({ 
        name: '💎 Evrim Taşı Düştü!', 
        value: `${gemEmojis[gemDropped]} +1 ${gemDropped} taşı kazandın!`, 
        inline: false 
      });
    }

    await message.reply({ embeds: [embed] });
    
    // Send separate detailed quest completion messages
    if (completedQuests.length > 0) {
      for (const q of completedQuests) {
        const qi = q.questInfo;
        let rewardLines = [];
        if (q.rewards?.coins > 0) rewardLines.push(`💰 **${q.rewards.coins.toLocaleString()}** Para`);
        if (q.rewards?.xp > 0) rewardLines.push(`✨ **${q.rewards.xp}** XP`);
        if (q.rewards?.item) {
          const itemName = q.rewards.item.id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          rewardLines.push(`🎁 **${q.rewards.item.quantity}x** ${itemName}`);
        }
        
        const questEmbed = new EmbedBuilder()
          .setColor('#10B981')
          .setTitle(`🎯 Görev Tamamlandı!`)
          .setDescription(`<@${message.author.id}> **${qi.emoji} ${qi.name}** görevini tamamladı!`)
          .addFields(
            { name: '📋 Görev', value: qi.description, inline: false },
            { name: '🎁 Kazanılan Ödüller', value: rewardLines.join('\n') || 'Ödül yok', inline: false }
          )
          .setThumbnail(message.author.displayAvatarURL())
          .setFooter({ text: `Görevlerini görmek için: !görev` })
          .setTimestamp();
        
        await message.channel.send({ embeds: [questEmbed] });
      }
    }
  }
};
