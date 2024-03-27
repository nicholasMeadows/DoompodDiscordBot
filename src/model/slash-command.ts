import {SlashCommandBuilder} from "discord.js";
import SlashCommandParams from "./slash-command-params";

export default interface SlashCommand {
    data: SlashCommandBuilder;
    execute: (params: SlashCommandParams) => Promise<void>;
}