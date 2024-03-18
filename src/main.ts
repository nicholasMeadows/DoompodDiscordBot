import path from "node:path";
import fs from "node:fs";
import DiscordClient from "./model/discord-client";
import {Collection, Events, GatewayIntentBits, Partials, REST, Routes} from "discord.js";
import SlashCommand from "./model/slash-command";

import {Sequelize} from 'sequelize-typescript';
import Guild from "./entity/guild";
import Channel from "./entity/channel";
import Cron from "./entity/cron";
import Sticker from "./entity/sticker";
import BotAsset from "./entity/bot-asset";
import CronSticker from "./entity/cron-sticker";
import CronBotAsset from "./entity/cron-bot-asset";
import BotCron from "./feature/bot-cron";
import CronAction from "./model/enum/cron-action";
import BotAssetType from "./model/enum/bot-asset-type";
import AutoReply from "./entity/auto-reply";
import AutoReplyTrigger from "./model/enum/auto-reply-trigger";
import AutoReplyFeature from "./feature/auto-reply-feature";
import AutoReplySticker from "./entity/auto-reply-sticker";
import MessageReaction from "./entity/message-reaction";
import AutoReplyMessageReaction from "./entity/auto-reply-message-reaction";
import HallOfDootFeature from "./feature/hall-of-doot-feature";
import HallOfDootConfig from "./entity/hall-of-doot-config";
import Config from "./model/config";
import FeatureClassesObj from "./model/feature-classes-obj";
import MinecraftReference from "./entity/minecraft-reference";
import MinecraftReferenceFeature from "./feature/minecraft-reference-feature";
import UserWalkLoggingRepository from "./repository/user-walk-logging-repository";
import AutoReplyBotAsset from "./entity/auto-reply-bot-asset";

class DoomBot {
    async startDoomBot() {
        const config = this.loadConfig();
        const sequelize = await this.initializeDatabase(config);

        if (process.env.DEV_MODE) {
            await this.loadDevDBData(sequelize)
        }

        // Create a new client instance
        const client = new DiscordClient({
            intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions],
            partials: [Partials.Message, Partials.Channel, Partials.Reaction]
        });

        const featureClasses = this.initializeFeatureClasses(client);

        this.setupDiscordClientEventListeners(client, featureClasses);

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
        const databaseName = this.checkForConfigValue(config, "databaseName", "DB_NAME");
        const schemaName = this.checkForConfigValue(config, "schemaName", "SCHEMA_NAME");
        const dbUser = this.checkForConfigValue(config, "dbUser", "DB_USER");
        const dbPassword = this.checkForConfigValue(config, "dbPassword", "DB_PASSWORD");
        const dbHost = this.checkForConfigValue(config, "dbHost", "DB_HOST");
        return new Config(token, clientId, databaseName, schemaName, dbUser, dbPassword, dbHost);
    }

    checkForConfigValue(config: any, jsonKey: string, envKey: string) {
        const envValue = process.env[envKey];
        if (envValue === undefined) {
            if (config === undefined) {
                console.log(`Required key ${envKey} not found environment file and config.json not found.`)
                process.exit(1);
            }
            if (Object.keys(config).includes(jsonKey)) {
                return config[jsonKey];
            }
            console.log(`Required key ${envKey} not found environment file and required key ${jsonKey} not found in config.json`)
            process.exit(1);
        }
        return envValue;
    }

    initializeDatabase(config: Config): Promise<Sequelize> {
        return new Promise(async (resolve) => {
            const sequelize = new Sequelize({
                logging: false,
                dialect: 'postgres',
                username: config.dbUser,
                password: config.dbPassword,
                host: config.dbHost,
                database: config.databaseName,
                schema: config.schemaName,
                models: [__dirname + '/entity'], // or [Player, Team],
            });
            const schemas = await sequelize.showAllSchemas({logging: false});
            const foundSchema = schemas.find(schema => schema.toString() === config.schemaName);
            if (foundSchema === undefined) {
                await sequelize.createSchema(config.schemaName, {logging: false});
            }

            await sequelize.sync({alter: true});
            resolve(sequelize);
        })
    }

    initializeFeatureClasses(client: DiscordClient): FeatureClassesObj {
        return {
            botCron: new BotCron(client),
            autoReplyFeature: new AutoReplyFeature(client),
            hallOfDootFeature: new HallOfDootFeature(client),
            minecraftReferenceFeature: new MinecraftReferenceFeature(client)
        }
    }

    setupDiscordClientEventListeners(client: DiscordClient, featureClasses: FeatureClassesObj) {
        client.once(Events.ClientReady, (readyClient) => {
            console.log(`Ready! Logged in as ${readyClient.user.tag}`);
            featureClasses.botCron.setupCrons();
        });
        client.on(Events.MessageCreate, (message) => {
            if (message.author.bot) return;
            featureClasses.autoReplyFeature.handle({message: message});
            featureClasses.minecraftReferenceFeature.handle(message);
        });
        client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isChatInputCommand()) return;
            const command = client.commands.get(interaction.commandName);
            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }
            try {
                await command.execute(client, interaction);
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
            featureClasses.autoReplyFeature.handle({messageReaction: interaction});
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
                        console.log(
                            `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
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
            console.log(
                `Started refreshing ${commands.length} application (/) commands.`
            );

            // The put method is used to fully refresh all commands in the guild with the current set
            const data = await rest.put(Routes.applicationCommands(config.clientId), {
                body: commands,
            });

            // console.log(
            //     `Successfully reloaded ${data.length} application (/) commands.`
            // );
            console.log(
                `Successfully reloaded application (/) commands.`
            );
        } catch (error) {
            // And of course, make sure you catch and log any errors!
            console.error(error);
        }
    }

    async loadDevDBData(sequelize: Sequelize) {
        await sequelize.sync({force: true});
        // await sequelize.sync();
        let guild = new Guild();
        guild.name = "Fluffys Server"
        guild.discordId = "107567358805032960";
        guild = await guild.save();

        let guild2 = new Guild();
        guild2.name = "doompod"
        guild2.discordId = "1143928433093652570";
        guild2 = await guild2.save();

        let channel = new Channel();
        channel.discordId = "892035491506028604";
        channel.guildId = guild.id;
        channel = await channel.save();

        let channel2 = new Channel();
        channel2.discordId = "1143928433596960870";
        channel2.guildId = guild2.id;
        channel2 = await channel2.save();

        let channel3 = new Channel();
        channel3.discordId = "1143937189399511080";
        channel3.guildId = guild2.id;
        channel3 = await channel3.save();

        let cron1 = new Cron();
        cron1.name = "Doompod Sucklet";
        cron1.schedule = "0 08 * * *";
        cron1.action = CronAction.SEND_STICKER;
        cron1.guildId = guild.id;
        cron1.channelId = channel.id;

        let cron2 = new Cron();
        cron2.name = "Its Friday In California";
        cron2.schedule = "0 9 * * 5";
        cron2.action = CronAction.SEND_MEDIA;
        cron2.guildId = guild.id;
        cron2.channelId = channel.id;

        let cron3 = new Cron();
        cron3.name = "Ladies And Gentleman The Weekend";
        cron3.schedule = "0 17 * * 5";
        cron3.action = CronAction.SEND_MEDIA;
        cron3.guildId = guild.id;
        cron3.channelId = channel.id;

        let cron4 = new Cron();
        cron4.name = "its Wednesday My Dudes";
        cron4.schedule = "0 9 * * 3";
        cron4.action = CronAction.SEND_MEDIA;
        cron4.guildId = guild.id;
        cron4.channelId = channel.id;

        cron1 = await cron1.save();
        cron2 = await cron2.save();
        cron3 = await cron3.save();
        cron4 = await cron4.save();


        let sticker = new Sticker();
        sticker.stickerId = "1190511964535914617"
        sticker.guildId = guild.id;
        sticker = await sticker.save()


        let asset1 = new BotAsset();
        asset1.assetType = BotAssetType.AUDIO;
        asset1.path = "./assets/audio/bonk.mp3";

        let asset2 = new BotAsset();
        asset2.assetType = BotAssetType.IMAGE;
        asset2.path = "./assets/image/doompod-hug1-2023.gif";

        let asset3 = new BotAsset();
        asset3.assetType = BotAssetType.IMAGE;
        asset3.path = "./assets/image/doompod-hug2-2023.gif";

        let asset4 = new BotAsset();
        asset4.assetType = BotAssetType.IMAGE;
        asset4.path = "./assets/image/doompod-katie-letsgo-2023.gif";

        let asset5 = new BotAsset();
        asset5.assetType = BotAssetType.IMAGE;
        asset5.path = "./assets/image/doompod-trishake-2023.gif";

        let asset6 = new BotAsset();
        asset6.assetType = BotAssetType.IMAGE;
        asset6.path = "./assets/image/random-actually-reply.gif";

        let asset7 = new BotAsset();
        asset7.assetType = BotAssetType.VIDEO;
        asset7.path = "./assets/video/It Is Wednesday My Dudes.mp4";

        let asset8 = new BotAsset();
        asset8.assetType = BotAssetType.VIDEO;
        asset8.path = "./assets/video/ladies and gentlemen the weekend.mp4";

        let asset9 = new BotAsset();
        asset9.assetType = BotAssetType.VIDEO;
        asset9.path = "./assets/video/Today is Friday in California.mp4";

        asset1 = await asset1.save();
        asset2 = await asset2.save();
        asset3 = await asset3.save();
        asset4 = await asset4.save();
        asset5 = await asset5.save();
        asset6 = await asset6.save();
        asset7 = await asset7.save();
        asset8 = await asset8.save();
        asset9 = await asset9.save();


        let cronSticker = new CronSticker();
        cronSticker.stickerId = sticker.id;
        cronSticker.cronId = cron1.id;
        cronSticker = await cronSticker.save();

        let cronBotAsset1 = new CronBotAsset();
        cronBotAsset1.botAssetId = asset9.id;
        cronBotAsset1.cronId = cron2.id;
        cronBotAsset1 = await cronBotAsset1.save();

        let cronBotAsset2 = new CronBotAsset();
        cronBotAsset2.botAssetId = asset8.id;
        cronBotAsset2.cronId = cron3.id;
        cronBotAsset2 = await cronBotAsset2.save();

        let cronBotAsset3 = new CronBotAsset();
        cronBotAsset3.botAssetId = asset7.id;
        cronBotAsset3.cronId = cron4.id;
        cronBotAsset3 = await cronBotAsset3.save();

        let autoReply1 = new AutoReply();
        autoReply1.name = "Random Actually";
        autoReply1.replyChancePercentage = 100;
        autoReply1.triggerType = AutoReplyTrigger.MESSAGE_CONTENT;
        autoReply1.triggerTerms = "Actually";
        autoReply1.guildId = guild.id;
        autoReply1.replyWithText = "Hello"
        autoReply1 = await autoReply1.save();

        let autoReplyBotAsset = new AutoReplyBotAsset();
        autoReplyBotAsset.autoReplyId = autoReply1.id;
        autoReplyBotAsset.botAssetId = asset6.id;
        autoReplyBotAsset = await autoReplyBotAsset.save();

        let autoReplyStickers = new AutoReplySticker();
        autoReplyStickers.autoReplyId = autoReply1.id;
        autoReplyStickers.stickerId = sticker.id;
        autoReplyStickers = await autoReplyStickers.save()


        let autoReply2 = new AutoReply();
        autoReply2.name = "Bonk";
        autoReply2.replyChancePercentage = 100;
        autoReply2.triggerType = AutoReplyTrigger.MESSAGE_REACTION;
        autoReply2.guildId = guild.id;
        autoReply2 = await autoReply2.save();

        let autoReplyBotAsset1 = new AutoReplyBotAsset();
        autoReplyBotAsset1.autoReplyId = autoReply2.id;
        autoReplyBotAsset1.botAssetId = asset1.id;
        autoReplyBotAsset1 = await autoReplyBotAsset1.save();


        let messageReaction = new MessageReaction();
        messageReaction.reactionName = '🔨';
        messageReaction = await messageReaction.save();

        let autoReplyMessageReaction = new AutoReplyMessageReaction();
        autoReplyMessageReaction.autoReplyId = autoReply2.id;
        autoReplyMessageReaction.messageReactionId = messageReaction.id;
        autoReplyMessageReaction.reactionsToTriggerReply = 1;
        autoReplyMessageReaction = await autoReplyMessageReaction.save();


        let hallOfDootConfig = new HallOfDootConfig();
        hallOfDootConfig.guildId = guild.id;
        hallOfDootConfig.hallOfDootChannelId = channel.id;
        hallOfDootConfig.useCumulativeReactionCount = true;
        hallOfDootConfig.requiredReactionCount = 5;
        hallOfDootConfig = await hallOfDootConfig.save();
    }
}

new DoomBot().startDoomBot();