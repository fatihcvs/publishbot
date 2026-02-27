const { EmbedBuilder } = require('discord.js');
const letheStorage = require('../lethe/letheStorage');

module.exports = {
    name: 'ad',
    aliases: ['rename', 'isimver', 'isim'],
    description: 'Hayvanına özel bir isim ver',
    category: 'lethe',
    usage: '!ad <hayvan_id> <isim> | !ad <hayvan_id> sıfırla',
    cooldown: 5,

    async execute(message, args, client, storage) {
        const guildData = await storage.getGuild(message.guild.id);
        if (guildData?.modules?.economy === false) {
            return message.reply('❌ Lethe Game bu sunucuda devre dışı.');
        }

        const letheChannels = guildData?.modules?.letheChannels || [];
        if (letheChannels.length > 0 && !letheChannels.includes(message.channel.id)) {
            return message.reply(`❌ Lethe Game komutları sadece belirlenen kanallarda çalışır!`);
        }

        if (!args[0]) {
            return message.reply(
                '❌ **Kullanım:**\n' +
                '`!ad <hayvan_id> <isim>` — Hayvana özel isim ver\n' +
                '`!ad <hayvan_id> sıfırla` — İsmi kaldır (orijinal isme dön)\n\n' +
                '**Örnek:** `!ad 3 Kahraman`\n' +
                'Hayvan ID\'lerini görmek için: `!koleksiyon`'
            );
        }

        const animalId = parseInt(args[0]);
        if (isNaN(animalId)) {
            return message.reply('❌ Geçerli bir hayvan ID\'si gir! Örn: `!ad 3 Kahraman`');
        }

        const profile = await letheStorage.getProfile(message.author.id);
        if (!profile) {
            return message.reply('❌ Henüz Lethe oyuncusu değilsin! `!avla` ile başla.');
        }

        // Koleksiyonda hayvanı bul
        const animal = profile.animals?.find(a => a.id === animalId);
        if (!animal) {
            return message.reply(`❌ **${animalId}** ID'li bir hayvanın yok! \`!koleksiyon\` ile listeni gör.`);
        }

        // Sıfırlama modu
        if (args[1]?.toLowerCase() === 'sıfırla' || args[1]?.toLowerCase() === 'sifirla') {
            const oldNickname = animal.nickname;
            if (!oldNickname) {
                return message.reply(`❌ **${animal.emoji} ${animal.name}** adlı hayvanının zaten özel bir ismi yok.`);
            }

            animal.nickname = null;
            await letheStorage.updateProfile(message.author.id, { animals: profile.animals });

            const embed = new EmbedBuilder()
                .setColor('#94a3b8')
                .setTitle('📛 İsim Sıfırlandı')
                .setDescription(`${animal.emoji} **${animal.name}** adlı hayvanının özel ismi (**"${oldNickname}"**) kaldırıldı.`)
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        // Yeni isim ver
        const newName = args.slice(1).join(' ').trim();
        if (!newName) {
            return message.reply('❌ İsim belirtmelisin! Örn: `!ad 3 Kahraman`');
        }

        // Uzunluk kontrolü
        if (newName.length > 24) {
            return message.reply(`❌ İsim en fazla **24 karakter** olabilir! (Şu an: ${newName.length})`);
        }

        // Basit küfür/spam filtresi
        if (/(.)\1{4,}/.test(newName)) {
            return message.reply('❌ Geçersiz isim! Aynı karakteri üst üste çok fazla kullanamazsın.');
        }

        const oldName = animal.nickname || animal.name;
        animal.nickname = newName;
        await letheStorage.updateProfile(message.author.id, { animals: profile.animals });

        const embed = new EmbedBuilder()
            .setColor('#10b981')
            .setTitle('✏️ İsim Güncellendi!')
            .setDescription(`${animal.emoji} Hayvanının ismi başarıyla değiştirildi!`)
            .addFields(
                { name: '📛 Eski İsim', value: oldName, inline: true },
                { name: '✨ Yeni İsim', value: newName, inline: true },
                { name: '🆔 Hayvan ID', value: `#${animalId}`, inline: true }
            )
            .setFooter({ text: 'İptal etmek için: !ad ' + animalId + ' sıfırla' })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }
};
