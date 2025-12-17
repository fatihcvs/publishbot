const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder, PermissionFlagsBits, Events, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { storage } = require('./database/storage');
const { checkAutomod } = require('./modules/automod');
const { checkAutoPunishment } = require('./modules/autoPunish');
const { Scheduler } = require('./modules/scheduler');
const { LogSystem } = require('./modules/logSystem');
const { LevelingSystem } = require('./modules/leveling');
const { TempVoiceSystem } = require('./modules/tempVoice');
const { StatChannelSystem } = require('./modules/statChannels');
const { SocialNotificationSystem } = require('./modules/socialNotifications');
const { chat: chatGPT } = require('./modules/chatgpt');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildInvites
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.Reaction]
});

client.commands = new Collection();
client.storage = storage;
client.invites = new Collection();

const PREFIX = '!';

const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  try {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
    if (command.aliases) {
      command.aliases.forEach(alias => client.commands.set(alias, command));
    }
  } catch (error) {
    console.error(`Error loading command ${file}:`, error);
  }
}

let scheduler;
let logSystem;
let levelingSystem;
let tempVoiceSystem;
let statChannelSystem;
let socialNotificationSystem;

client.once(Events.ClientReady, async () => {
  console.log(`Publisher online! ${client.user.tag} olarak giriş yapıldı.`);
  console.log(`${client.guilds.cache.size} sunucuda aktif.`);
  client.user.setActivity('!yardım | Publisher', { type: 3 });
  
  for (const guild of client.guilds.cache.values()) {
    try {
      const invites = await guild.invites.fetch();
      const inviteCache = new Collection();
      invites.forEach(invite => inviteCache.set(invite.code, invite.uses || 0));
      client.invites.set(guild.id, inviteCache);
    } catch (error) {
      console.log(`Davetler alınamadı: ${guild.name}`);
    }
  }
  
  scheduler = new Scheduler(client, storage);
  scheduler.start();
  
  logSystem = new LogSystem(client, storage);
  levelingSystem = new LevelingSystem(client, storage);
  tempVoiceSystem = new TempVoiceSystem(client, storage);
  statChannelSystem = new StatChannelSystem(client, storage);
  socialNotificationSystem = new SocialNotificationSystem(client, storage);
  console.log('All systems started');
});

client.on(Events.GuildMemberAdd, async (member) => {
  const guildData = await storage.getGuild(member.guild.id);
  
  let inviterId = null;
  let usedInviteCode = null;
  try {
    const oldInvites = client.invites.get(member.guild.id) || new Collection();
    const newInvites = await member.guild.invites.fetch();
    
    for (const [code, invite] of newInvites) {
      const oldUses = oldInvites.get(code) || 0;
      if (invite.uses > oldUses) {
        inviterId = invite.inviter?.id;
        usedInviteCode = code;
        break;
      }
    }
    
    const updatedCache = new Collection();
    newInvites.forEach(inv => updatedCache.set(inv.code, inv.uses || 0));
    client.invites.set(member.guild.id, updatedCache);
    
    if (inviterId && inviterId !== member.id) {
      await storage.trackInvite(member.guild.id, member.id, inviterId, usedInviteCode);
    }
  } catch (error) {
    console.error('Davet takibi hatası:', error);
  }
  
  if (guildData?.autoRole) {
    try {
      const role = member.guild.roles.cache.get(guildData.autoRole);
      if (role) {
        await member.roles.add(role);
      }
    } catch (error) {
      console.error('Oto-rol hatası:', error);
    }
  }
  
  if (guildData?.welcomeChannel && guildData?.welcomeMessage) {
    try {
      const channel = member.guild.channels.cache.get(guildData.welcomeChannel);
      if (channel) {
        let welcomeMsg = guildData.welcomeMessage
          .replace(/{user}/g, member.toString())
          .replace(/{username}/g, member.user.username)
          .replace(/{server}/g, member.guild.name)
          .replace(/{membercount}/g, member.guild.memberCount);
        
        if (inviterId) {
          welcomeMsg = welcomeMsg.replace(/{inviter}/g, `<@${inviterId}>`);
        } else {
          welcomeMsg = welcomeMsg.replace(/{inviter}/g, 'Bilinmiyor');
        }
        
        const embed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('Hoş Geldin!')
          .setDescription(welcomeMsg)
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .setTimestamp();
        
        await channel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Hoş geldin mesajı hatası:', error);
    }
  }
  
  if (logSystem) await logSystem.guildMemberAdd(member, inviterId);
});

client.on(Events.GuildMemberRemove, async (member) => {
  if (logSystem) await logSystem.guildMemberRemove(member);
  
  // Hoşçakal sistemi
  const guildData = await storage.getGuild(member.guild.id);
  if (guildData?.goodbyeChannel) {
    try {
      const channel = member.guild.channels.cache.get(guildData.goodbyeChannel);
      if (channel) {
        let goodbyeText = guildData.goodbyeMessage || '**{user}** sunucudan ayrıldı. Görüşmek üzere!';
        goodbyeText = goodbyeText
          .replace(/{user}/g, member.user.username)
          .replace(/{server}/g, member.guild.name)
          .replace(/{membercount}/g, member.guild.memberCount);

        const embed = new EmbedBuilder()
          .setColor('#ff6b6b')
          .setTitle('👋 Güle Güle!')
          .setDescription(goodbyeText)
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .setTimestamp();

        await channel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Hoşçakal mesajı hatası:', error);
    }
  }
});

client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  if (logSystem) await logSystem.guildMemberUpdate(oldMember, newMember);
});

client.on(Events.MessageDelete, async (message) => {
  if (logSystem) await logSystem.messageDelete(message);
});

client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
  if (logSystem) await logSystem.messageUpdate(oldMessage, newMessage);
});

client.on(Events.ChannelCreate, async (channel) => {
  if (logSystem) await logSystem.channelCreate(channel);
});

client.on(Events.ChannelDelete, async (channel) => {
  if (logSystem) await logSystem.channelDelete(channel);
});

client.on(Events.ChannelUpdate, async (oldChannel, newChannel) => {
  if (logSystem) await logSystem.channelUpdate(oldChannel, newChannel);
});

client.on(Events.GuildRoleCreate, async (role) => {
  if (logSystem) await logSystem.roleCreate(role);
});

client.on(Events.GuildRoleDelete, async (role) => {
  if (logSystem) await logSystem.roleDelete(role);
});

client.on(Events.GuildRoleUpdate, async (oldRole, newRole) => {
  if (logSystem) await logSystem.roleUpdate(oldRole, newRole);
});

client.on(Events.GuildBanAdd, async (ban) => {
  if (logSystem) await logSystem.guildBanAdd(ban);
});

client.on(Events.GuildBanRemove, async (ban) => {
  if (logSystem) await logSystem.guildBanRemove(ban);
});

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  if (logSystem) await logSystem.voiceStateUpdate(oldState, newState);
});

client.on(Events.GuildUpdate, async (oldGuild, newGuild) => {
  if (logSystem) await logSystem.guildUpdate(oldGuild, newGuild);
});

client.on(Events.InviteCreate, async (invite) => {
  if (logSystem) await logSystem.inviteCreate(invite);
});

client.on(Events.InviteDelete, async (invite) => {
  if (logSystem) await logSystem.inviteDelete(invite);
});

// Button etkileşimleri
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  // Talep oluşturma butonu
  if (interaction.customId === 'create_ticket') {
    const guildData = await storage.getGuild(interaction.guild.id);
    if (!guildData?.ticketCategory) {
      return interaction.reply({ content: 'Talep sistemi yapılandırılmamış!', ephemeral: true });
    }

    const existingTicket = interaction.guild.channels.cache.find(
      c => c.name === `talep-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`
    );

    if (existingTicket) {
      return interaction.reply({ content: `Zaten açık bir talebin var: ${existingTicket}`, ephemeral: true });
    }

    try {
      const ticketChannel = await interaction.guild.channels.create({
        name: `talep-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        type: ChannelType.GuildText,
        parent: guildData.ticketCategory,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
          },
          ...(guildData.ticketSupportRole ? [{
            id: guildData.ticketSupportRole,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
          }] : [])
        ]
      });

      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('🎫 Yeni Destek Talebi')
        .setDescription('Lütfen sorununuzu detaylı bir şekilde açıklayın.\nBir yetkili en kısa sürede size yardımcı olacaktır.')
        .addFields({ name: 'Kullanıcı', value: interaction.user.tag })
        .setTimestamp();

      await ticketChannel.send({ 
        content: `${interaction.user}${guildData.ticketSupportRole ? ` <@&${guildData.ticketSupportRole}>` : ''}`,
        embeds: [embed]
      });

      await interaction.reply({ content: `Talebin oluşturuldu: ${ticketChannel}`, ephemeral: true });
    } catch (error) {
      console.error('Talep oluşturma hatası:', error);
      await interaction.reply({ content: 'Talep oluşturulurken bir hata oluştu!', ephemeral: true });
    }
  }

  // Talep kapatma butonu
  if (interaction.customId === 'close_ticket') {
    const embed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('Talep Kapatılıyor')
      .setDescription('Bu talep 5 saniye içinde kapatılacak...')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    
    setTimeout(async () => {
      try {
        await interaction.channel.delete();
      } catch (err) {
        console.error('Talep kanalı silinirken hata:', err);
      }
    }, 5000);
  }

  // Doğrulama butonu
  if (interaction.customId === 'verify_user') {
    const guildData = await storage.getGuild(interaction.guild.id);
    if (!guildData?.verifiedRole) {
      return interaction.reply({ content: 'Doğrulama sistemi yapılandırılmamış!', ephemeral: true });
    }

    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      
      if (guildData.verificationRole) {
        await member.roles.remove(guildData.verificationRole).catch(() => {});
      }
      await member.roles.add(guildData.verifiedRole);

      await interaction.reply({ content: '✅ Başarıyla doğrulandınız!', ephemeral: true });
    } catch (error) {
      console.error('Doğrulama hatası:', error);
      await interaction.reply({ content: 'Doğrulama sırasında bir hata oluştu!', ephemeral: true });
    }
  }
});

client.on(Events.MessageReactionAdd, async (reaction, user) => {
  if (user.bot) return;
  
  try {
    if (reaction.partial) {
      await reaction.fetch();
    }
    
    const reactionRole = await storage.getReactionRole(reaction.message.id, reaction.emoji.name);
    if (reactionRole) {
      const member = await reaction.message.guild.members.fetch(user.id);
      const role = reaction.message.guild.roles.cache.get(reactionRole.roleId);
      if (role && member) {
        await member.roles.add(role);
      }
    }
  } catch (error) {
    console.error('Reaction role add error:', error);
  }
});

client.on(Events.MessageReactionRemove, async (reaction, user) => {
  if (user.bot) return;
  
  try {
    if (reaction.partial) {
      await reaction.fetch();
    }
    
    const reactionRole = await storage.getReactionRole(reaction.message.id, reaction.emoji.name);
    if (reactionRole) {
      const member = await reaction.message.guild.members.fetch(user.id);
      const role = reaction.message.guild.roles.cache.get(reactionRole.roleId);
      if (role && member) {
        await member.roles.remove(role);
      }
    }
  } catch (error) {
    console.error('Reaction role remove error:', error);
  }
});

client.on(Events.InviteCreate, async (invite) => {
  try {
    const guildInvites = client.invites.get(invite.guild.id) || new Collection();
    guildInvites.set(invite.code, invite.uses);
    client.invites.set(invite.guild.id, guildInvites);
  } catch (error) {
    console.error('Invite create cache error:', error);
  }
});

client.on(Events.InviteDelete, async (invite) => {
  try {
    const guildInvites = client.invites.get(invite.guild.id);
    if (guildInvites) {
      guildInvites.delete(invite.code);
    }
  } catch (error) {
    console.error('Invite delete cache error:', error);
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) return;
  
  const afk = await storage.getAfk(message.guild.id, message.author.id);
  if (afk) {
    await storage.removeAfk(message.guild.id, message.author.id);
    const reply = await message.reply(`Tekrar hoş geldin! AFK durumun kaldırıldı. (<t:${Math.floor(new Date(afk.createdAt).getTime() / 1000)}:R> önce AFK oldunuz)`);
    setTimeout(() => reply.delete().catch(() => {}), 5000);
  }
  
  const mentionedUsers = message.mentions.users;
  for (const [userId, user] of mentionedUsers) {
    const userAfk = await storage.getAfk(message.guild.id, userId);
    if (userAfk) {
      message.reply(`${user.tag} şu anda AFK: ${userAfk.reason}`);
    }
  }

  if (message.mentions.has(client.user) && !message.mentions.everyone) {
    const userMessage = message.content.replace(/<@!?\d+>/g, '').trim();
    if (userMessage.length > 0) {
      try {
        await message.channel.sendTyping();
        const response = await chatGPT(message.author.id, userMessage);
        await message.reply(response);
      } catch (error) {
        console.error('ChatGPT reply error:', error);
      }
      return;
    }
  }
  
  const blocked = await checkAutomod(message, client, storage);
  if (blocked) return;

  if (levelingSystem) {
    await levelingSystem.handleMessage(message);
  }
  
  const customCmd = await storage.getCustomCommand(message.guild.id, message.content.toLowerCase());
  if (customCmd) {
    return message.reply(customCmd.response);
  }
  
  if (!message.content.startsWith(PREFIX)) return;
  
  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  
  const command = client.commands.get(commandName);
  if (!command) return;
  
  if (command.permissions) {
    const hasPermission = message.member.permissions.has(command.permissions);
    if (!hasPermission) {
      return message.reply('Bu komutu kullanmak için yetkiniz yok!');
    }
  }
  
  try {
    await command.execute(message, args, client);
  } catch (error) {
    console.error('Komut hatası:', error);
    message.reply('Komut çalıştırılırken bir hata oluştu!');
  }
});

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error('DISCORD_BOT_TOKEN bulunamadı! Lütfen token\'ı ayarlayın.');
  process.exit(1);
}

client.login(token);

module.exports = { client };
