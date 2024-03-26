import {ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";
import DiscordClient from "../model/discord-client";
import {Repositories} from "../model/mongo-db-info";
import FeatureClassesObj from "../model/feature-classes-obj";

export default {
    data: new SlashCommandBuilder()
        .setName("reload-crons")
        .setDescription("reload-crons"),
    async execute(discordClient: DiscordClient, features: FeatureClassesObj, repositories: Repositories, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        features.botCronManager.clearExistingCrons();
        await features.botCronManager.setupCrons()
        interaction.editReply({content: 'reloaded'});
    },
};
