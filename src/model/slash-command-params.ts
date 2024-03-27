import DiscordClient from "./discord-client";
import FeatureClassesObj from "./feature-classes-obj";
import {Repositories} from "./mongo-db-info";
import {ChatInputCommandInteraction} from "discord.js";

export default interface SlashCommandParams {
    discordClient: DiscordClient;
    features: FeatureClassesObj;
    repositories: Repositories;
    interaction: ChatInputCommandInteraction;
}