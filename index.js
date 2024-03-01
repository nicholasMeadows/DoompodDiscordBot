const fs = require("node:fs");
const path = require("node:path");
// Require the necessary discord.js classes
const {
    Client,
    Collection,
    Events,
    GatewayIntentBits,
    Partials
} = require("discord.js");
const {token} = require("./config.json");
const SucketTrainMonitor = require("./feature/sucklet-train-monitor");
const ReactionHallOfDoot = require("./feature/reaction-hall-of-doot.js");
const cron = require('node-cron');
const {
    DOOMPOD_GUILD_ID,
    DOOMPOD_SUCKLET_CHANNEL_ID,
    DOOMPOD_SUCKLET_STICKER_ID,
    DOOMPOD_HALL_OF_DOOT_CHANNEL_ID,
    DOOMPOD_CHANNEL_ID
} = require("./constants");

// Create a new client instance
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.commands = new Collection();
const foldersPath = path.join(__dirname, "slash-commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((file) => file.endsWith(".js"));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ("data" in command && "execute" in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(
                `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
            );
        }
    }
}

const sendDoompodSucket = () => {
    console.log('sending sucklet to doompod');
    client.guilds.fetch(DOOMPOD_GUILD_ID).then(guild => {
        guild.channels.fetch(DOOMPOD_SUCKLET_CHANNEL_ID).then(channel => {
            if (channel != null) {
                const sticker = guild.stickers.cache.get(DOOMPOD_SUCKLET_STICKER_ID)
                channel.send({stickers: [sticker]})
            }
        });
    })
}

const sendFilesToChannel = (guildId, channelId, filePathArray) => {
    console.log(`sending files ${filePathArray} to guild ${guildId} and channel ${channelId}`);
    client.guilds.fetch(guildId).then(guild => {
        guild.channels.fetch(channelId).then(channel => {
            if (channel != null) {
                channel.send({
                    files: filePathArray
                })
            }
        });
    })
}

//initialize feature classes
const reactionHallOfDoot = new ReactionHallOfDoot(client);
const suckletTrainMonitor = new SucketTrainMonitor(client);

let doompodSucketSchedule;
let itsFridayInCaliforniaSchedule;
let ladiesAndGentlemenTheWeekendSchedule;
// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    if (doompodSucketSchedule !== undefined) {
        doompodSucketSchedule.stop();
    }
    doompodSucketSchedule = cron.schedule('0 08 * * *', sendDoompodSucket);

    if(itsFridayInCaliforniaSchedule !== undefined) {
        itsFridayInCaliforniaSchedule.stop();
    }
    itsFridayInCaliforniaSchedule = cron.schedule("0 9 * * 5", () => {
        sendFilesToChannel(DOOMPOD_GUILD_ID, DOOMPOD_CHANNEL_ID, ["./videos/Today is Friday in California.mp4"])
    })

    if(ladiesAndGentlemenTheWeekendSchedule !== undefined) {
        ladiesAndGentlemenTheWeekendSchedule.stop();
    }
    ladiesAndGentlemenTheWeekendSchedule = cron.schedule("0 5 * * 5", () => {
        sendFilesToChannel(DOOMPOD_GUILD_ID, DOOMPOD_CHANNEL_ID, ["./videos/ladies and gentlemen the weekend.mp4"])
    })
});

// Log in to Discord with your client's token
client.login(token);

client.on(Events.MessageCreate, (message) => {
    if (message.author.bot) return;
    suckletTrainMonitor.handle(message);
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: "There was an error while executing this command!",
                ephemeral: true,
            });
        } else {
            await interaction.reply({
                content: "There was an error while executing this command!",
                ephemeral: true,
            });
        }
    }
});

client.on(Events.MessageReactionAdd, async (interaction) => {
    const message = interaction.message;
    const guildId = message.guildId;
    const channelId = message.channelId;
    const messageId = message.id;
    const messageCreatedTimestamp = message.createdTimestamp;
    reactionHallOfDoot.handle(guildId, channelId, messageId, messageCreatedTimestamp);
});