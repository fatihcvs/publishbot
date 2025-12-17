const { EmbedBuilder } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');

module.exports = {
  name: 'takimcikar',
  aliases: ['takımçıkar', 'teamremove', 'removepet'],
  description: 'Takımından hayvan çıkar',
  category: 'lethe',
  async execute(message, args, client, storage) {
    const slot = parseInt(args[0]);

    if (!slot || slot < 1 || slot > 3) {
      return message.reply('❌ Kullanım: `!takımçıkar <slot>` (1-3 arası)');
    }

    const result = await letheStorage.removeFromTeam(message.guild.id, message.author.id, slot);

    if (!result.success) {
      return message.reply('❌ Bu slotta hayvan yok!');
    }

    const embed = new EmbedBuilder()
      .setColor('#ef4444')
      .setTitle('✅ Hayvan Takımdan Çıkarıldı!')
      .setDescription(`Slot ${slot}'daki hayvan takımdan çıkarıldı.`)
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
