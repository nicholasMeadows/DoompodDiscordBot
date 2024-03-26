import {Interaction, SlashCommandBuilder} from "discord.js";
import DiscordClient from "./discord-client";
import {Repositories} from "./mongo-db-info";
import FeatureClassesObj from "./feature-classes-obj";

export default interface SlashCommand {
    data: SlashCommandBuilder;
    execute: (discordClient: DiscordClient, features: FeatureClassesObj, repositories: Repositories, interaction: Interaction) => Promise<void>;
}