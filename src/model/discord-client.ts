import {Client, Collection} from "discord.js";
import SlashCommand from "./slash-command";

export default class DiscordClient extends Client {
    declare commands: Collection<string, SlashCommand>;
}