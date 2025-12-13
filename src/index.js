const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder, PermissionFlagsBits, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildPresences
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember]
});

client.commands = new Collection();

const dataPath = path.join(__dirname, '../data');
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
}

const configPath = path.join(dataPath, 'config.json');
const customCommandsPath = path.join(dataPath, 'customCommands.json');
const warningsPath = path.join(dataPath, 'warnings.json');

function loadJSON(filePath, defaultData = {}) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error);
  }
  return defaultData;
}

function saveJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error saving ${filePath}:`, error);
  }
}

let config = loadJSON(configPath, {});
let customCommands = loadJSON(customCommandsPath, {});
let warnings = loadJSON(warningsPath, {});

const PREFIX = '!';

const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
  if (command.aliases) {
    command.aliases.forEach(alias => client.commands.set(alias, command));
  }
}

client.config = config;
client.customCommands = customCommands;
client.warnings = warnings;
client.saveConfig = () => saveJSON(configPath, client.config);
client.saveCustomCommands = () => saveJSON(customCommandsPath, client.customCommands);
client.saveWarnings = () => saveJSON(warningsPath, client.warnings);

client.once(Events.ClientReady, () => {
  console.log(`Publisher Bot online! ${client.user.tag} olarak giriş yapıldı.`);
  console.log(`${client.guilds.cache.size} sunucuda aktif.`);
  client.user.setActivity('!yardım | Publisher Bot', { type: 3 });
});

client.on(Events.GuildMemberAdd, async (member) => {
  const guildConfig = client.config[member.guild.id] || {};
  
  if (guildConfig.autoRole) {
    try {
      const role = member.guild.roles.cache.get(guildConfig.autoRole);
      if (role) {
        await member.roles.add(role);
        console.log(`Oto-rol verildi: ${member.user.tag}`);
      }
    } catch (error) {
      console.error('Oto-rol hatası:', error);
    }
  }
  
  if (guildConfig.welcomeChannel && guildConfig.welcomeMessage) {
    try {
      const channel = member.guild.channels.cache.get(guildConfig.welcomeChannel);
      if (channel) {
        const welcomeMsg = guildConfig.welcomeMessage
          .replace(/{user}/g, member.toString())
          .replace(/{username}/g, member.user.username)
          .replace(/{server}/g, member.guild.name)
          .replace(/{membercount}/g, member.guild.memberCount);
        
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
  
  if (guildConfig.logChannel) {
    try {
      const logChannel = member.guild.channels.cache.get(guildConfig.logChannel);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('Üye Katıldı')
          .setDescription(`${member.user.tag} sunucuya katıldı.`)
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: 'Hesap Oluşturulma', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
            { name: 'Üye Sayısı', value: `${member.guild.memberCount}`, inline: true }
          )
          .setTimestamp();
        
        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Log hatası:', error);
    }
  }
});

client.on(Events.GuildMemberRemove, async (member) => {
  const guildConfig = client.config[member.guild.id] || {};
  
  if (guildConfig.logChannel) {
    try {
      const logChannel = member.guild.channels.cache.get(guildConfig.logChannel);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('Üye Ayrıldı')
          .setDescription(`${member.user.tag} sunucudan ayrıldı.`)
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: 'Sunucuda Kalma Süresi', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
            { name: 'Üye Sayısı', value: `${member.guild.memberCount}`, inline: true }
          )
          .setTimestamp();
        
        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Log hatası:', error);
    }
  }
});

client.on(Events.MessageDelete, async (message) => {
  if (!message.guild || message.author?.bot) return;
  
  const guildConfig = client.config[message.guild.id] || {};
  
  if (guildConfig.logChannel) {
    try {
      const logChannel = message.guild.channels.cache.get(guildConfig.logChannel);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setColor('#ff9900')
          .setTitle('Mesaj Silindi')
          .addFields(
            { name: 'Kanal', value: message.channel.toString(), inline: true },
            { name: 'Yazar', value: message.author?.tag || 'Bilinmiyor', inline: true },
            { name: 'İçerik', value: message.content?.slice(0, 1000) || 'İçerik yok' }
          )
          .setTimestamp();
        
        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Log hatası:', error);
    }
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) return;
  
  const guildCustomCommands = client.customCommands[message.guild.id] || {};
  const customCmd = guildCustomCommands[message.content.toLowerCase()];
  if (customCmd) {
    return message.reply(customCmd);
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
