const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'embed',
  aliases: ['gömülü', 'gomulu'],
  description: 'Özelleştirilebilir embed mesaj oluşturur',
  permissions: [PermissionFlagsBits.ManageMessages],
  async execute(message, args, client) {
    const subCommand = args[0]?.toLowerCase();

    if (subCommand === 'basit' || subCommand === 'simple') {
      const text = args.slice(1).join(' ');
      if (!text) {
        return message.reply('Kullanım: `!embed basit <mesaj>`');
      }

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setDescription(text)
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });
      await message.delete().catch(() => {});
      return;
    }

    if (subCommand === 'gelişmiş' || subCommand === 'advanced') {
      const content = args.slice(1).join(' ');
      
      // Format: başlık | açıklama | renk
      const parts = content.split('|').map(p => p.trim());
      
      if (parts.length < 2) {
        return message.reply('Kullanım: `!embed gelişmiş başlık | açıklama | renk(opsiyonel)`\nÖrnek: `!embed gelişmiş Duyuru | Bu önemli bir duyurudur! | #ff0000`');
      }

      const embed = new EmbedBuilder()
        .setTitle(parts[0])
        .setDescription(parts[1])
        .setColor(parts[2] || '#5865F2')
        .setTimestamp()
        .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL() });

      await message.channel.send({ embeds: [embed] });
      await message.delete().catch(() => {});
      return;
    }

    if (subCommand === 'alan' || subCommand === 'field') {
      const content = args.slice(1).join(' ');
      
      // Format: başlık | açıklama | alan1:değer1 | alan2:değer2
      const parts = content.split('|').map(p => p.trim());
      
      if (parts.length < 3) {
        return message.reply('Kullanım: `!embed alan başlık | açıklama | alan1:değer1 | alan2:değer2`');
      }

      const embed = new EmbedBuilder()
        .setTitle(parts[0])
        .setDescription(parts[1])
        .setColor('#5865F2')
        .setTimestamp();

      for (let i = 2; i < parts.length; i++) {
        const [name, value] = parts[i].split(':').map(p => p.trim());
        if (name && value) {
          embed.addFields({ name, value, inline: true });
        }
      }

      await message.channel.send({ embeds: [embed] });
      await message.delete().catch(() => {});
      return;
    }

    // Yardım
    const helpEmbed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('📝 Embed Oluşturucu')
      .setDescription('Özelleştirilebilir embed mesajlar oluşturun!')
      .addFields(
        { name: '!embed basit <mesaj>', value: 'Basit bir embed oluşturur' },
        { name: '!embed gelişmiş başlık | açıklama | renk', value: 'Başlıklı embed oluşturur' },
        { name: '!embed alan başlık | açıklama | alan:değer', value: 'Alanlı embed oluşturur' }
      )
      .setTimestamp();

    message.reply({ embeds: [helpEmbed] });
  }
};
