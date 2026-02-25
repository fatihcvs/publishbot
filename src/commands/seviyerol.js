const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { db } = require('../database/db');
const { guilds } = require('../../shared/schema');
const { eq } = require('drizzle-orm');

module.exports = {
    name: 'seviyerol',
    aliases: ['levelrol', 'levelrole'],
    description: 'Seviye atlandığında otomatik verilecek rolleri ayarlar.',
    permissions: [PermissionFlagsBits.ManageRoles],
    usage: '!seviyerol [ekle/sil/liste] [seviye] [@rol]',

    async execute(message, args, client, storage) {
        if (!args[0]) {
            return this.sendHelp(message);
        }

        const subCommand = args[0].toLowerCase();

        switch (subCommand) {
            case 'ekle':
            case 'add':
                return this.addLevelRole(message, args.slice(1), storage);
            case 'sil':
            case 'kaldır':
            case 'remove':
            case 'delete':
                return this.removeLevelRole(message, args.slice(1), storage);
            case 'liste':
            case 'list':
                return this.listLevelRoles(message, storage);
            default:
                return this.sendHelp(message);
        }
    },

    async addLevelRole(message, args, storage) {
        if (!args[0] || !args[1]) {
            return message.reply('❌ Kullanım: `!seviyerol ekle <seviye> <@rol>`');
        }

        const level = parseInt(args[0]);
        if (isNaN(level) || level < 1 || level > 500) {
            return message.reply('❌ Lütfen geçerli bir seviye belirtin (1-500).');
        }

        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
        if (!role) {
            return message.reply('❌ Lütfen geçerli bir rol etiketleyin veya ID girin.');
        }

        const botHighestRole = message.guild.members.me.roles.highest;
        if (role.position >= botHighestRole.position) {
            return message.reply('❌ Bu rol benim rollerimden daha üstte veya aynı seviyede. Lütfen rolümü yukarı taşıyın.');
        }

        // Add to DB
        const guildData = await storage.getGuild(message.guild.id);
        let levelRoles = guildData.levelRoles || {};

        levelRoles[level.toString()] = role.id;

        await db.update(guilds)
            .set({ levelRoles })
            .where(eq(guilds.id, message.guild.id));

        return message.reply(`✅ Başarılı! Kullanıcılar **Seviye ${level}** olduklarında <@&${role.id}> rolünü kazanacaklar.`);
    },

    async removeLevelRole(message, args, storage) {
        if (!args[0]) {
            return message.reply('❌ Kullanım: `!seviyerol sil <seviye>`');
        }

        const level = parseInt(args[0]);
        if (isNaN(level)) return message.reply('❌ Geçerli bir seviye belirtin.');

        const guildData = await storage.getGuild(message.guild.id);
        let levelRoles = guildData.levelRoles || {};

        if (!levelRoles[level.toString()]) {
            return message.reply(`❌ **Seviye ${level}** için ayarlanmış bir ödül zaten yok.`);
        }

        delete levelRoles[level.toString()];

        await db.update(guilds)
            .set({ levelRoles })
            .where(eq(guilds.id, message.guild.id));

        return message.reply(`✅ **Seviye ${level}** için olan rol ödülü kaldırıldı.`);
    },

    async listLevelRoles(message, storage) {
        const guildData = await storage.getGuild(message.guild.id);
        const levelRoles = guildData.levelRoles || {};

        const keys = Object.keys(levelRoles).map(Number).sort((a, b) => a - b);

        if (keys.length === 0) {
            return message.reply('Bu sunucuda ayarlanmış hiçbir seviye rolü bulunmuyor. `!seviyerol ekle <seviye> <@rol>` ile ekleyebilirsiniz.');
        }

        let desc = '';
        for (const level of keys) {
            const roleId = levelRoles[level.toString()];
            desc += `**Seviye ${level}:** <@&${roleId}>\n`;
        }

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🏆 Seviye Ödülleri (Roller)')
            .setDescription(desc)
            .setFooter({ text: 'Bir ödülü kaldırmak için: !seviyerol sil <seviye>' });

        return message.reply({ embeds: [embed] });
    },

    sendHelp(message) {
        const embed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('🛡️ Seviye Rol Yönetimi')
            .setDescription('Kullanıcılar belirli seviyelere ulaştığında onlara otomatik verilecek rolleri ayarlayabilirsiniz.')
            .addFields(
                { name: 'Rol Ekleme', value: '`!seviyerol ekle <seviye> <@rol>`\nÖrn: `!seviyerol ekle 10 @Gümüş Üye`' },
                { name: 'Rol Silme', value: '`!seviyerol sil <seviye>`\nÖrn: `!seviyerol sil 10`' },
                { name: 'Ödülleri Listeleme', value: '`!seviyerol liste`' }
            );
        return message.reply({ embeds: [embed] });
    }
};
