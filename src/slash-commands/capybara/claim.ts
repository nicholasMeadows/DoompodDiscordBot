import {SlashCommandBuilder} from "discord.js";
import SlashCommandParams from "../../model/slash-command-params";

export default {
    data: new SlashCommandBuilder()
        .setName("claim-capybara")
        .setDescription("Claim your very own random capybara!!"),
    async execute(params: SlashCommandParams) {
        const interaction = params.interaction;
        const capybaraFeature = params.features.capybaraFeature;
        await interaction.deferReply();
        const claimReply = await capybaraFeature.claimCapybara(params.interaction);
        interaction.editReply(claimReply);
    },
};
