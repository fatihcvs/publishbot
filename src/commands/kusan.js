const { EmbedBuilder } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');

module.exports = {
  name: 'kusan',
  aliases: ['kuşan', 'equip', 'giy'],
  description: 'Hayvanına eşya kuşan',
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
    
    const animalId = args[0];
    const itemType = args[1]?.toLowerCase();
    const itemId = args[2];

    if (!animalId || !itemType || !itemId) {
      const embed = new EmbedBuilder()
        .setColor('#ff6b6b')
        .setTitle('⚔️ Eşya Kuşanma')
        .setDescription('**Kullanım:** `!kuşan <hayvan_id> <kategori> <eşya_id>`')
        .addFields(
          { name: '📋 Kategoriler', value: '`weapon` (silah), `armor` (zırh), `accessory` (aksesuar)', inline: false },
          { name: '💡 Örnek', value: '`!kuşan 15 weapon iron_sword`\n`!kuşan 15 accessory power_ring`', inline: false },
          { name: '📝 Not', value: 'Hayvan ID\'sini `!koleksiyon` ile görebilirsin.\nEşya ID\'lerini `!letheenv` ile görebilirsin.', inline: false }
        )
        .setFooter({ text: 'Sadece takımdaki hayvanlara eşya kuşanabilir!' });

      return message.reply({ embeds: [embed] });
    }

    const typeMap = {
      'silah': 'weapon',
      'weapon': 'weapon',
      'zirh': 'armor',
      'zırh': 'armor',
      'armor': 'armor',
      'aksesuar': 'accessory',
      'accessory': 'accessory'
    };

    const mappedType = typeMap[itemType];
    if (!mappedType) {
      return message.reply('❌ Geçersiz kategori! Kullanılabilir: `weapon`, `armor`, `accessory`');
    }

    const result = await letheStorage.equipItemToAnimal(message.author.id, animalId, mappedType, itemId);

    if (!result.success) {
      const errorMessages = {
        'Item not in inventory': '❌ Bu eşya envanterinde yok! Önce `!letheal` ile satın al.',
        'Animal not found': '❌ Bu hayvan bulunamadı veya sana ait değil!',
        'Animal not in team': '❌ Bu hayvan takımında değil! Önce `!takımekle` ile takıma ekle.',
        'Cannot equip this item type': '❌ Bu tür eşyalar kuşanılamaz!'
      };
      return message.reply(errorMessages[result.error] || '❌ Bir hata oluştu.');
    }

    const allAnimals = await letheStorage.getAllAnimals();
    const animalInfo = allAnimals.find(a => a.animalId === result.animal.animalId);

    const allWeapons = await letheStorage.getAllWeapons();
    const allArmors = await letheStorage.getAllArmors();
    const allAccessories = await letheStorage.getAllAccessories();

    let itemInfo = null;
    let statBonus = '';
    
    switch (mappedType) {
      case 'weapon':
        itemInfo = allWeapons.find(w => w.weaponId === itemId);
        if (itemInfo) statBonus = `⚔️ +${itemInfo.damage} Hasar`;
        break;
      case 'armor':
        itemInfo = allArmors.find(a => a.armorId === itemId);
        if (itemInfo) statBonus = `🛡️ +${itemInfo.defense} Savunma`;
        break;
      case 'accessory':
        itemInfo = allAccessories.find(a => a.accessoryId === itemId);
        if (itemInfo) statBonus = `✨ ${itemInfo.effect || itemInfo.bonus || 'Özel Bonus'}`;
        break;
    }

    const typeNames = {
      'weapon': '⚔️ Silah',
      'armor': '🛡️ Zırh',
      'accessory': '💍 Aksesuar'
    };

    const embed = new EmbedBuilder()
      .setColor('#10b981')
      .setTitle('✅ Eşya Kuşanıldı!')
      .setDescription(`${animalInfo?.emoji || '🐾'} **${result.animal.nickname || animalInfo?.name || 'Hayvan'}** eşyasını kuşandı!`)
      .addFields(
        { name: typeNames[mappedType], value: `${itemInfo?.emoji || '📦'} **${itemInfo?.name || itemId}**\n${statBonus}`, inline: true },
        { name: '🆔 Hayvan ID', value: `\`${animalId}\``, inline: true }
      )
      .setFooter({ text: 'Takımını görmek için: !takım' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
