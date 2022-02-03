import { Message } from "discord.js"
import { Bot } from "global"
import log from "../../lib/log4"

export default function (this: Bot, message: Message) {
  if(message.author.bot) return;
  if (message === null || message.guild === null) return;
  let reply = ''
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
    let i = 0
    log(`<${message.author.tag}> ${message.content}
    ${message.attachments.map((a) => {i++; return `[${type[i-1]} ${a.name}]`}).join('\n    ')}`)
  }
  else log(`<${message.author.tag}> ${message.content}`)
}