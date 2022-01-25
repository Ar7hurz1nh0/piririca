import { Message } from "discord.js"
import { Bot } from "global"
import log from "../../lib/log4"

export default function (this: Bot, message: Message) {
  if(message.author.bot) return;
  if (message === null || message.guild === null) return;
  log(message.content);
}