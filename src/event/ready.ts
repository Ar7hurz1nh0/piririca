import { Bot } from "global";
import log, { warn } from '../../lib/log4'

export default function (this: Bot) {
  if (!this.bot.user) return
  const user = this.bot.user.tag.split('#') as [string, string]
  log(`Logged in as #c black $c brightMagenta ${user[0]}$$$c gray #$$$c brightBlue ${user[1]}$$##`);
  log(`${this.bot.user?.username} is in ${this.bot.guilds.cache.size} guilds`);
  if (this.config.presence) {
    this.setPresence(this.config.presence)
  }
  if (this.config.dynamic) {
    warn(`$c brightCyan Enabling dynamic commands/events$$`)
    this.enableDynamic()
  }
  log(`${this.bot.user?.username} is ready!`);
}