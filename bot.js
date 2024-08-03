const fs = require('fs');
const dotenv = require('dotenv');
const config = require('./config.json');
dotenv.config();
const { REST, Routes, Client, GatewayIntentBits, EmbedBuilder, MessageActivityType } = require('discord.js');

// Define commands
const commands = [
  {
    name: 'ping',
    description: 'Replies with Pong!',
  },
];

const rest = new REST({ version: '10' }).setToken(config.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands(config.CLIENT_ID), { body: commands });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error reloading application (/) commands:', error);
  }
})();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  const { ActivityType } = require('discord.js');
  client.user.setActivity('you', { type: ActivityType.Watching });
  client.user.setStatus('dnd');
  const newNickname = `rain ${config.botVersion} (${config.prefix})`;
  try {
    const guild = client.guilds.cache.get("1268238059191795794");

    if (guild) {
      const botMember = guild.members.cache.get(client.user.id);

      if (botMember) {
        botMember.setNickname(newNickname);
        console.log(`Nickname changed to "${newNickname}" in guild "${guild.name}".`);
      } else {
        console.error('Bot is not a member of the guild or the member cache is not available.');
      }
    } else {
      console.error('Guild not found.');
    }
  } catch (error) {
    console.error('Error changing nickname:', error);
  }
  setTimeout(() => {
    const WelcomeChannel = client.channels.cache.get("1269249270100398091");
    WelcomeChannel.send(`-----------------\nLogged in as ${client.user.tag}`);
    setTimeout(() => {
      const currentDate = new Date().toLocaleString();
      const WelcomeChannel = client.channels.cache.get("1269249270100398091");
      WelcomeChannel.send(`PREFIX: ${config.prefix}\nDEFAULT PREFIX: ${config.defaultprefix}\nDATE: ${currentDate}`);
      setTimeout(() => {
        const currentDate = new Date().toLocaleString();
        const WelcomeChannel = client.channels.cache.get("1269249270100398091");
        WelcomeChannel.send(`<@${config.OwnerIDs[0]}>`);
      }, 1000);
    }, 1000);
  }, 1000);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong!');
  }
});

client.on('messageCreate', async message => {
  if (message.author.bot) {return;}
  if (config.ban.includes(message.author.id)) {
    if (message.content.startsWith(config.prefix)) {
        message.channel.send("co za debil! <:haha:1269312976595320905> wypierdalaj kurwa.");
        message.member.timeout(60 * 1000)
            .catch(console.error);
    }
    return;
}

  const args = message.content.slice(config.prefix.length).trim().split(' ');
  const command = args.shift().toLowerCase();

  if (command === 'ping') {
    message.channel.send('Pong.');
  } else if (command === 'embedTest') {
    const exampleEmbed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle('Some title')
    .setURL('https://discord.js.org/')
    .setAuthor({ name: 'Some name', iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
    .setDescription('Some description here')
    .setThumbnail('https://i.imgur.com/AfFp7pu.png')
    .addFields(
      { name: 'Regular field title', value: 'Some value here' },
      { name: '\u200B', value: '\u200B' },
      { name: 'Inline field title', value: 'Some value here', inline: true },
      { name: 'Inline field title', value: 'Some value here', inline: true },
    )
    .addFields({ name: 'Inline field title', value: 'Some value here', inline: true })
    .setImage('https://i.imgur.com/AfFp7pu.png')
    .setTimestamp()
    .setFooter({ text: 'Some footer text here', iconURL: 'https://i.imgur.com/AfFp7pu.png' });
  
    message.channel.send({ embeds: [exampleEmbed] });
  } else if (command === 'setprofile') {
    if (config.OwnerIDs.includes(message.author.id)) {
      if (args.length === 1 && (args[0].startsWith("http://") || args[0].startsWith("https://")) && args[0].includes("i.imgur.com/")) {
        try {
          client.user.setAvatar(args[0]);
          message.channel.send("Set avatar to image:" + args[0]);
        } catch (error) {
          message.channel.send(error + "\n\nPlease DM _lostinthought_ (rain) with this error and a screenshot with AT LEAST 3 messages of context.");
        }
      } else {
        message.channel.send("Argument 1 not found or not a valid/supported URL.\nThe only supported URL is i.imgur.com/ as of bot version " + config.botVersion);
      }
    } else {
      message.channel.send("You are not permitted to perform this action.");
    }
  } else if (command === 'setprefix') {
    if (config.OwnerIDs.includes(message.author.id)) {
      if (args.length === 1 && args[0].length <= 5 && args[0].length >= 1) {
        try {
          config.prefix = args[0];

          // Write the updated config to config.json
          fs.writeFileSync('./config.json', JSON.stringify(config, null, 2), 'utf8');

          // Set the bot's nickname in the server where the command was issued
          const newNickname = `rain ${config.botVersion} (${args[0]})`;
          
          if (message.guild) {
            await message.guild.members.me.setNickname(newNickname);
          }

          message.channel.send(`Set prefix to: ${args[0]} and updated nickname to: ${newNickname}`);
        } catch (error) {
          message.channel.send(error + "\n\nPlease inform _lostinthought_ (rain) of this error.");
        }
      } else {
        message.channel.send("Argument 1 not found or not a valid prefix.\nSupported prefix length is between 1 and 5 characters.");
      }
    } else {
      message.channel.send("You are not permitted to perform this action.");
    }
  } else if (command === 'bot/addemoji') {
    if (config.OwnerIDs.includes(message.author.id)) {
      if (args.length < 2) {
        return message.channel.send("Please provide the emoji URL and name.");
      }

      const [emojiUrl, emojiName] = args;

      try {
        const guild = client.guilds.cache.get('1269247041192853504');
        if (!guild) {
          return message.channel.send("Could not find the specified guild.");
        }

        // Create the emoji
        await guild.emojis.create({ attachment: emojiUrl, name: emojiName });
        message.channel.send(`Emoji ${emojiName} added successfully. \nGuildInfo: name="rainEmojis", private`);
      } catch (error) {
        message.channel.send(`Failed to add emoji: ${error.message}`);
      }
    } else {
      message.channel.send("You are not permitted to perform this action.");
    }
  } else if (command === 'eval') {
    if (config.OwnerIDs.includes(message.author.id)) {
      try {
        const code = args.join(' ');
        let result = eval(code);
        if (typeof result !== 'string') result = require('util').inspect(result);
        message.channel.send(`\`\`\`js\n${result}\n\`\`\``);
      } catch (error) {
        message.channel.send(`Error: \`${error.message}\``);
      }
    } else {
      message.channel.send("You are not permitted to perform this action.");
    }
  } else if (command === 'avatar' || command === 'profile' || command === 'pfp') {
    // Get the user mentioned or default to the message author
    const user = message.mentions.users.first() || message.author;

    // Fetch the user's avatar URL
    const avatarUrl = user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });

    // Send the avatar URL in an embed
    const embed = new EmbedBuilder()
    .setTitle(`${user.username}'s pfp`)
    .setImage(avatarUrl)
    .setColor('#0099ff')
    .setFooter({ text: `requested by ${message.author.tag}` });
  
  message.channel.send({ embeds: [embed] });
  } else if (command === 'rollbattle') {
    if (args.length < 1) {
      return message.channel.send("Argument [1] nie znaleziony.");
    }

    const user = message.mentions.users.first();

    if (!user) {
      return message.channel.send("pinguj kogos.");
    }

    const challengerRoll = Math.floor(Math.random() * 100) + 1;
    await message.author.send(`You rolled: ${challengerRoll}`);

    message.channel.send(`<@${user.id}>, debil(ka) chce z toba walczyc, napisz ${config.prefix}rollreply i rozjeb`);

    const filter = response => response.content === config.prefix + 'rollreply' && response.author.id === user.id;
    const collector = message.channel.createMessageCollector({ filter, time: 300000 });

    collector.on('collect', async () => {
      collector.stop();
      const opponentRoll = Math.floor(Math.random() * 100) + 1;
      await user.send(`You rolled: ${opponentRoll}`);

      if (challengerRoll > opponentRoll) {
        message.channel.send(`${message.author.username} wygrywa z ${challengerRoll} przeciwko ${user.username}, co ma ${opponentRoll}! EZ`);
      } else if (challengerRoll < opponentRoll) {
        message.channel.send(`${user.username} wygrywa z ${opponentRoll} przeciwko ${message.author.username}, co ma ${challengerRoll}! EZ`);
      } else {
        message.channel.send(`tyle samo korwa ${challengerRoll}!`);
      }
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        message.channel.send(`<@${user.username}> za wolno! ha! debil(ka) wygrywa!`);
      }
    });
  } else if (command === "code") {
    message.channel.send(`https://github.com/Zakkina-AmongUs/rainbot/blob/main/bot.js -- read the source code for commands`)
  } else if (command == "emoteid") {
    const emoji = message.content.match(/<a?:\w+:(\d+)>/);
    if (emoji) {
      try {
      message.channel.send(`Emoji ID: ${emoji[1]} \n For botscript: \`\`\`${args[0]}\`\`\``);
      } catch (error) {
        message.channel.send(`${error} -- Could not get emoji name.`)
      }
    } else {
      message.channel.send('No valid emoji found in the message.');
    }
  } else if (command === "cmds" || command === "help") {
    const helpEmbed = new EmbedBuilder()
    .setColor(0x009900)
    .setTitle(`${config.prefix}cmds`)
    .setAuthor({ name: 'rain', iconURL: 'https://cdn.discordapp.com/avatars/1260916274804953171/10b924a18043f108a7799584be05d93e.webp?size=1024' })
    .setDescription('All commands <3')
    .setThumbnail('https://cdn.discordapp.com/avatars/1260916274804953171/10b924a18043f108a7799584be05d93e.webp?size=1024')
    .addFields(
      { name: 'Moderation', value: `botban <userID> - Ban someone from the bot. \n botunban - Obvious. \n more when i feel like it` },
      { name: '\u200B', value: '\u200B' },
      { name: 'Games', value: 'rollbattle <user> - test your luck against someone \n guess - soon \n more when i feel like it'},
      { name: 'Other', value: 'emoteid <emotji> - get emote ID of any non-FakeNitro emoji \n \"pfp\" | \"profile\" | \"author\" <user> - get someone\'s profile picture'},
      { name: 'Danger', value: `NORMAL USERS CAN NOT USE THIS!\n\n eval <JavaScript> - run ANY code\n\n \"bot/emojiadd\" <image URL> - add any image as an emoji to the bot's emoji server`}
    )
    
    message.channel.send({ embeds: [helpEmbed] });
    message.channel.send(`This could be inaccurate -- it is a very early version that i may forget to update! \n Use \"${config.prefix}code\" for the source code (always has the latest commands)`)
  } else if (command === "guess") {
    const path = "./data.json";
    let data;

    // Check if the file exists
    if (fs.existsSync(path)) {
        // If it exists, read and parse the file
        data = JSON.parse(fs.readFileSync(path, 'utf8'));
    } else {
        // If it doesn't exist, initialize with an empty structure
        data = { Data: {} };
    }

    // Ensure the necessary structure exists
    if (!data.Data[message.author.id]) {
        data.Data[message.author.id] = { "RandomNumber": -1 };
    } if (!data.Data[message.author.id]["RandomNumber"]) {
        data.Data[message.author.id]["RandomNumber"] = -1;
    }
    if (!data.Data[message.author.id]["MaxNumber"]) {
      data.Data[message.author.id]["MaxNumber"] = 99;
   }
   if (!data.Data[message.author.id]["Guesses"]) {
    data.Data[message.author.id]["Guesses"] = -1;
 }
 if (!data.Data[message.author.id]["LastWasRight"]) {
  data.Data[message.author.id]["LastWasRight"] = false;
}
if (!data.Data[message.author.id]["streak"]) {
  data.Data[message.author.id]["streak"] = 0;
}
fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
   let guesses;
    let maxNumber;
    let lastWasRight;
    data.Data[message.author.id]["MaxNumber"] = 99 * (data.Data[message.author.id]["streak"] + 1)
    lastWasRight = data.Data[message.author.id]["LastWasRight"]
    maxNumber = data.Data[message.author.id]["MaxNumber"]
    // Assign a random number
    if (data.Data[message.author.id]["RandomNumber"] <= 0) {
      console.log(`${message.author.tag} ${JSON.stringify(data.Data[message.author.id])}`);
      data.Data[message.author.id]["RandomNumber"] = Math.round(Math.random() * 99);
      fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
      message.channel.send(`Welcome! Type ${config.prefix}guess <number> to, well, try to guess a number! The first number is between 0 and 99, and the higher your streak the higher the number will be!`)
      return;
    }
    if (lastWasRight) {
      console.log(`${message.author.tag} ${JSON.stringify(data.Data[message.author.id])}`);
      data.Data[message.author.id]["RandomNumber"] = Math.round(Math.random() * maxNumber);
    }
    if (args[0] === data.Data[message.author.id]["RandomNumber"]) {
      let difficulty;
      let streak;
      streak = data.Data[message.author.id]["streak"]
      difficulty = Math.max(1, ((streak / 2)^1.15)*8)
      message.channel.send("you got it right. ok cool. next number is between 0 and " + (maxNumber+maxNumber))
      data.Data[message.author.id]["MaxNumber"] = maxNumber + maxNumber
      maxNumber = data.Data[message.author.id]["MaxNumber"]
      data.Data[message.author.id]["LastWasRight"] = true
      data.Data[message.author.id]["streak"] += 1
      data.Data[message.author.id]["guesses"] = Math.max(6, ((difficulty * 1.07) / 3) * 5)
    } else {
      console.log()
         data.Data[message.author.id]["guesses"] -= 1
         if (data.Data[message.author.id]["guesses"] <= 0) {
          let difficulty;
          let streak;
          streak = data.Data[message.author.id]["streak"]
          message.channel.send("you fucked up. cool. anyway, restart. 0-99, you get the point")
          data.Data[message.author.id]["MaxNumber"] = 99
          maxNumber = data.Data[message.author.id]["MaxNumber"]
          data.Data[message.author.id]["LastWasRight"] = false
          data.Data[message.author.id]["streak"] = 0
          difficulty = Math.max(1, ((streak / 2)^1.15)*8)
          data.Data[message.author.id]["guesses"] = Math.max(6, ((difficulty * 1.07) / 3) * 5)
          data.Data[message.author.id]["RandomNumber"] = Math.round(Math.random() * 99)
          return
         }
         if (args[0] > data.Data[message.author.id]["RandomNumber"]) {
          message.channel.send("a little too high there bud, try again")
         } else {
          message.channel.send("nope. go higher")
         }
      }
      fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
    }
});

// Separate event listener for botban and botunban commands
client.on('messageCreate', async message => {
  try {
  if (message.author.bot) return;
  if (!message.content.startsWith(config.prefix)) return;
  const args = message.content.slice(config.prefix.length).trim().split(' ');
  const command = args.shift().toLowerCase();
  if (command === 'botban') {
    if (config.OwnerIDs.includes(message.author.id)) {
      const userId = args[0];
      if (!userId) {
        return message.channel.send("Please provide a user ID to ban.");
      }
      if (!config.ban) {
        config.ban = [];
      }
      if (!config.ban.includes(userId)) {
        config.ban.push(userId);
        fs.writeFileSync('./config.json', JSON.stringify(config, null, 2), 'utf8');
        message.channel.send(`User ID ${userId} has been banned from using the bot. <:shwdow:1269277537910001797>`);
      } else {
        message.channel.send(`User ID ${userId} is already banned.`);
      }
    } else {
      message.channel.send("You are not permitted to perform this action.");
    }
  } else if (command === 'botunban') {
    if (config.OwnerIDs.includes(message.author.id)) {
      const userId = args[0];
      if (!userId) {
        return message.channel.send("Please provide a user ID to unban.");
      }
      if (config.ban && config.ban.includes(userId)) {
        config.ban = config.ban.filter(id => id !== userId);
        fs.writeFileSync('./config.json', JSON.stringify(config, null, 2), 'utf8');
        message.channel.send(`User ID ${userId} has been unbanned from using the bot. <:rain:1269277891485761651>`);
      } else {
        message.channel.send(`User ID ${userId} is not banned.`);
      }
    } else {
      message.channel.send("You are not permitted to perform this action.");
    }
  }
  } catch {
    message.channel.send(`${error}\n\nSomething went wrong. Context: ${message.content}\n\n <@1260916274804953171>`)
  }
});

client.login(config.DISCORD_TOKEN);
