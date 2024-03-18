import {Interaction, SlashCommandBuilder} from "discord.js";
import DiscordClient from "./discord-client";

export default interface SlashCommand {
    data: SlashCommandBuilder;
    execute: (discordClient: DiscordClient, interaction: Interaction) => Promise<void>;
}