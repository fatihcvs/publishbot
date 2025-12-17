const { EmbedBuilder } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');
const fs = require('fs');
const path = require('path');

const claimedFile = path.join(__dirname, '../../data/king_claimed.json');

function isKingClaimed() {
  try {
    if (fs.existsSync(claimedFile)) {
      const data = JSON.parse(fs.readFileSync(claimedFile, 'utf8'));
      return data.claimed === true;
    }
    return false;
  } catch {
    return false;
  }
}

function claimKing(userId, username) {
  const dataDir = path.dirname(claimedFile);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(claimedFile, JSON.stringify({
    claimed: true,
    userId: userId,
    username: username,
    claimedAt: new Date().toISOString()
  }, null, 2));
}

module.exports = {
  name: 'king',
  aliases: ['kinginthenorth'],
  description: 'King in the North hayvanını al (sadece ilk kişi)',
  category: 'lethe',
  async execute(message, args, client, storage) {
    const guildData = await storage.getGuild(message.guild.id);
    if (guildData?.modules && guildData.modules.economy === false) {
      return message.reply('❌ Lethe Game bu sunucuda devre dışı.');
    }

    if (isKingClaimed()) {
      const data = JSON.parse(fs.readFileSync(claimedFile, 'utf8'));
      return message.reply(`❌ King in the North zaten **${data.username}** tarafından alındı! (${new Date(data.claimedAt).toLocaleDateString('tr-TR')})`);
    }

    try {
      const result = await letheStorage.giveAnimalToUser(message.author.id, 'king_in_the_north');
      
      if (!result.success) {
        return message.reply('❌ Bir hata oluştu.');
      }

      claimKing(message.author.id, message.author.username);

      const embed = new EmbedBuilder()
        .setColor('#ffd700')
        .setTitle('👑 KING IN THE NORTH! 👑')
        .setDescription(`**${message.author.username}** oyundaki en nadir hayvanı kazandı!`)
        .addFields(
          { name: '🐾 Hayvan', value: '👑 King in the North', inline: true },
          { name: '✨ Nadirlik', value: '👑 Ebedi', inline: true },
          { name: '📊 ID', value: `#${result.animalId}`, inline: true },
          { name: '❤️ HP', value: '1500', inline: true },
          { name: '⚔️ STR', value: '150', inline: true },
          { name: '🛡️ DEF', value: '120', inline: true },
          { name: '⚡ SPD', value: '100', inline: true }
        )
        .setFooter({ text: 'Tebrikler! Bu efsanevi hayvanın tek sahibi sensin!' })
        .setTimestamp();

      await message.reply({ embeds: [embed] });

      const announcement = new EmbedBuilder()
        .setColor('#ffd700')
        .setTitle('🎉 EFSANEVİ AN! 🎉')
        .setDescription(`**${message.author.username}** oyundaki en nadir hayvanı - **King in the North** - kazandı!\n\nBu hayvan artık kimse tarafından alınamaz. Tebrikler!`)
        .setTimestamp();

      message.channel.send({ embeds: [announcement] });

    } catch (error) {
      console.error('King command error:', error);
      return message.reply('❌ Bir hata oluştu.');
    }
  }
};
