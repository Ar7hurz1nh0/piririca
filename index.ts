import './lib/dotenv';
import Bot from './lib/bot'
import { ExcludeEnum, Intents, PresenceStatusData } from 'discord.js';
import { readFileSync, appendFileSync, writeFileSync } from 'fs'
import { prompt } from 'inquirer'
import { log, warn, error } from './lib/log4'
import { randomBytes } from 'crypto'
import { ActivityTypes } from 'discord.js/typings/enums';

type config = {
  token: string,
  appid: string,
  command: string,
  event: string,
  status: PresenceStatusData,
  dynamic: boolean,
  activity?: ExcludeEnum<typeof ActivityTypes, "CUSTOM">,
  name?: string,
  url?: string,
  webserver: boolean,
  port?: number
}

type Prompt = {
  type?: string,
  name?: string,
  message?: string,
  default?: string | number,
  mask?: boolean,
  choices?: string[]
}

const configKeys: Array<keyof config> = ['token', 'appid', 'command', 'event', 'status', 'dynamic', 'webserver', 'port', 'activity', 'name', 'url']

function firstStart(): boolean {
  let config
  try {
    config = readFileSync('./.config.json', 'utf8')
  }
  catch (e: any) {
    warn("$c cyan config file not found!$$")
  }
  if (config === undefined) return true
  return false
}

function isNULL(conf: any): boolean {
  switch (conf) {
    case undefined: return true
    case null: return true
    case '': return true
    default: return false
  }
}

function keyof(key: string, obj: { [key: string]: any } | Array<any>): boolean {
  if (obj instanceof Array) {
    for (let i = 0; i < obj.length; i++) {
      if (obj[i] === key) return true
      else continue
    }
  }
  else for (const keyin in obj) {
    if (obj[key] === keyin) return true
    else continue
  }
  return false
}

// for (let i = 0; i < configKeys.length; i++) {
//   console.log(configKeys[i], keyof(configKeys[i], {
//     token: '',
//     appid: '',
//     command: '',
//     event: '',
//     status: '',
//     dynamic: '',
//     activity: '',
//     name: '',
//     url: '',
//     webserver: '' 
//   }))
// }

async function getConfigKey(messages: {error: string, prompt: string, default: string}, type: string): Promise<string> {
  error(messages.error)
  return await sendPrompt(type, messages.prompt, messages.default)  
}

async function verifyConfig(): Promise<void> {
  const config: config = require('./.config.json')
  let modified = false
  warn("Verifying config...")

  // for (let i = 0; i < configKeys.length; i++) {
  //   if (keyof(configKeys[i], config) && isNULL(config[configKeys[i]]))
  //   config['token'] = await getConfigKey({ error: '', prompt: '', default: '' }, 'input')
  // }

  if (isNULL(config.token)) {
    error("Token not found!")
    config.token = await sendPrompt('input', 'Enter your bot token:', r(24)+ '.' + r(6) + '.' + r(7) + '-' + r(19))
    modified = true
  } else log("$c green Token OK$$")

  if (isNULL(config.appid)) {
    error('AppID is invalid!')
    config.appid = await sendPrompt('input', 'Enter your application ID:', rn(18))
    modified = true
  } else log("$c green AppID OK$$")

  if (isNULL(config.command)) {
    error('Command path is invalid!')
    config.command = await sendPrompt('input', 'Enter the command path:', 'src/cmd')
    modified = true
  } else log("$c green Command path OK$$")

  if (isNULL(config.event)) {
    error('Event path is invalid!')
    config.event = await sendPrompt('input', 'Enter the event path:', 'src/event')
    modified = true
  } else log("$c green Event path OK$$")

  if (isNULL(config.dynamic)) {
    error('Dynamic reload is invalid!')
    config.dynamic = await sendPrompt('confirm', 'Enable dynamic reload?', true) === 'true' ? true : false
    modified = true
  } else log("$c green Dynamic reload OK $$")

  if (isNULL(config.status)) {
    error('Status is invalid!')
    config.status = await sendPrompt('list', 'Select your status:', 0, [ 'Online', 'Idle', 'Do Not Disturb' ]) as any
    modified = true
  } else log("$c green Status OK$$")

  if (isNULL(config.webserver)) {
    error('Webserver is invalid!')
    config.webserver = await sendPrompt('confirm', 'Enable webserver?', true) === 'true' ? true : false
    modified = true
  }

  if (isNULL(config.port) && config.webserver) {
    error('WebServer port is invalid!')
    config.port = Number(await sendPrompt('input', 'Enter the webserver port:', 3000))
    modified = true
  }

  try {
    if (modified) {
      writeFileSync('./.config.json', JSON.stringify(config, null, 2))
      log('$c green Config file updated!$$')
    }
  }
  catch (e: any) {
    error(e.message)
  }
}

process.env.DEV

function init(): void {
  const config = JSON.parse(readFileSync('./.config.json', 'utf8'))
  for (const key in config) {
    const configKeys = ['token', 'appid', 'command', 'event', 'status', 'dynamic', 'activity', 'name', 'url', 'webserver', 'port']
    if (configKeys.find(x => x === key)) continue
    else switch (key) {
      default:
        process.env[key.toUpperCase()] = config[key]
        log(`$c green Pushed $$$c cyan ${key}$$$c green  to the Enviroment variables as [$$$c magenta ${key.toUpperCase()}$$$c green ]$$`)
        break
      }
    
  }
}

function r(l: number): string {
  if (l === 0) return ''
  const L = l / 2
  if (l % 2 === 1) {
    return randomBytes(L + 0.5).toString('hex').slice(0, l)
  }
  else return randomBytes(L).toString('hex')
}

function rn(l: number ): string {
  function genrn() { return Math.floor(Math.random() * 9) }
  let rn = ''
  for (let i = 0; i < l; i++) {
    rn += genrn()
  }
  return rn
}

function censor(string: string): string {
  return string.replace(/[a-zA-Z0-9]/g, '*')
}

async function sendPrompt(type: string, message: string, Default?: any, choices?: Array<string>): Promise<string> {
  const config: Prompt = {}
  config.type = type
  config.message = message
  config.default = Default
  config.name = r(6)
  if (choices !== undefined) config.choices = choices
  if (type === 'password') config.mask = true
  return (await prompt(config as any))[config.name]
}

async function getConfig(): Promise<config> {
  const config: config = {
    token: await sendPrompt('input', 'Enter your bot token:', r(24)+ '.' + r(6) + '.' + r(7) + '-' + r(19)),
    appid: await sendPrompt('input', 'Enter your application ID:', rn(18)),
    command: await sendPrompt('input', 'Enter the command path:', 'src/cmd'),
    event: await sendPrompt('input', 'Enter the event path:', 'src/event'),
    dynamic: await sendPrompt('confirm', 'Dynamic reload?', true) === "true" ? true : false,
    status: await sendPrompt('list', 'Select your status:', 0, [ 'Online', 'Idle', 'Do Not Disturb' ]) as PresenceStatusData,
    activity: (await sendPrompt('list', 'Select your activity type:', 0, [ 'None', 'Playing', 'Streaming', 'Listening', 'Watching' ])).toUpperCase() as ExcludeEnum<typeof ActivityTypes, "CUSTOM">,
    webserver: await sendPrompt('confirm', 'Enable webserver?', true) === "true" ? true : false,
  }
  if (config.activity as string !== 'NONE') config.name = await sendPrompt('input', 'Enter your activity name:')
  else delete config.activity
  if (config.activity === "STREAMING") config.url = await sendPrompt('input', 'Enter your activity url:', "https://www.youtube.com/watch?v=dQw4w9WgXcQ")
  if (config.webserver) config.port = Number(await sendPrompt('input', 'Enter your webserver port:', 3000))
  if (config.status as string === "Do Not Disturb") config.status = "dnd"
  else config.status = config.status.toLowerCase() as PresenceStatusData
  return config
}

if(firstStart()) {
  (async () => await getConfig())().then((config: config) => {
    let color
    switch (config.status) {
      case 'online':
        color = 'green'
        break
      case 'idle':
        color = 'yellow'
        break
      case 'dnd':
        color = 'red'
        break
    }
    const status = config.activity === undefined
    ? `$c ${color} Status: ${config.status}$$`
    : config.activity === 'STREAMING' ? `$c magentaBright Status: Streaming ${config.name}$$`
    : `$c ${color} Status: ⬤ ${config.name}$$`

    log(`
    $c yellow Token: ${censor(config.token)}$$
    $c yellow AppID: ${config.appid}$$
    $c magenta Commands path: ${config.command}$$
    $c magenta Events path: ${config.event}$$
    ${status}`)

    warn("Creating config file")
    try {
      appendFileSync('./.config.json', JSON.stringify(config, null, 2), 'utf8')
      log("$c green config file created!$$")
    }
    catch (e: any) {
      error(e.message)
    }
    finally {
      log("Starting bot")
      startBot(JSON.parse(readFileSync('./.config.json', 'utf8')))
    }
  })
}
else (async () => await verifyConfig())().then(() => { init(); startBot( JSON.parse( readFileSync('./.config.json', 'utf8') ) ) })

function startBot(config: config) {
  warn("$c green Starting bot$$")
  const bot = new Bot([
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_VOICE_STATES
  ], {
    token: config.token,
    applicationID: config.appid
  }, {
    commands: config.command,
    events: config.event
  }, {
    dynamic: config.dynamic,
    server: {
      webserver: config.webserver,
      port: config.port
    },
    presence: {
      status: config.status,
      activities: [{
        type: config.activity as ExcludeEnum<typeof ActivityTypes, "CUSTOM">,
        name: config.name,
        url: config.url
      }]
    }
  })
  bot.login()
}
