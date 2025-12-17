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
    const itemId = args[1];

    if (!animalId || !itemId) {
      const embed = new EmbedBuilder()
        .setColor('#ff6b6b')
        .setTitle('⚔️ Eşya Kuşanma')
        .setDescription('**Kullanım:** `!kuşan <hayvan_id> <eşya_id>`')
        .addFields(
          { name: '💡 Örnek', value: '`!kuşan 15 iron_sword`\n`!kuşan 15 power_necklace`', inline: false },
          { name: '📝 Not', value: 'Hayvan ID\'sini `!koleksiyon` ile görebilirsin.\nEşya ID\'lerini `!letheenv` ile görebilirsin.', inline: false }
        )
        .setFooter({ text: 'Sadece takımdaki hayvanlara eşya kuşanabilir!' });

      return message.reply({ embeds: [embed] });
    }

    const allWeapons = await letheStorage.getAllWeapons();
    const allArmors = await letheStorage.getAllArmors();
    const allAccessories = await letheStorage.getAllAccessories();

    let itemType = null;
    let itemInfo = null;

    const weapon = allWeapons.find(w => w.weaponId === itemId);
    if (weapon) {
      itemType = 'weapon';
      itemInfo = weapon;
    }

    const armor = allArmors.find(a => a.armorId === itemId);
    if (armor) {
      itemType = 'armor';
      itemInfo = armor;
    }

    const accessory = allAccessories.find(a => a.accessoryId === itemId);
    if (accessory) {
      itemType = 'accessory';
      itemInfo = accessory;
    }

    if (!itemType) {
      return message.reply('❌ Bu eşya bulunamadı! Eşya ID\'lerini `!letheenv` ile kontrol et.');
    }

    const result = await letheStorage.equipItemToAnimal(message.author.id, animalId, itemType, itemId);

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

    const effectNames = {
      'hunt_bonus': '🎯 Avlanma Bonusu',
      'str_boost': '⚔️ Güç (STR)',
      'def_boost': '🛡️ Savunma (DEF)',
      'spd_boost': '⚡ Hız (SPD)',
      'hp_boost': '❤️ Can (HP)',
      'magic_boost': '🔮 Büyü Gücü',
      'all_stats': '✨ Tüm İstatistikler',
      'crit_boost': '💥 Kritik Şansı',
      'dodge_boost': '💨 Kaçınma Şansı',
      'xp_boost': '📈 XP Kazanımı',
      'coin_boost': '💰 Para Kazanımı'
    };

    let statBonus = '';
    
    switch (itemType) {
      case 'weapon':
        statBonus = `⚔️ **+${itemInfo.damage}** Hasar`;
        break;
      case 'armor':
        statBonus = `🛡️ **+${itemInfo.defense}** Savunma`;
        break;
      case 'accessory':
        const effectName = effectNames[itemInfo.effect] || itemInfo.effect;
        statBonus = `${effectName} **+${itemInfo.effectValue}**`;
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
        { name: typeNames[itemType], value: `${itemInfo?.emoji || '📦'} **${itemInfo?.name || itemId}**\n${statBonus}`, inline: true },
        { name: '🆔 Hayvan ID', value: `\`${animalId}\``, inline: true }
      )
      .setFooter({ text: 'Takımını görmek için: !takım' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
