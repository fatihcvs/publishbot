const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { db } = require('../../database/db');
const { guilds } = require('../../../shared/schema');
const { eq } = require('drizzle-orm');

module.exports = {
    name: 'antiraid',
    aliases: ['koruma', 'raidkoruma', 'anti-raid'],
    description: 'Gelişmiş sunucu koruma ayarlarını yönetir (Toplu giriş ve sahte bot saldırılarına karşı)',
    permissions: [PermissionFlagsBits.Administrator],
    usage: '!antiraid [aç/kapat/ayarla/durum]',

    async execute(message, args, client, storage) {
        if (!args[0]) {
            return this.showStatus(message, storage);
        }

        const subCommand = args[0].toLowerCase();

        switch (subCommand) {
            case 'aç':
            case 'on':
                return this.toggleSystem(message, storage, true);
            case 'kapat':
            case 'off':
                return this.toggleSystem(message, storage, false);
            case 'ayarla':
            case 'config':
                return this.configureSystem(message, args.slice(1), storage);
            case 'durum':
            case 'status':
                return this.showStatus(message, storage);
            default:
                return message.reply('❌ Geçersiz komut. Kullanım: `!antiraid [aç/kapat/ayarla/durum]`');
        }
    },

    async toggleSystem(message, storage, state) {
        const guildData = await storage.getGuild(message.guild.id);
        let config = guildData?.antiraidConfig || {};

        config.enabled = state;

        // Varsayılan ayarlar yoksa ekle
        if (state && !config.threshold) {
            config.threshold = 5; // 5 katılımcı
            config.timeFrame = 10; // 10 saniye
            config.action = 'kick';
            config.accountAgeDays = 0;
        }

        await db.update(guilds)
            .set({ antiraidConfig: config })
            .where(eq(guilds.id, message.guild.id));

        return message.reply(`✅ Anti-Raid sistemi **${state ? 'açıldı' : 'kapatıldı'}**.`);
    },

    async configureSystem(message, args, storage) {
        if (!args[0] || !args[1]) {
            const helperEmbed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('🛡️ Anti-Raid Ayarları Nasıl Kullanılır?')
                .setDescription('Kullanım: `!antiraid ayarla <ayar> <değer>`')
                .addFields(
                    { name: 'limit', value: 'Saldırı sayılacak giriş sayısı (Örn: 5)\n`!antiraid ayarla limit 5`' },
                    { name: 'saniye', value: 'Girişlerin ölçüleceği zaman aralığı (Örn: 10)\n`!antiraid ayarla saniye 10`' },
                    { name: 'ceza', value: 'Uygulanacak işlem (kick, ban, uyarı)\n`!antiraid ayarla ceza ban`' },
                    { name: 'hesapyasi', value: 'Hesapların minimum kaç günlük olması gerektiği (0 = kapalı)\n`!antiraid ayarla hesapyasi 3`' }
                );
            return message.reply({ embeds: [helperEmbed] });
        }

        const setting = args[0].toLowerCase();
        const val = args[1].toLowerCase();

        const guildData = await storage.getGuild(message.guild.id);
        let config = guildData?.antiraidConfig || {};
        if (!config.enabled) {
            return message.reply('❌ Önce sistemi açmalısınız: `!antiraid aç`');
        }

        if (setting === 'limit') {
            const num = parseInt(val);
            if (isNaN(num) || num < 2 || num > 100) return message.reply('❌ Geçerli bir sayı girin (2-100).');
            config.threshold = num;
            await this.saveConfig(message.guild.id, config);
            return message.reply(`✅ Raid tetiklenme limiti **${num} kişi** olarak ayarlandı.`);
        }

        if (setting === 'saniye' || setting === 'süre') {
            const num = parseInt(val);
            if (isNaN(num) || num < 2 || num > 120) return message.reply('❌ Geçerli bir saniye girin (2-120).');
            config.timeFrame = num;
            await this.saveConfig(message.guild.id, config);
            return message.reply(`✅ Zaman aralığı **${num} saniye** olarak ayarlandı. (${num} saniye içinde ${config.threshold} kişi girerse tetiklenir)`);
        }

        if (setting === 'ceza' || setting === 'işlem') {
            if (!['kick', 'ban', 'uyarı'].includes(val)) return message.reply('❌ Ceza tipi şunlardan biri olmalıdır: `kick`, `ban`, `uyarı`.');
            config.action = val === 'uyarı' ? 'alert' : val;
            await this.saveConfig(message.guild.id, config);
            return message.reply(`✅ Ceza tipi **${val}** olarak güncellendi.`);
        }

        if (setting === 'hesapyasi' || setting === 'age') {
            const num = parseInt(val);
            if (isNaN(num) || num < 0 || num > 365) return message.reply('❌ Geçerli bir gün sayısı girin (0 = kapalı, max 365).');
            config.accountAgeDays = num;
            await this.saveConfig(message.guild.id, config);
            if (num === 0) return message.reply('✅ Yeni hesap koruması kapatıldı.');
            return message.reply(`✅ Sunucuya katılmak için minimum hesap yaşı **${num} gün** olarak ayarlandı.`);
        }

        return message.reply('❌ Bilinmeyen ayar adı. Yardım için `!antiraid ayarla` yazın.');
    },

    async saveConfig(guildId, config) {
        await db.update(guilds)
            .set({ antiraidConfig: config })
            .where(eq(guilds.id, guildId));
    },

    async showStatus(message, storage) {
        const guildData = await storage.getGuild(message.guild.id);
        const config = guildData?.antiraidConfig || {};

        const embed = new EmbedBuilder()
            .setColor(config.enabled ? '#00FF00' : '#FF0000')
            .setTitle('🛡️ Anti-Raid Durumu')
            .setDescription(config.enabled ? 'Sistem **AKTİF** ve sunucunuzu koruyor.' : 'Sistem kapalı.')
            .setThumbnail('https://cdn-icons-png.flaticon.com/512/1161/1161388.png');

        if (config.enabled) {
            embed.addFields(
                { name: 'Tetiklenme Şartı', value: `${config.timeFrame || 10} saniye içinde\n${config.threshold || 5} üye girişi`, inline: true },
                { name: 'Uygulanacak Ceza', value: (config.action === 'ban' ? 'Ban' : config.action === 'kick' ? 'Kick' : 'Sadece Uyarı'), inline: true },
                { name: 'Hesap Yaşı Filtresi', value: config.accountAgeDays && config.accountAgeDays > 0 ? `Minimum ${config.accountAgeDays} günlük hesap` : 'Kapalı', inline: false }
            );
        } else {
            embed.addFields({ name: 'Nasıl Açılır?', value: '`!antiraid aç` yazarak korumayı başlatabilirsiniz.' });
        }

        return message.reply({ embeds: [embed] });
    }
};
