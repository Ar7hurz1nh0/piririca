import { Interaction } from 'global';
import { promisify } from 'util';

export default {
  description: "Send ping in the channel",
  choices: [],
  async run(interaction: Interaction) {
    const start = Date.now();
    await interaction.reply({content: `Ping! :ping_pong:\nPing: \`${start - interaction.createdTimestamp}ms\``, ephemeral: true});
    const edit = (Date.now() - start) / 2
    await promisify(setTimeout)(2000)
    await interaction.editReply(`:ping_pong: Pong!\nBot ping: \`${start - interaction.createdTimestamp}ms\`\nDiscord API: \`${edit}ms\`\nTotal: \`${edit + start - interaction.createdTimestamp}ms\``);
  }
};