const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const { db } = require('../../database/db');
const { userProfiles, userEconomy, userLevels } = require('../../../shared/schema');
const { eq, and } = require('drizzle-orm');

module.exports = {
  name: 'profil',
  aliases: ['profile', 'kart', 'me'],
  description: 'Kendi seviye, biyografi ve ekonomi bilgilerinizi gösteren özel profil kartınızı çizer.',
  usage: '!profil [@kullanıcı]',

  async execute(message, args, client, storage) {
    const target = message.mentions.users.first() || message.author;

    await message.channel.sendTyping();

    try {
      // 1. Fetch data
      // Level
      const levelData = await storage.getUserLevel(message.guild.id, target.id);
      const currentLevel = levelData ? levelData.level : 1;
      const currentXp = levelData ? levelData.xp : 0;

      const rank = levelData ? await storage.getUserRank(message.guild.id, target.id) : '?';

      // Economy
      let [ecoRow] = await db.select().from(userEconomy)
        .where(and(eq(userEconomy.guildId, message.guild.id), eq(userEconomy.userId, target.id)))
        .limit(1);
      const balance = ecoRow ? (ecoRow.balance || 0) : 0;

      // Profile
      let [profileRow] = await db.select().from(userProfiles)
        .where(and(eq(userProfiles.guildId, message.guild.id), eq(userProfiles.userId, target.id)))
        .limit(1);

      const title = profileRow ? profileRow.title : 'Acemi';
      const bio = profileRow ? profileRow.biography : 'Henüz bir biyografi ayarlanmamış.';

      // Canvas setup
      const canvas = createCanvas(1000, 350);
      const ctx = canvas.getContext('2d');

      // 2. Draw Background
      ctx.fillStyle = '#1e2124';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add accent arc
      ctx.beginPath();
      ctx.arc(0, 350, 600, 0, Math.PI * 2);
      ctx.fillStyle = '#282b30';
      ctx.fill();

      // 3. Draw Profile Frame
      ctx.fillStyle = '#424549';
      ctx.beginPath();
      ctx.roundRect(50, 50, 900, 250, 20);
      ctx.fill();

      // 4. Texts - UserName
      ctx.font = 'bold 50px sans-serif';
      ctx.fillStyle = '#ffffff';
      let displayName = target.username;
      if (displayName.length > 20) displayName = displayName.substring(0, 20) + '...';
      ctx.fillText(displayName, 320, 110);

      // Title
      ctx.font = 'bold 24px sans-serif';
      ctx.fillStyle = '#5865F2';
      ctx.fillText(`《 ${title} 》`, 320, 150);

      // Bio
      ctx.font = '22px sans-serif';
      ctx.fillStyle = '#b9bbbe';

      // Basic text wrapping for bio
      const wrapText = (context, text, x, y, maxWidth, lineHeight) => {
        const words = text.split(' ');
        let line = '';
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = context.measureText(testLine);
          const testWidth = metrics.width;
          if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
          } else {
            line = testLine;
          }
        }
        context.fillText(line, x, y);
      };
      wrapText(ctx, `"${bio}"`, 320, 190, 600, 28);

      // 5. Badges/Stats Bottom Row (Level, Money, Rank)
      ctx.font = 'bold 26px sans-serif';
      ctx.fillStyle = '#57F287';
      ctx.fillText(`🎁 ${balance.toLocaleString()} 💰`, 320, 275);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(`⭐ Seviye: ${currentLevel}`, 550, 275);

      ctx.fillStyle = '#FFD700'; // Gold color for rank
      ctx.fillText(`🏆 Sıra: #${rank}`, 780, 275);

      // 6. Avatar
      ctx.beginPath();
      ctx.arc(180, 175, 100, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();

      const avatarURL = target.displayAvatarURL({ extension: 'png', size: 256 });
      const avatar = await loadImage(avatarURL);
      ctx.drawImage(avatar, 80, 75, 200, 200);

      // Avatar Border Frame
      ctx.lineWidth = 12;
      ctx.strokeStyle = '#5865F2';
      ctx.stroke();

      // Generate Buffer & Send
      const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'profil-karti.png' });
      message.reply({ files: [attachment] });

    } catch (error) {
      console.error('Profile display generic error:', error);
      message.reply('❌ Profil kartı render edilirken bir sorunla karşılaşıldı!');
    }
  }
};
