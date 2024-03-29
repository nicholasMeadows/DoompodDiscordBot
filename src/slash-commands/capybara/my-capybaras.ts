import {SlashCommandBuilder} from "discord.js";
import SlashCommandParams from "../../model/slash-command-params";

export default {
    data: new SlashCommandBuilder()
        .setName("my-capybaras")
        .setDescription("Displays your capybaras"),
    async execute(params: SlashCommandParams) {
        const interaction = params.interaction;
        const features = params.features;
        await interaction.deferReply();
        const discordReply = await features.capybaraFeature.myCapybaraDiscordEmbed(interaction)
        await interaction.editReply(discordReply);
    },
};
