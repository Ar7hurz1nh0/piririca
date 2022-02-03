import { Bot } from "global";
import log, { warn } from '../../lib/log4'

export default function (this: Bot) {
  if (!this.bot.user) return
  const user = this.bot.user.tag.split('#') as [string, string]
  log(`Logged in as #c black $c magentaBright ${user[0]}$$$c gray #$$$c blueBright ${user[1]}$$##`);
  log(`${this.bot.user?.username} is in ${this.bot.guilds.cache.size} guilds`);
  if (this.config.presence) {
    this.setPresence(this.config.presence)
  }
  if (this.config.dynamic) {
    warn(`$c cyanBright Enabling dynamic reload$$`)
    this.enableDynamic()
  }
  else warn(`$c red Dynamic reload is disabled$$`)
  log(`${this.bot.user?.username} is ready!`);
}