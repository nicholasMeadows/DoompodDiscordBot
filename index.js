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
const ConfigService = require('./service/config-service');
const SucketTrainMonitor = require("./feature/sucklet-train-monitor");
const ReactionHallOfDoot = require("./feature/reaction-hall-of-doot.js");
const BonkSoundHammerReaction = require("./feature/bonk-sound-hammer-reaction");
const RandomActuallyReply = require('./feature/random-actually-reply');

const BotCron = require("./feature/bot-cron");

const GuildRepository = require('./repository/guild-repository')
const ChannelRepository = require('./repository/channel-repository');
const MessageRepository = require('./repository/message-repository')
const CronRepository = require('./repository/cron-repository');
const EntityCreation = require('./repository/entity-creation')
const {CONFIG_FILE} = require("./constants");

if (!fs.existsSync(CONFIG_FILE)) {
    console.log(`${CONFIG_FILE} not found`)
    process.exit(1);
}
const configService = new ConfigService();
const readConfigFromFileAndUpdateConfigService = () => {
    const configFileContent = fs.readFileSync(CONFIG_FILE, "utf-8");
    configService.loadUpdatedConfig(JSON.parse(configFileContent));

}
readConfigFromFileAndUpdateConfigService();

const checkDatabase = () => {
    const databaseFile = configService.getDatabaseFile();
    if (!fs.existsSync(databaseFile)) {
        fs.writeFileSync(databaseFile, '');
    }
    let dbFileContent = fs.readFileSync(databaseFile, 'utf-8');

    let dbJson;
    if (dbFileContent === undefined || dbFileContent.trim() === '') {
        const initialDB = {
            guilds:[],
            channels:[],
            messages:[]
        }
        dbFileContent = JSON.stringify(initialDB)
    }
    dbJson = JSON.parse(dbFileContent);
    if (dbJson.guilds === undefined) {
        dbJson.guilds = [];
    }
    if(dbJson.channels === undefined) {
        dbJson.channels = [];
    }
    if(dbJson.messages === undefined) {
        dbJson.messages = [];
    }

    if(dbJson.crons === undefined) {
        dbJson.crons = [];
    }
    fs.writeFileSync(databaseFile, JSON.stringify(dbJson));
}
checkDatabase();
const guildRepository = new GuildRepository(configService);
const channelRepository = new ChannelRepository(configService);
const messageRepository = new MessageRepository(configService);
const cronRepository = new CronRepository(configService);
EntityCreation.guildRepository = guildRepository;
EntityCreation.channelRepository = channelRepository;
EntityCreation.messageRepository = messageRepository;

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

//initialize feature classes
const reactionHallOfDoot = new ReactionHallOfDoot(client, guildRepository, messageRepository);
const suckletTrainMonitor = new SucketTrainMonitor(client);
const bonkSoundHammerReaction = new BonkSoundHammerReaction(guildRepository, messageRepository);
const randomActuallyReply = new RandomActuallyReply(configService);

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    const cronEntities = cronRepository.findAllCrons();
    cronEntities.forEach((cronEntity) => {
        new BotCron(client, cronEntity);
    })
});

// Log in to Discord with your client's token
client.login(configService.getToken());

client.on(Events.MessageCreate, (message) => {
    if (message.author.bot) return;
    suckletTrainMonitor.handle(message);
    randomActuallyReply.handle(message);
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
    reactionHallOfDoot.handle(interaction);
    bonkSoundHammerReaction.handle(interaction._emoji.name, message);
});