import {SlashCommandBuilder} from "discord.js";
import SlashCommandParams from "../../model/slash-command-params";

export default {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Replies with Pong!"),
    async execute(params: SlashCommandParams) {
        const interaction = params.interaction;
        await interaction.reply("Pong!");
    },
};
