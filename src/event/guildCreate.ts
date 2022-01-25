import { Guild } from "discord.js";
import { Bot } from "global"
import log from '../../lib/log4'

export default function (this: Bot, guild: Guild) {
  log(`Joined guild $c brightMagenta ${guild.name}$$`);
  this.registerCommands({ globally: false, guild });
}