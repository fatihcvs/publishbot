const { EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    name: 'forum',
    aliases: ['forum'],
    description: 'Forum kanalı başlıklarını yönetir.',
    usage: '!forum [çözüldü | arşiv <gün> | top]',

    async execute(message, args, client) {
        const sub = args[0]?.toLowerCase();
        switch (sub) {
            case 'çözüldü': case 'cozuldu': case 'solved':
                return this.markSolved(message);
            case 'arşiv': case 'arsiv': case 'archive':
                return this.archiveOld(message, args.slice(1));
            case 'top': case 'aktif':
                return this.showTop(message, client);
            default:
                return this.sendHelp(message);
        }
    },

    async markSolved(message) {
        const thread = message.channel;
        // Forum thread mi?
        if (!thread.isThread()) return message.reply('❌ Bu komut sadece forum başlıklarında kullanılabilir.').catch(() => { });

        const isOP = thread.ownerId === message.author.id;
        const isMod = message.member.permissions.has(PermissionFlagsBits.ManageThreads);
        if (!isOP && !isMod) return message.reply('❌ Bu başlığı sadece konu sahibi veya moderatörler kapatabilir.').catch(() => { });

        try {
            // Başlığa "Çözüldü" etiketi ekle
            const parent = thread.parent;
            const solvedTag = parent?.availableTags?.find(t => /çözüldü|cozuldu|solved|closed/i.test(t.name));

            if (solvedTag) {
                const currentTags = thread.appliedTags || [];
                if (!currentTags.includes(solvedTag.id)) {
                    await thread.setAppliedTags([...currentTags, solvedTag.id]);
                }
            }

            // Başlığı kilitle/arşivle
            await thread.setArchived(true, 'Çözüldü olarak işaretlendi');
            await message.reply('✅ Bu başlık **çözüldü** olarak işaretlendi ve arşivlendi.').catch(() => { });
        } catch (err) {
            console.error('[Forum.markSolved]', err);
            message.reply('❌ Başlık kapatılamadı. Bot yetkisini kontrol edin.').catch(() => { });
        }
    },

    async archiveOld(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageThreads)) {
            return message.reply('❌ Bu komut için **Thread Yönet** yetkisi gerekiyor.').catch(() => { });
        }

        const days = parseInt(args[0]) || 7;
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

        const forumChannels = message.guild.channels.cache.filter(c => c.type === ChannelType.GuildForum);
        if (forumChannels.size === 0) return message.reply('Bu sunucuda forum kanalı yok.').catch(() => { });

        let archived = 0;
        for (const [, forum] of forumChannels) {
            const threads = await forum.threads.fetchActive().catch(() => null);
            if (!threads) continue;
            for (const [, thread] of threads.threads) {
                if (!thread.archived && thread.lastMessageId) {
                    const lastMsg = await thread.messages.fetch({ limit: 1 }).catch(() => null);
                    const lastTs = lastMsg?.first()?.createdTimestamp || thread.createdTimestamp;
                    if (lastTs < cutoff) {
                        await thread.setArchived(true, `${days} günden eski`).catch(() => { });
                        archived++;
                    }
                }
            }
        }

        return message.reply(`✅ ${archived} başlık arşivlendi (${days} günden eski, boş/susturulmuş).`).catch(() => { });
    },

    async showTop(message, client) {
        const forumChannels = message.guild.channels.cache.filter(c => c.type === ChannelType.GuildForum);
        if (forumChannels.size === 0) return message.reply('Bu sunucuda forum kanalı yok.').catch(() => { });

        const threads = [];
        for (const [, forum] of forumChannels) {
            const active = await forum.threads.fetchActive().catch(() => null);
            if (!active) continue;
            for (const [, t] of active.threads) {
                threads.push({ name: t.name, count: t.messageCount || 0, url: t.url });
            }
        }

        threads.sort((a, b) => b.count - a.count);
        const top10 = threads.slice(0, 10);

        if (!top10.length) return message.reply('Aktif forum başlığı bulunamadı.').catch(() => { });

        const desc = top10.map((t, i) =>
            `**${i + 1}.** [${t.name}](${t.url}) — ${t.count} mesaj`
        ).join('\n');

        return message.reply({
            embeds: [new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🏆 En Aktif Forum Başlıkları')
                .setDescription(desc)
                .setTimestamp()]
        }).catch(() => { });
    },

    sendHelp(message) {
        const embed = new EmbedBuilder().setColor('#5865F2').setTitle('💬 Forum Yönetimi')
            .addFields(
                { name: '✅ Çözüldü', value: '`!forum çözüldü` — Başlığı çözüldü olarak kapat (OP/mod)' },
                { name: '🗄️ Arşivle', value: '`!forum arşiv <gün>` — X günden eski başlıkları arşivle' },
                { name: '🏆 Aktif', value: '`!forum top` — En aktif forum başlıkları' }
            );
        return message.reply({ embeds: [embed] }).catch(() => { });
    }
};
