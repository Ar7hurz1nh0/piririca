import { Message } from "discord.js"
import { Bot } from "global"
import { Logger } from "../../lib/log4"

const logger = new Logger("messageCreate", { hideFile: true })

export default function (this: Bot, message: Message) {
  if(message.author.bot) return;
  if (message === null || message.guild === null) return;
  let reply = `<${message.author.tag} @${message.guild.name}#${message.guild.channels.cache.get(message.channel.id)?.name}>`
  function add(str: string) {
    if (str === '') return;
    reply += '\n    ' + str
  }
  if (message.type === 'REPLY') add(`Replying to ${message.mentions.repliedUser?.tag}`)
  const mentions = message.content.match(/<@!?([\d])+>/g) 
  if (mentions) {
    const parsedMentions = mentions.map(m => [message.guild?.members.cache.get(m.replace(/<@!?/g, '').replace(/>/g, ''))?.user.tag, m])
    for (const [user, mention] of parsedMentions) {
      message.content = message.content.replace(`${mention}`, `<@${user}>`)
    }
  }
  add(message.content)
  if (message.attachments.size > 0) {
    const type = message.attachments.map(a => a.name?.split('.').pop())
    for (let t = 0; t < type.length; t++) {
      if (type[t] === 'png' || type[t] === 'jpg' || type[t] === 'jpeg') type[t] = 'Image'
      else if (
        type[t] === 'mp4' || type[t] === 'webm' || type[t] === 'mov' ||
        type[t] === 'avi' || type[t] === 'flv'  || type[t] === 'wmv' ||
        type[t] === 'mkv' || type[t] === 'm4v'  || type[t] === '3gp'
        ) type[t] = 'Video'
      else if (
        type[t] === 'mp3' || type[t] === 'wav'  || type[t] === 'flac' ||
        type[t] === 'aac' || type[t] === 'ogg'  || type[t] === 'wma'  ||
        type[t] === 'm4a' || type[t] === 'aiff' || type[t] === 'aif'  ||
        type[t] === 'aifc' 
      ) type[t] = 'Audio'
      else type[t] = 'File'
    }
    add("Attachments:")
    for (let i = 0; i < message.attachments.size; i++) {
      add(`  [${type[i]} ${message.attachments.at(i)?.name}]`)
    }
  }
  logger.log(reply)
}