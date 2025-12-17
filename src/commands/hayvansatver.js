const { EmbedBuilder } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');

module.exports = {
  name: 'hayvansatver',
  aliases: ['hayvansat', 'animalsell', 'sathayvan'],
  description: 'Bir hayvanı sat',
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
    
    const animalId = parseInt(args[0]);

    if (!animalId) {
      return message.reply('❌ Kullanım: `!hayvansatver <hayvan_id>`\nHayvan ID\'lerini görmek için: `!koleksiyon`');
    }

    const result = await letheStorage.sellAnimal(message.author.id, animalId);

    if (!result.success) {
      const errorMessages = {
        'Animal not found': '❌ Bu ID\'ye sahip bir hayvanın yok!',
        'Cannot sell animal in team': '❌ Takımdaki hayvanları satamazsın! Önce takımdan çıkar.'
      };
      return message.reply(errorMessages[result.error] || '❌ Bir hata oluştu.');
    }

    const embed = new EmbedBuilder()
      .setColor('#f59e0b')
      .setTitle('💰 Hayvan Satıldı!')
      .setDescription(`${result.animal.emoji} **${result.animal.name}** satıldı!`)
      .addFields(
        { name: 'Kazanılan', value: `💰 ${result.price}`, inline: true }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
