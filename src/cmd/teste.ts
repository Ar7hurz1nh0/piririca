import { Interaction, choiceInterface } from 'global';
import { readdirSync, statSync } from 'fs';
import { parse, join } from 'path';
import voiceSession, { sessions } from '../../lib/voiceSession';
import { VoiceConnectionStatus, entersState } from '@discordjs/voice';

export default {
  description: "Play some music",
  choices: [] as choiceInterface[],
  async run(interaction: Interaction) {
    const extensions: string[] = [".mp3", ".wav", ".ogg", ".flac", ".opus", ".aac", ".m4a", ".mov", ".mp4", ".webm", ".mkv"];
    const homeDir = "/home/arthurbr/Downloads/"
    const files = readdirSync(homeDir)
      .filter((file) => {
        for (const extension of extensions) {
          if (parse(file).ext === extension) return file;
        }
      })
    const theChosenOne: string = files[Math.floor(Math.random() * files.length)] as any;
    if (!interaction.guild || !interaction.guildId) {
      interaction.reply("This command must be used on a server");
      return;
    }
    const cache = interaction.guild.members.cache.get(interaction.user.id)
    if (typeof cache === "undefined") return;
    if (!cache.voice.channel) {
      await interaction.reply("You are not in a voice channel");
      return;
    }
    await interaction.reply(`Connecting to voice channel...`);
    const [session, old] = sessions[interaction.guildId] ? [sessions[interaction.guildId] as voiceSession, true] : [new voiceSession({
      channelId: cache.voice.channel.id,
      guildId: interaction.guildId,
      adapterCreator: interaction.guild.voiceAdapterCreator as any,
    }), false]
    console.log(old ? `Using existing voice session for ${interaction.guild.name}` :  `Creating new voice session for ${interaction.guild.name}`)
    if (!old) {
      session.join()
      const connection = session.connection
      if (!connection) {
        await interaction.editReply(`Failed to connect to voice channel`);
        return;
      }
      connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
            entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
          ]);
          // Seems to be reconnecting to a new channel - ignore disconnect
        } catch {
          // Seems to be a real disconnect which SHOULDN'T be recovered from
          session.leave();
        }
      });
      connection.on(VoiceConnectionStatus.Ready, async () => {
        await interaction.editReply(`Successfully connected to voice channel!`);
        session.playFile(join(homeDir, theChosenOne))
        await interaction.editReply(`Playing ${theChosenOne}`);
        if(interaction.channel !== null) {
          await interaction.channel.send(`From ${files.length} files, the chosen one was ${theChosenOne}`);
          if (statSync(join(homeDir, theChosenOne)).size > 1024**2*8) interaction.channel.send(`Could not send source file: file is too large`);
          else interaction.channel.send({content: `Source file:`, files: [{ attachment: join(homeDir, theChosenOne), name: theChosenOne }] });
        }
      })
      session.queue.on("completed", async () => {
        if(interaction.channel !== null) {
          //await interaction.channel.send(`From ${files.length} files, the chosen one was ${theChosenOne}`);
          //if (statSync(join(homeDir, theChosenOne)).size > 1024**2*8) interaction.channel.send(`Could not send source file: file is too large`);
          //else interaction.channel.send({content: `Source file:`, files: [{ attachment: join(homeDir, theChosenOne), name: theChosenOne }] });
        }
      })
      session.player.on("error", async () => {
        await interaction.editReply(`Error playing ${theChosenOne}`);
      })
    }
    else {
      session.playFile(join(homeDir, theChosenOne))
      await interaction.editReply(`Adding ${theChosenOne} to queue`);
    }
  }
};