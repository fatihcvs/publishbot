const { EmbedBuilder } = require('discord.js');
const { clanSystem } = require('../lethe/clanSystem');
const { getOrCreateProfile, addCoins } = require('../lethe/letheStorage');

module.exports = {
    name: 'klan',
    aliases: ['clan', 'guild'],
    description: 'Lethe Game Klan Sistemi komutları',
    letheGame: true,
    async execute(message, args, client) {
        const subCommand = args[0] ? args[0].toLowerCase() : 'bilgi';

        // Profili oluştur/getir
        const profile = await getOrCreateProfile(message.author.id);

        // KLAN KURMA (!klan kur <TAG> <İSİM>)
        if (subCommand === 'kur' || subCommand === 'create') {
            if (profile.clanId) {
                return message.reply('Zaten bir klandasın! Yeni klan kurmak için önce mevcut klandan ayrılmalısın.');
            }

            const tag = args[1];
            const name = args.slice(2).join(' ');

            if (!tag || tag.length < 3 || tag.length > 5) {
                return message.reply('Lütfen 3-5 karakter arası bir klan etiketi (TAG) gir! Örn: `!klan kur GYT GoyGoyTeam`');
            }

            if (!name || name.length < 3 || name.length > 32) {
                return message.reply('Lütfen 3-32 karakter arası geçerli bir klan ismi gir!');
            }

            // Parası var mı kontrol et
            if (profile.coins < clanSystem.constructor.CREATE_COST) {
                return message.reply(`Klan kurmak için yeterli altının yok! Gereken: **${clanSystem.constructor.CREATE_COST.toLocaleString()}** 💰 (Sende: ${profile.coins.toLocaleString()} 💰)`);
            }

            // Parayı düş ve klanı kur
            await addCoins(message.author.id, -clanSystem.constructor.CREATE_COST);

            const result = await clanSystem.createClan(message.author.id, name, tag);

            if (!result.success) {
                // Hata olursa parayı iade et
                await addCoins(message.author.id, clanSystem.constructor.CREATE_COST);
                return message.reply(`Klan kurulamadı: ${result.error}`);
            }

            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('👑 Yeni Klan Kuruldu!')
                .setDescription(`Tebrikler ${message.author}! **[${tag.toUpperCase()}] ${name}** klanı başarıyla kuruldu!`)
                .addFields(
                    { name: 'Klan Etiketi', value: tag.toUpperCase(), inline: true },
                    { name: 'Kurucu', value: message.author.tag, inline: true },
                    { name: 'Harcanan', value: `-${clanSystem.constructor.CREATE_COST.toLocaleString()} 💰`, inline: true }
                )
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        // KLAN BİLGİ (!klan bilgi)
        if (subCommand === 'bilgi' || subCommand === 'info') {
            let clanInfoToFetch;

            // Kullanıcının klanını veya mention'ı getir
            const targetUser = message.mentions.users.first() || message.author;

            if (args[1] && !message.mentions.users.first()) {
                // ID veya etiket girildiyse
                clanInfoToFetch = await clanSystem.getClanByTag(args[1].toUpperCase());
                if (!clanInfoToFetch) {
                    clanInfoToFetch = await clanSystem.getUserClan(targetUser.id);
                }
            } else {
                clanInfoToFetch = await clanSystem.getUserClan(targetUser.id);
            }

            if (!clanInfoToFetch) {
                return message.reply(`${targetUser.id === message.author.id ? 'Herhangi bir klanda değilsin.' : 'Bu kullanıcı herhangi bir klanda değil veya belirtilen klan bulunamadı.'} \`!klan kur <TAG> <İSİM>\` ile bir tane oluşturabilirsin.`);
            }

            // Üye listesini getir
            const members = await clanSystem.getClanMembers(clanInfoToFetch.id);
            const maxMembers = clanSystem.constructor.getMaxMembers(clanInfoToFetch.level);
            const reqXp = clanSystem.constructor.getRequiredXp(clanInfoToFetch.level);

            const embed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle(`🛡️ [${clanInfoToFetch.id}] ${clanInfoToFetch.name}`)
                .setDescription(clanInfoToFetch.description || 'Bu klanın henüz bir açıklaması yok.')
                .addFields(
                    { name: '📊 Seviye', value: `Lv. ${clanInfoToFetch.level}`, inline: true },
                    { name: '✨ DP', value: `${clanInfoToFetch.xp.toLocaleString()} / ${reqXp.toLocaleString()}`, inline: true },
                    { name: '💰 Hazine', value: `${clanInfoToFetch.coins.toLocaleString()} Altın`, inline: true },
                    { name: '👥 Üyeler', value: `${members.length} / ${maxMembers}`, inline: true },
                    { name: '👑 Lider', value: `<@${clanInfoToFetch.leaderId}>`, inline: true }
                );

            return message.reply({ embeds: [embed] });
        }

        // KLAN KATIL (!klan katıl <TAG>)
        if (subCommand === 'katıl' || subCommand === 'join') {
            if (profile.clanId) {
                return message.reply('Zaten bir klandasın! Yeni bir klana katılmak için önce mevcut klandan ayrılmalısın.');
            }

            const tag = args[1];
            if (!tag) {
                return message.reply('Lütfen katılmak istediğin klanın etiketini gir! Örn: `!klan katıl GYT`');
            }

            const result = await clanSystem.joinClan(message.author.id, tag.toUpperCase());

            if (!result.success) {
                return message.reply(`Katılım başarısız: ${result.error}`);
            }

            return message.reply(`🎉 Başarıyla **[${tag.toUpperCase()}]** klanına katıldın!`);
        }

        // KLANDAN AYRIL (!klan ayrıl)
        if (subCommand === 'ayrıl' || subCommand === 'leave') {
            // confirm yapabiliriz ama hızlıca ayrılma eklendi
            const result = await clanSystem.leaveClan(message.author.id);

            if (!result.success) {
                return message.reply(`Ayrılma başarısız: ${result.error}`);
            }

            return message.reply('👋 Klandan başarıyla ayrıldın.');
        }

        // KLAN ÜYELERİ (!klan üyeler [TAG])
        if (subCommand === 'üyeler' || subCommand === 'members') {
            let clanId;
            if (args[1]) {
                clanId = args[1].toUpperCase();
            } else if (profile.clanId) {
                clanId = profile.clanId;
            } else {
                return message.reply('Herhangi bir klanda değilsin. Lütfen bir klan etiketi belirt: `!klan üyeler <TAG>`');
            }

            const clan = await clanSystem.getClanByTag(clanId);
            if (!clan) return message.reply('Belirtilen klan bulunamadı.');

            const members = await clanSystem.getClanMembers(clanId);
            const memberList = members.map((m, i) => {
                const roleIcon = m.role === 'leader' ? '👑' : (m.role === 'elder' ? '🛡️' : '👤');
                return `${i + 1}. ${roleIcon} <@${m.userId}> - Katkı: ${m.contributionCoins.toLocaleString()} 💰 / ${m.contributionXp.toLocaleString()} ✨`;
            }).join('\n');

            const embed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle(`👥 [${clan.id}] ${clan.name} Üyeleri`)
                .setDescription(memberList || 'Bu klanda hiç üye yok (Bu imkansız olmalı).');

            return message.reply({ embeds: [embed] });
        }

        // KLAN BAĞIŞ (!klan bağış <MİKTAR>)
        if (subCommand === 'bağış' || subCommand === 'donate') {
            if (!profile.clanId) {
                return message.reply('Bağış yapabilmek için bir klanda olmalısın.');
            }

            const amount = parseInt(args[1]);
            if (!amount || isNaN(amount) || amount <= 0) {
                return message.reply('Lütfen geçerli bir bağış miktarı girin! Örn: `!klan bağış 1000`');
            }

            if (profile.coins < amount) {
                return message.reply(`Yeterli altının yok! Sende olan: ${profile.coins.toLocaleString()} 💰`);
            }

            // Altını düş, Klana ekle
            await addCoins(message.author.id, -amount);

            // Altın bağışı aynı miktarda XP kazandırır
            const result = await clanSystem.addClanProgress(profile.clanId, message.author.id, amount, amount);

            if (!result.success) return message.reply('Bağış işlemi sırasında bir hata oluştu.');

            let replyMsg = `💖 Klanına **${amount.toLocaleString()} 💰** bağışladın!`;
            if (result.leveledUp) {
                replyMsg += `\n🎉 **TEBRİKLER! Klanınız Seviye ${result.newLevel} oldu!**`;
            }

            return message.reply(replyMsg);
        }

        // KLANDAN ÜYE ATMA (!klan at @kullanıcı)
        if (subCommand === 'at' || subCommand === 'kick') {
            if (!profile.clanId) return message.reply('Bir klanda değilsin.');

            const clan = await clanSystem.getUserClan(message.author.id);
            if (clan.memberData.role !== 'leader' && clan.memberData.role !== 'elder') {
                return message.reply('Bunun için lider veya yetkili olman gerek.');
            }

            const targetUser = message.mentions.users.first();
            if (!targetUser) return message.reply('Kimi atmak istediğini etiketlemelisin: `!klan at @kullanıcı`');

            if (targetUser.id === message.author.id) return message.reply('Kendini atamazsın, ayrılmak için `!klan ayrıl` kullan.');

            const targetClan = await clanSystem.getUserClan(targetUser.id);
            if (!targetClan || targetClan.id !== clan.id) {
                return message.reply('Bu kullanıcı senin klanında değil.');
            }

            if (targetClan.memberData.role === 'leader') {
                return message.reply('Klan liderini atamazsın.');
            }

            await clanSystem.leaveClan(targetUser.id);
            return message.reply(`👋 <@${targetUser.id}> klandan atıldı.`);
        }

        // KLAN SIRALAMASI (!klan sıralama/top)
        if (subCommand === 'sıralama' || subCommand === 'top' || subCommand === 'lb') {
            const topClans = await clanSystem.getTopClans(10, 'level');

            if (topClans.length === 0) {
                return message.reply('Henüz hiç klan kurulmamış.');
            }

            const desc = topClans.map((c, i) => {
                const medal = i === 0 ? '🥇' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : `${i + 1}.`));
                return `${medal} **[${c.id}] ${c.name}** - Lv. ${c.level} (✨ ${c.xp.toLocaleString()} | 💰 ${c.coins.toLocaleString()})`;
            }).join('\n');

            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('🏆 En İyi 10 Klan')
                .setDescription(desc);

            return message.reply({ embeds: [embed] });
        }

        // KLAN YARDIM
        const helpEmbed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('🛡️ Lethe Klan Sistemi')
            .setDescription('Bir klana katılarak veya kurarak birlikte güçlenin!')
            .addFields(
                { name: 'Temel Komutlar', value: `\`!klan kur <TAG> <İSİM>\` - Yeni klan kurar (${clanSystem.constructor.CREATE_COST.toLocaleString()} 💰)\n\`!klan bilgi [TAG/@kullanıcı]\` - Klan detaylarını gösterir\n\`!klan katıl <TAG>\` - Klana katılır\n\`!klan ayrıl\` - Klandan ayrılır` },
                { name: 'Klan Yönetimi', value: `\`!klan üyeler [TAG]\` - Üyeleri listeler\n\`!klan bağış <Miktar>\` - Klana altın/XP kazandırır\n\`!klan at @kullanıcı\` - Üyeyi atar (Lider/Yetkili)` },
                { name: 'Diğer', value: `\`!klan sıralama\` - En iyi klanları gösterir` }
            )
            .setFooter({ text: 'Not: Klan leveli arttıkça maksimum üye kapasitesi artar!' });

        return message.reply({ embeds: [helpEmbed] });
    }
};
