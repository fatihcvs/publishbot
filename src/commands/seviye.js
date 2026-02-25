const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');

module.exports = {
  name: 'seviye',
  aliases: ['level', 'rank', 'xp'],
  description: 'Seviye ve XP bilgini gösterir',
  async execute(message, args, client) {
    const target = message.mentions.users.first() || message.author;
    const storage = client.storage;

    try {
      const userData = await storage.getUserLevel(message.guild.id, target.id);

      if (!userData) {
        return message.reply(`${target.id === message.author.id ? 'Henüz' : `${target.username} henüz`} hiç XP kazanmamış!`);
      }

      const rank = await storage.getUserRank(message.guild.id, target.id);
      const currentLevelXp = storage.getXpForLevel(userData.level);
      const nextLevelXp = storage.getXpForLevel(userData.level + 1);
      const xpInCurrentLevel = userData.xp - currentLevelXp;
      const xpNeeded = nextLevelXp - currentLevelXp;

      // Send a typing indicator because image generation might take a moment
      await message.channel.sendTyping();

      // Create Canvas
      const canvas = createCanvas(934, 282);
      const ctx = canvas.getContext('2d');

      // 1. Background
      // Using a solid modern dark color, could be replaced with an image
      ctx.fillStyle = '#1e2124';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add a subtle accent color/shape
      ctx.fillStyle = '#282b30';
      ctx.beginPath();
      ctx.arc(0, 0, 400, 0, Math.PI * 2);
      ctx.fill();

      // 2. XP Progress Bar (Background)
      ctx.fillStyle = '#424549';
      ctx.beginPath();
      ctx.roundRect(280, 180, 600, 35, 17.5);
      ctx.fill();

      // 3. XP Progress Bar (Foreground)
      const progressWidth = Math.min((xpInCurrentLevel / xpNeeded) * 600, 600);
      ctx.fillStyle = '#5865F2'; // Discord Blurple / Accent
      ctx.beginPath();
      ctx.roundRect(280, 180, progressWidth > 17.5 ? progressWidth : 17.5, 35, 17.5);
      ctx.fill();

      // 4. Texts
      ctx.fillStyle = '#ffffff';

      // Username
      ctx.font = 'bold 45px sans-serif';
      let displayName = target.username;
      if (displayName.length > 15) displayName = displayName.substring(0, 15) + '...';
      ctx.fillText(displayName, 280, 150);

      // Level
      ctx.fillStyle = '#5865F2';
      ctx.font = 'bold 50px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`SEVİYE ${userData.level}`, 880, 90);

      // Rank
      ctx.fillStyle = '#aaaaaa';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText(`Sıra #${rank || '?'}`, 880, 140);

      // XP Text
      ctx.textAlign = 'right';
      ctx.font = 'bold 25px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${xpInCurrentLevel.toLocaleString()} / ${xpNeeded.toLocaleString()} XP`, 880, 170);

      // Total Messages Stat (Optional/Extra)
      ctx.textAlign = 'left';
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '22px sans-serif';
      ctx.fillText(`Toplam Mesaj: ${userData.totalMessages?.toLocaleString() || 0}`, 280, 250);
      ctx.fillText(`Toplam XP: ${userData.xp.toLocaleString()}`, 520, 250);

      // 5. Avatar Shape (Circle clipping)
      ctx.beginPath();
      ctx.arc(141, 141, 100, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();

      // Avatar Image
      const avatarURL = target.displayAvatarURL({ extension: 'png', size: 256 });
      const avatar = await loadImage(avatarURL);
      ctx.drawImage(avatar, 41, 41, 200, 200);

      // Stroke around avatar
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#5865F2';
      ctx.stroke();

      // Generate the image buffer
      const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'seviye-karti.png' });

      message.reply({ files: [attachment] });
    } catch (error) {
      console.error('Level command error:', error);
      message.reply('Seviye kartı oluşturulurken bir hata oluştu!');
    }
  }
};
