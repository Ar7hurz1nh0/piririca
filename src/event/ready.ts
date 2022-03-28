import { Bot } from "global";
import { Logger } from '../../lib/log4'

const logger = new Logger('Ready', { hideFile: true })

export default function (this: Bot) {
  if (!this.bot.user) return
  const user = this.bot.user.tag.split('#') as [string, string]
  logger.log(`Logged in as #c black $c magentaBright ${user[0]}$$$c gray #$$$c blueBright ${user[1]}$$##`);
  logger.log(`${this.bot.user?.username} is in ${this.bot.guilds.cache.size} guilds`);
  if (this.config.presence) {
    this.setPresence(this.config.presence)
  }
  if (this.config.dynamic) {
    logger.warn(`$c cyanBright Enabling dynamic reload$$`)
    this.enableDynamic()
  }
  else logger.warn(`$c red Dynamic reload is disabled$$`)
  logger.log(`${this.bot.user?.username} is ready!`);
}