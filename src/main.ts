import path from "node:path";
import fs from "node:fs";
import DiscordClient from "./model/discord-client";
import {Collection, Events, GatewayIntentBits, Partials, REST, Routes} from "discord.js";
import SlashCommand from "./model/slash-command";
import Config from "./model/config";
import FeatureClassesObj from "./model/feature-classes-obj";
import {MongoClient} from "mongodb";
import BotCronManager from "./feature/bot-cron-manager";
import MongoDbInfo, {Repositories} from "./model/mongo-db-info";
import HallOfDootFeature from "./feature/hall-of-doot-feature";
import AutoReplyFeature from "./feature/auto-reply-feature";
import Guild from "./entity/guild";
import {
    MONGO_BOT_ASSET_COLLECTION_NAME,
    MONGO_CRON_SCHEDULE_COLLECTION_NAME,
    MONGO_GUILD_CHANNEL_MESSAGE_COLLECTION_NAME,
    MONGO_GUILD_STICKER_COLLECTION_NAME
} from "./constants";
import BotAsset from "./entity/bot-asset";
import BotAssetRepository from "./repository/bot-asset-repository";
import CronSchedule from "./entity/cron-schedule";
import CronScheduleRepository from "./repository/cron-schedule-repository";
import Sticker from "./entity/sticker";
import GuildStickerRepository from "./repository/guild-sticker-repository";
import LoadDevData from "./load-dev-data";
import MinecraftReferenceFeature from "./feature/minecraft-reference-feature";
import ChannelRepository from "./repository/channel-repository";
import MessageRepository from "./repository/message-repository";
import WalkLogRepository from "./repository/walk-log-repository";
import {MinecraftReferenceRepository} from "./repository/minecraft-reference-repository";
import UserRepository from "./repository/user-repository";
import GuildRepository from "./repository/guild-repository";
import Log from "./log";
import LogLevel from "./model/enum/log-level";

class DoomBot {
    private logger = new Log(this);

    async startDoomBot() {
        const config = this.loadConfig();
        const mongoDbInfo = await this.initializeDatabase(config);


        if (process.env.DEV_MODE) {
            const loadDevData = new LoadDevData(mongoDbInfo);
            await loadDevData.loadDevData();
        }

        // Create a new client instance
        const client = new DiscordClient({
            intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions],
            partials: [Partials.Message, Partials.Channel, Partials.Reaction]
        });

        const featureClasses = this.initializeFeatureClasses(client, mongoDbInfo);

        this.setupDiscordClientEventListeners(client, featureClasses, mongoDbInfo.repositories);

        client.commands = await this.loadSlashCommands();

        // this.deploySlashCommands(client.commands, config);
        // if (process.env.DEPLOY_SLASH_COMMANDS) {
        //     this.deploySlashCommands(client.commands, config);
        // }
        // Log in to Discord with your client's token
        await client.login(config.token);
    }

    loadConfig(): Config {

        const configPath = "./config.json";
        let config: any;
        if (fs.existsSync(configPath)) {
            const configFileContent = fs.readFileSync(configPath, "utf-8");
            config = JSON.parse(configFileContent);
        }

        const token = this.checkForConfigValue(config, "token", "TOKEN");
        const clientId = this.checkForConfigValue(config, "clientId", "CLIENT_ID");
        const dbName = this.checkForConfigValue(config, "dbName", "DB_NAME")
        const dbUsername = this.checkForConfigValue(config, "dbUsername", "DB_USERNAME")
        const dbPassword = this.checkForConfigValue(config, "dbPassword", "DB_PASSWORD")
        const dbPort = this.checkForConfigValue(config, "dbPort", "DB_PORT")
        const dbHost = this.checkForConfigValue(config, "dbHost", "DB_HOST")
        let logLevel = this.checkForConfigValue(config, "logLevel", "LOG_LEVEL", false);
        if (logLevel === undefined || !(logLevel in LogLevel)) {
            logLevel = LogLevel.INFO;
        }
        Log.LOG_LEVEL = logLevel

        return new Config(token, clientId, dbName, dbUsername, dbPassword, dbPort, dbHost);
    }

    checkForConfigValue(config: any, jsonKey: string, envKey: string, required = true) {
        const envValue = process.env[envKey];
        if (envValue !== undefined) {
            return envValue;
        }
        if (config !== undefined && Object.keys(config).includes(jsonKey)) {
            return config[jsonKey];
        }
        this.logger.info(`${required ? 'Required' : ''} key ${envKey} not found environment file and config.json not found.`)
        if (required) {
            process.exit(1);
        }
    }

    initializeDatabase(config: Config): Promise<MongoDbInfo> {
        return new Promise(async (resolve) => {

            const connectionString = `mongodb://${config.dbUsername}:${config.dbPassword}@${config.dbHost}:${config.dbPort}`
            const client = await MongoClient.connect(connectionString);
            const db = client.db(config.dbName)

            const guildChannelMessageCollection = db.collection<Guild>(MONGO_GUILD_CHANNEL_MESSAGE_COLLECTION_NAME);
            const guildRepository = new GuildRepository(guildChannelMessageCollection);
            const channelRepository = new ChannelRepository(guildChannelMessageCollection);
            const messageRepository = new MessageRepository(guildChannelMessageCollection);
            const walkLogRepository = new WalkLogRepository(guildChannelMessageCollection);
            const minecraftReferenceRepository = new MinecraftReferenceRepository(guildChannelMessageCollection);
            const userRepository = new UserRepository(guildChannelMessageCollection);

            const botAssetCollection = db.collection<BotAsset>(MONGO_BOT_ASSET_COLLECTION_NAME);
            const botAssetRepository = new BotAssetRepository(botAssetCollection);

            const cronScheduleCollection = db.collection<CronSchedule>(MONGO_CRON_SCHEDULE_COLLECTION_NAME);
            const cronScheduleRepository = new CronScheduleRepository(cronScheduleCollection);

            const guildStickerCollection = db.collection<Sticker>(MONGO_GUILD_STICKER_COLLECTION_NAME)
            const guildStickerRepository = new GuildStickerRepository(guildStickerCollection);

            const dbObj: MongoDbInfo = {
                mongoClient: client,
                db: db,
                repositories: {
                    guildRepository: guildRepository,
                    channelRepository: channelRepository,
                    messageRepository: messageRepository,
                    guildStickerRepository: guildStickerRepository,
                    botAssetRepository: botAssetRepository,
                    cronScheduleRepository: cronScheduleRepository,
                    walkLogRepository: walkLogRepository,
                    minecraftReferenceRepository: minecraftReferenceRepository,
                    userRepository: userRepository
                }
            }
            resolve(dbObj);
        });
    }

    initializeFeatureClasses(client: DiscordClient, mongoDbInfo: MongoDbInfo): FeatureClassesObj {
        const repositories = mongoDbInfo.repositories;
        return {
            botCronManager: new BotCronManager(client, repositories),
            autoReplyFeature: new AutoReplyFeature(repositories),
            hallOfDootFeature: new HallOfDootFeature(client, repositories),
            minecraftReferenceFeature: new MinecraftReferenceFeature(client, repositories)
        }
    }

    setupDiscordClientEventListeners(client: DiscordClient, featureClasses: FeatureClassesObj, repositories: Repositories) {
        client.once(Events.ClientReady, (readyClient) => {
            this.logger.info(`Ready! Logged in as ${readyClient.user.tag}`);
            featureClasses.botCronManager.setupCrons();
        });
        client.on(Events.MessageCreate, (message) => {
            if (message.author.bot) return;
            featureClasses.autoReplyFeature.handleMessageCreate(message);
            featureClasses.minecraftReferenceFeature.handle(message);
        });
        client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isChatInputCommand()) return;
            const command = client.commands.get(interaction.commandName);
            if (!command) {
                this.logger.warn(`No command matching ${interaction.commandName} was found.`);
                return;
            }
            try {
                await command.execute(client, repositories, interaction);
            } catch (error) {
                this.logger.error(error)
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
            featureClasses.autoReplyFeature.handleMessageReactionAdd(interaction);
            featureClasses.hallOfDootFeature.handleOnReactionAdd(interaction)
        });
    }

    loadSlashCommands(): Promise<Collection<string, SlashCommand>> {
        return new Promise(async (resolve) => {

            const commands = new Collection<string, SlashCommand>();
            const foldersPath = path.join(__dirname, "slash-commands");
            const commandFolders = fs.readdirSync(foldersPath);
            for (const folder of commandFolders) {
                const commandsPath = path.join(foldersPath, folder);
                const commandFiles = fs
                    .readdirSync(commandsPath)
                    .filter((file) => file.endsWith(".js"));
                for (const file of commandFiles) {
                    const filePath = path.join(commandsPath, file);
                    const command = (await import(filePath)).default;
                    // Set a new item in the Collection with the key as the command name and the value as the exported module
                    if ("data" in command && "execute" in command) {
                        const slashCommand = command as SlashCommand;
                        commands.set(slashCommand.data.name, slashCommand);
                    } else {
                        this.logger.warn(
                            `The command at ${filePath} is missing a required "data" or "execute" property.`
                        );
                    }
                }
            }
            resolve(commands);
        })
    }

    async deploySlashCommands(slashCommands: Collection<string, SlashCommand>, config: Config) {

        const commands = slashCommands.map((slashCommand, name) => {
            return slashCommand.data.toJSON();
        })
        // Construct and prepare an instance of the REST module
        const rest = new REST().setToken(config.token);

        // and deploy your commands!
        try {
            this.logger.info(
                `Started refreshing ${commands.length} application (/) commands.`
            );

            // The put method is used to fully refresh all commands in the guild with the current set
            const data = await rest.put(Routes.applicationCommands(config.clientId), {
                body: commands,
            });

            this.logger.info(
                `Successfully reloaded application (/) commands.`
            );
        } catch (error) {
            // And of course, make sure you catch and log any errors!
            this.logger.error(error);
        }
    }
}

new DoomBot().startDoomBot();