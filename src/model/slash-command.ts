import {Interaction, SlashCommandBuilder} from "discord.js";
import DiscordClient from "./discord-client";
import {Repositories} from "./mongo-db-info";

export default interface SlashCommand {
    data: SlashCommandBuilder;
    execute: (discordClient: DiscordClient, repositories: Repositories, interaction: Interaction) => Promise<void>;
}