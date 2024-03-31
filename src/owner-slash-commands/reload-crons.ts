import {SlashCommandBuilder} from "discord.js";
import SlashCommandParams from "../model/slash-command-params";

export default {
    data: new SlashCommandBuilder()
        .setName("reload-crons")
        .setDescription("reload-crons"),
    async execute(params: SlashCommandParams) {
        const interaction = params.interaction;
        const features = params.features;
        if (!interaction.deferred) {
            await interaction.deferReply();
        }
        features.botCronManager.clearExistingCrons();
        await features.botCronManager.setupCrons()
        interaction.editReply({content: 'reloaded'});
    },
};
