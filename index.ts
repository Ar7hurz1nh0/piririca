import 'dotenv/config';
import Bot from './bot';
import { Intents } from 'discord.js';

const bot = new Bot([
  Intents.FLAGS.GUILDS,
  Intents.FLAGS.GUILD_MEMBERS,
  Intents.FLAGS.GUILD_MESSAGES,
  Intents.FLAGS.GUILD_VOICE_STATES
], {
  token: process.env.TOKEN as string,
  applicationID: process.env.APPID as string
}, {
  commands: "src/cmd",
  events: "src/event"
}, {
  dynamic: true,
  presence: {
    status: "dnd",
    activity: {
      type: "STREAMING",
      name: "Arthur pelado 2022",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    }
  }
})

bot.login