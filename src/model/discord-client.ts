import {Client, Collection} from "discord.js";
import SlashCommand from "./slash-command";

export default class DiscordClient extends Client {
    declare appCommands: Collection<string, SlashCommand>;
    declare ownerCommands: Collection<string, SlashCommand>;
}