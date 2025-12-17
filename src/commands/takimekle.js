const { EmbedBuilder } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');

module.exports = {
  name: 'takimekle',
  aliases: ['te', 'takımekle', 'teamadd', 'addpet'],
  description: 'Takımına hayvan ekle',
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
      return message.reply('❌ Kullanım: `!takımekle <hayvan_id>`\nHayvan ID\'lerini görmek için: `!koleksiyon`');
    }

    const result = await letheStorage.addToTeam(message.author.id, animalId);

    if (!result.success) {
      const errorMessages = {
        'Team is full (max 3)': '❌ Takımın dolu! (Maksimum 3 hayvan)',
        'Animal not found': '❌ Bu ID\'ye sahip bir hayvanın yok!',
        'Animal already in team': '❌ Bu hayvan zaten takımda!',
        'Cannot have duplicate animal types in team': '❌ Aynı türden birden fazla hayvan takımda olamaz!'
      };
      return message.reply(errorMessages[result.error] || '❌ Bir hata oluştu.');
    }

    const embed = new EmbedBuilder()
      .setColor('#10b981')
      .setTitle('✅ Hayvan Takıma Eklendi!')
      .setDescription(`Hayvan **Slot ${result.slot}**'a eklendi.`)
      .setFooter({ text: 'Takımını görmek için: !takım' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
