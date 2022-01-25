import { Interaction, choiceInterface, getInteractionArgs as Args } from 'global';
import voiceSession, { sessions } from '../../lib/voiceSession';
import { VoiceConnectionStatus, entersState } from '@discordjs/voice';

export default {
  description: "Play some music",
  choices: [
    {
      name: "music",
      type: "string",
      description: "The music to play",
      required: true
    },
    {
      name: "volume",
      type: "number",
      description: "The volume to play at (0-100)",
      required: false
    },
    {
      name: "repeat",
      type: "boolean",
      description: "Whether to repeat the music",
      required: false
    },
    {
      name: "now",
      type: "boolean",
      description: "Whether to play the music immediately",
      required: false
    },
    {
      name: "next",
      type: "boolean",
      description: "Whether to play the music next",
      required: false
    }
  ] as choiceInterface[],
  async run(interaction: Interaction, args: Args) {
    if (!interaction.guildId || !interaction.guild) {
      interaction.reply("This command must be used on a server");
      return;
    }
    const cache = interaction.guild.members.cache.get(interaction.user.id)
    if (typeof cache === "undefined") return;
    if (cache.voice.channel === null) {
      await interaction.reply("You are not in a voice channel");
      return;
    }
    await interaction.reply(`Connecting to voice channel...`);
    const [session, old] = sessions[interaction.guildId] ? [(sessions[interaction.guildId] as any).voiceSession as voiceSession, true] : [new voiceSession({
        channelId: cache.voice.channel.id,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator as any,
      }), false]
    console.log(old ? `Using existing voice session for ${interaction.guild.name}` :  `Creating new voice session for ${interaction.guild.name}`)
    if (!old) {
      await session.join()
      const connection = await session.connection
      if (connection === undefined) {
        await interaction.editReply(`Failed to connect to voice channel`);
        return;
      }
      connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
            entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
          ]);
        } catch {
          session.leave();
        }
      });
      connection.on(VoiceConnectionStatus.Ready, async () => {
        await interaction.editReply(`Successfully connected to voice channel!`);
        await session.play(args.music)
        await interaction.editReply(`Playing ${args.music}`);
      })
      session.player.on("error", async () => {
        await interaction.editReply(`Error playing ${args.music}`);
      })
    }
    else {
      await session.play(args.music)
      await interaction.editReply(`Adding ${args.music} to queue`);
    }
  }
};