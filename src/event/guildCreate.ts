import { Guild } from "discord.js";
import { Bot } from "global"
import { Logger } from '../../lib/log4'

const logger = new Logger('guildCreate', { hideFile: true })

export default function (this: Bot, guild: Guild) {
  logger.log(`Joined guild $c magentaBright ${guild.name}$$`);
  this.registerCommands({ globally: false, guild });
}