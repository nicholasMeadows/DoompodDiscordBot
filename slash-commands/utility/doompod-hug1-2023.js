const { SlashCommandBuilder } = require("discord.js");
const {
  AttachmentBuilder,
  EmbedBuilder,
  MessageAttachment,
} = require("discord.js");
const { ASSETS_DIR, DOOMPOD_HUG1_2023_FILE} = require("../../constants");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("doomhug1")
    .setDescription("Our very first Doom-pod hug circa December 2023"),
  async execute(interaction) {
    await interaction.deferReply();
    const attachmentPath = path.join(ASSETS_DIR, DOOMPOD_HUG1_2023_FILE)
    const file = new AttachmentBuilder(attachmentPath);
    interaction.editReply({ files: [file] });
  },
};
