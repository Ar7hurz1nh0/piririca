import { Awaitable, Client, ClientEvents } from "discord.js";
import { parse, join } from "path";
import { watch } from "chokidar";
import { readdirSync } from "fs";
import log, { warn, error } from "./lib/log4";
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import { SlashCommandBuilder } from '@discordjs/builders'

import type {
  commandInterface,
  paths,
  auth,
  choiceInterface,
  getOption,
  getInteractionArgs,
  event,
  config,
  isEventEnabled,
  registerCommandsArgs,
  Bot as BotInterface,
  options as Options,
  Interaction as globalInteraction,
} from "global";
import type { ClientOptions, PresenceData } from "discord.js";

interface RESTcommand {
  id: string,
  application_id: string,
  version: string,
  defaut_permission: boolean,
  default_member_permission: null,
  type: number,
  name: string,
  description: string,
  dm_permission: null
}

export default class Bot implements BotInterface {
  public constructor (intents: ClientOptions["intents"][], auth: auth, paths: paths, config: config) {
    this.config = config;
    this.paths = paths;
    this.commands = this.loadCommands
    this.events = this.loadEvents
    this.bot = new Client({ intents })
    for (let event = 0; event < this.events.length; event++) {
      this.events[event].run = this.events[event].run.bind(this)
      this.isEventEnabled[this.events[event].name] = true
      this.bot.on(this.events[event].name, (...args: unknown[]) => {
        if (this.isEventEnabled[this.events[event].name])
          try {
            this.events[event].run(...args as any)
          }
          catch (e: any) {
            error(e.message)
          }
        })
      warn(`$c green Enabled $$$c cyan ${this.events[event].name}$$ $c redBright event$$`)
    }
    this.token = auth.token
    this.applicationID = auth.applicationID
    this.rest = new REST({ version: '9'}).setToken(this.token)
    this.registerCommands({ globally: true })

    const files = {
      commands: watch(this.paths.commands, { persistent: true, awaitWriteFinish: true, ignoreInitial: true }),
      events: watch(this.paths.events, { persistent: true, awaitWriteFinish: true, ignoreInitial: true })
    }

    /**
     * Dynamic commands section
     */
    files.commands.on("change", (file) => {
      if (!this.config.dynamic) {
        if (this.config.announcedDisabledDynamic) return
        log(`$c red Dynamic reloads are disabled, skipping reload$$`)
        this.config.announcedDisabledDynamic = true
        return
      }
      if (!this.config.dynamicEnabled) return
      warn(`$c magenta Detected change in $$$c cyan ${parse(file).base}$$ $c yellowBright command$$`)
      const newCommand = this.reloadCommand(file)
      if (newCommand === undefined) return
      for (let i = 0; i < this.commands.length; i++) {
        if (this.commands[i].name === newCommand.name) {
          this.commands[i] = newCommand
          this.registerCommand(newCommand, this.applicationID)
          log(`$c green Reloaded $$$c cyan ${newCommand.name}$$ $c yellowBright command$$`)
          return
        }
      }
    })
    files.commands.on("add", (file) => {
      if (!this.config.dynamic) {
        if (this.config.announcedDisabledDynamic) return
        log(`$c red Dynamic reloads are disabled, skipping command add$$`)
        this.config.announcedDisabledDynamic = true
        return
      }
      if (!this.config.dynamicEnabled) return
      const newCommand = this.loadCommand(file)
      if (newCommand === undefined) return
      this.commands.push(newCommand)
      this.registerCommand(newCommand, this.applicationID)
      log(`$c green Added $$$c cyan ${newCommand.name}$$ $c yellowBright command$$`)
    })
    files.commands.on("unlink", (file) => {
      if (!this.config.dynamic) {
        if (this.config.announcedDisabledDynamic) return
        log(`$c red Dynamic reloads are disabled, skipping command remove$$`)
        this.config.announcedDisabledDynamic = true
        return
      }
      if (!this.config.dynamicEnabled) return
      for (let i = 0; i < this.commands.length; i++) {
        if (this.commands[i].name === parse(file).name) {
          const command = this.commands[i].name
          delete require.cache[require.resolve(join(__dirname, file))]
          this.commands.splice(i, 1)
          try {
            this.deleteCommand(command)
          } catch (e: any) { error(e.message) }
          log(`$c red Removed $$$c cyan ${command}$$ $c yellowBright command$$`)
          return
        }
      }
    })
    // End of dynamic commands section

    /**
     * Dynamic events section
     */
    files.events.on("change", (file) => {
      if (!this.config.dynamic) {
        if (this.config.announcedDisabledDynamic) return
        log(`$c red Dynamic reloads are disabled, skipping event reload$$`)
        this.config.announcedDisabledDynamic = true
        return
      }
      if (!this.config.dynamicEnabled) return
      warn(`$c magenta Detected change in $$$c cyan ${parse(file).base}$$ $c redBright event$$`)
      const newEvent = this.reloadEvent(file)
      if (newEvent === undefined) return
      for (let i = 0; i < this.events.length; i++) {
        if (this.events[i].name === newEvent.name) {
          this.events[i].run = newEvent.run.bind(this)
          log(`$c green Reloaded $$$c cyan ${newEvent.name}$$ $c redBright event$$`)
          return
        }
      }
    })
    files.events.on("add", (file) => {
      if (!this.config.dynamic) {
        if (this.config.announcedDisabledDynamic) return
        log(`$c red Dynamic reloads are disabled, skipping event add$$`)
        this.config.announcedDisabledDynamic = true
        return
      }
      if (!this.config.dynamicEnabled) return
      const newEvent = this.loadEvent(file)
      if (newEvent === undefined) return
      let alreadyExists = false
      newEvent.run = newEvent.run.bind(this)
      for (const event of this.events) {
        if (event.name === newEvent.name) {
          event.run = newEvent.run
          alreadyExists = true
          break
        }
        else continue
      }
      if (!alreadyExists) {
        this.events.push(newEvent)
        for (const event of this.events) {
          if (event.name === newEvent.name) {
            this.bot.on(event.name, (...args: unknown[]) => {if (this.isEventEnabled[event.name]) event.run(...args as any)})
          }
        }
      }
      log(`$c green Added $$$c cyan ${newEvent.name}$$ $c redBright event$$`)
      this.enableEvent(newEvent.name)
    })
    files.events.on("unlink", (file) => {
      if (!this.config.dynamic) {
        if (this.config.announcedDisabledDynamic) return
        log(`$c red Dynamic reloads are disabled, skipping event remove$$`)
        this.config.announcedDisabledDynamic = true
        return
      }
      if (!this.config.dynamicEnabled) return
      for (const event of this.events) {
        if (event.name === parse(file).name) {
          const eventName = event.name
          delete require.cache[require.resolve(join(__dirname, file))]
          this.disableEvent(eventName)
          log(`$c red Removed $$$c cyan ${eventName}$$ $c redBright event$$`)
          return
        }
      }
    })
    // End of dynamic events section
    this.bot.emit("loaded", "")
  }
  
  public readonly config: config
  public readonly bot: Client
  public readonly commands: commandInterface[]
  public readonly isEventEnabled: isEventEnabled = {}
  public readonly applicationID: string
  private readonly paths: paths
  private readonly token: string
  private readonly rest: REST
  private readonly events: event[]

  public login(): void {
    this.bot.login(this.token)
  }

  private get loadCommands(): commandInterface[] {
    const PATH = join(__dirname, this.paths.commands)
    const commandsFiles = readdirSync(PATH);
    const commands: commandInterface[] = []
    commandsFiles.forEach((file: any): void => {
      if (file.endsWith(".ts") || file.endsWith(".js")) {
        file = join(PATH, file);
        try {
          const cmd: commandInterface = require(file).default;
          if (cmd === undefined) throw new Error(`Command ${file} has no default export`);
          cmd.name = parse(file).name
          commands.push(cmd)
          warn(`$c green Loaded $$$c cyan ${cmd.name}$$ $c yellowBright command$$`);
        } catch (e) {
          error(e);
        }
      }
    })
    return commands
  }

  private get loadEvents(): event[] {
    const path = join(__dirname, this.paths.events)
    const eventsFiles = readdirSync(path);
    const events: event[] = []
    eventsFiles.forEach((file: any): void => {
      if (file.endsWith(".ts") || file.endsWith(".js")) {
        file = join(path, file);
        try {
          const event: (...args: unknown[]) => Awaitable<void> = require(file).default;
          if (event === undefined) throw new Error(`Event ${parse(file).base} has no default export`);
          events.push({ run: event, name: parse(file).name as any })
          log(`$c magentaBright Pushed$$ $c cyan ${parse(file).name}$$ $c magentaBright to event cache$$`);
        } catch (e) {
          error(e);
        }
      }
    })
    return events
  }

  private loadCommand(command: string): commandInterface | undefined {
    const file = join(__dirname, command);
    const cmd: commandInterface = require(file).default;
    try {
      if (cmd === undefined) throw new Error(`Command ${file} has no default export`);
      cmd.name = parse(file).name
      warn(`Loaded $c cyan ${cmd.name}$$ $c yellowBright command$$`);
    } catch (e) {
      error(e);
    }
    return cmd
  }

  private loadEvent(event: string): event | undefined {
    const file = join(__dirname, event);
    const evt: event = { run: require(file).default, name: parse(file).name as any }
    try {
      if (evt.run === undefined) throw new Error(`Event ${parse(file).base} has no default export`);
      log(`Loaded $c cyan ${evt.name}$$ $c redBright event$$`);
    } catch (e) {
      error(e);
    }
    return evt
  }

  private deleteCommand(command: string): void {
    this.rest.get(Routes.applicationCommands(this.applicationID))
      .then((data: any) => {
        const res = data as RESTcommand[]
        for (let i = 0; i < res.length; i++) {
          if (res[i].name === command) {
            this.rest.delete(Routes.applicationCommand(this.applicationID, res[i].id))
              .then(() => {
                log(`$c red Deleted $$$c cyan ${res[i].name}$$ $c yellowBright command$$`);
              })
              .catch((e: any) => {
                error(e.message);
              })
            return
          }
        }
      })
  }

  public registerCommand(command: commandInterface, applicationId: string): void {
    this.rest.put(Routes.applicationCommands(applicationId), {
      body: [(() => {
        const slash = new SlashCommandBuilder( )
          .setName(command.name)
          .setDescription(command.description);
        command.choices.forEach(({type, name, description, required}: choiceInterface) => {
          slash[`add${type.charAt(0).toUpperCase()}${type.slice(1)}Option` as Options]((o: any) => o
            .setName(name)
            .setDescription(description)
            .setRequired(required));
        })
        return slash.toJSON()
      })()]
    })
    .then(() => log(`$c magenta Registered $$$c cyan ${command.name} $$$c magenta command $$`))
    .catch(e => error(e))
  }

  public registerCommands(args: registerCommandsArgs): void {
    type global = 'applicationCommands' | 'applicationGuildCommands'
    const isGlobal: global = args.globally ? 'applicationCommands' : 'applicationGuildCommands';
    this.rest.put(Routes[isGlobal](...[this.applicationID, args.guild?.id] as [string, string]), {
      body: this.commands.map((command: commandInterface) => {
        const slash = new SlashCommandBuilder( )
          .setName(command.name)
          .setDescription(command.description)
        command.choices.forEach(({type, name, description, required}: choiceInterface) => {
          slash[`add${type.charAt(0).toUpperCase()}${type.slice(1)}Option` as Options]((o: any) => o
            .setName(name)
            .setDescription(description)
            .setRequired(required));
        })
        return slash.toJSON()
      })
    })
    .then(() => log(`Registered commands ${args.globally ? 'globally' : 'for guild ' + args.guild.name}`))
    .catch(e => error(e))
  }

  private reloadCommand(command: string): commandInterface | undefined {
    const file = join(__dirname, command);
    warn(`$c red Deleting $$$c cyan ${parse(command).base}$$ $c red cache$$`);
    delete require.cache[require.resolve(file)]
    const cmd: commandInterface = require(file).default;
    try {
      if (cmd === undefined) throw new Error(`Command ${file} has no default export`);
      cmd.name = parse(file).name
      warn(`$c green Loaded $$$c cyan ${cmd.name}$$ $c yellowBright command$$`);
    } catch (e) {
      error(e);
    }
    return cmd
  }

  private reloadEvent(Event: string): event {
    const file = join(__dirname, Event);
    warn(`$c red Deleting $$$c cyan ${parse(file).base}$$ $c red cache$$`);
    delete require.cache[require.resolve(file)]
    const event: (...args: unknown[]) => Awaitable<void> = require(file).default;
    try {
      if (event === undefined) throw new Error(`Event ${parse(file).base} has no default export`);
      log(`$c magentaBright Pushed$$ $c cyan ${parse(file).name}$$ $c magentaBright to event cache$$`);
    } catch (e) { error(e); }
    return { run: event, name: parse(file).name as keyof ClientEvents }
  }

  public disableEvent(event: keyof ClientEvents): void {
    const isEnabled = this.isEventEnabled[event]
    if (!isEnabled) error(`$c red Event $$$c cyan ${event} $c red is already disabled$$`)
    else {
      this.isEventEnabled[event] = false
      log(`$c red Disabled $$$c cyan ${event}$$ $c red event$$`)
    }
  }

  public enableEvent(event: keyof ClientEvents): void {
    const isEnabled = this.isEventEnabled[event]
    if (isEnabled) error(`$c red Event $$$c cyan ${event} $c red is already enabled$$`)
    else {
      this.isEventEnabled[event] = true
      log(`$c greenBright Enabled $$$c cyan ${event}$$ $c red event$$`)
    }
  }

  public toggleEvent(event: keyof ClientEvents): void {
    const isEnabled = this.isEventEnabled[event]
    if (isEnabled) this.disableEvent(event)
    else this.enableEvent(event)
  }

  public getArgs(choices: choiceInterface[], { options }: globalInteraction): getInteractionArgs {
    const args: getInteractionArgs = {}
    choices.forEach(({ type, name }: choiceInterface) => {
      args[name] = options[`get${type.charAt(0).toUpperCase()}${type.slice(1)}` as getOption](name)
    })
    return args
  }

  public setPresence(presenceData: PresenceData): void {
    if (!this.bot.user) return
    if(!presenceData.activities) return
    const type = presenceData.activities[0].type as string
    const status = presenceData.status as string
    const presence =
      presenceData.activities.length > 0
        ?
      `${type?.charAt(0) + type?.slice(1).toLowerCase()} ${presenceData.activities[0].name}`
        :
      `${status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase()}`

      if (presenceData.activities[0].type === 'STREAMING') log(`Setting presence to #c magenta $c black  ${presence} $$##`)
      else switch (presenceData.status) {
      case 'online': {
        log(`Setting presence to #c greenBright $c black  ${presence} $$##`);
        break
      }
      case 'idle': {
        log(`Setting presence to #c yellow $c black  ${presence} $$##`);
        break
      }
      case 'dnd': {
        log(`Setting presence to #c red $c black  ${presence} $$##`);
        break
      }
      case 'invisible': {
        log(`Setting presence to #c gray $c whiteBright  ${presence} $$##`);
        break
      }
      default: break
    }
    this.bot.user.setPresence(presenceData)
  }

  public enableDynamic() {
    this.config.dynamicEnabled = true
    log('$c greenBright Enabled dynamic reload$$')
  }

  public disableDynamic() {
    this.config.dynamicEnabled = false
    log('$c red Disabled dynamic reload$$')
  }
}