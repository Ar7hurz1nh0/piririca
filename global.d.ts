import type { Awaitable, Client, ClientEvents, ClientOptions, Guild, Interaction as MessageInteraction, PresenceData } from "discord.js"
import type { DiscordGatewayAdapterCreator } from '@discordjs/voice'
import type voiceSession from "./lib/voiceSession"

export interface processEnv {
  TOKEN: string,
  DEV: boolean,
  APPID: string
  KEY: string
}

export interface createVoiceSessionConfig {
  readonly channelId: string,
  readonly guildId: string,
  readonly adapterCreator: DiscordGatewayAdapterCreator,
}

export interface fileInterface {
  name: string,
  attachment: string
}

export interface voiceSessionStore { [guildId: string]: void | voiceSession }

export interface config {
  dynamic: boolean,
  server: {
    webserver: boolean,
    port?: number
  },
  dynamicEnabled?: boolean,
  announcedDisabledDynamic?: boolean,
  presence?: PresenceData
}

export interface Interaction extends MessageInteraction {
  editReply: (content: string) => Promise<void>;
  deferReply: (content: void) => Promise<void>;
  reply: (content: string | {
    content: string,
    ephemeral?: boolean
    
  }) => Promise<void>;
  options: {
    getMentionable: Function
    getString: Function
    getInteger: Function
    getBoolean: Function
    getNumber: Function
    getUser: Function
    getChannel: Function
    getRole: Function
  }
}

export type options = "addStringOption" | "addIntegerOption" | "addNumberOption" | "addBooleanOption" | "addUserOption" | "addChannelOption" | "addRoleOption" | "addMentionableOption";

export type getOption = "getString" | "getInteger" | "getBoolean" | "getNumber" | "getUser" | "getChannel" | "getRole" | "getMentionable";

export interface choiceInterface {
  name: string,
  type: "string" | "integer" | "boolean" | "number" | "user" | "channel" | "role" | "mentionable",
  description: string,
  required: boolean
}

export interface commandInterface {
  name: string,
  description: string,
  choices: choiceInterface[ ],
  run: Function
}

export interface better4logConfig {
  useRegex: boolean,
  patternLayout: string
}

export interface event { run: (...args: ClientEvents[keyof ClientEvents]) => Awaitable<void>, name: keyof ClientEvents }

export interface getInteractionArgs { [name: string]: string}

export type colors = "black" | "red" | "green" | "yellow" | "blue" | "magenta" | "cyan" | "white" | "gray" | "grey" | "redBright" | "greenBright" | "yellowBright" | "blueBright" | "magentaBright" | "cyanBright" | "whiteBright" | "blackBright"
export type bgColors = "black" | "red" | "green" | "yellow" | "blue" | "magenta" | "cyan" | "white" | "gray" | "grey" | "redBright" | "greenBright" | "yellowBright" | "blueBright" | "magentaBright" | "cyanBright" | "whiteBright" | "blackBright"

export type registerCommandsArgs = { globally: true, guild?: never } | { globally: false, guild: Guild }
export type paths = { commands: string, events: string}
export type auth = { token: string, applicationID: string }

export interface isEventEnabled { [event: string]: boolean }

export class Bot {
  public constructor(intents: ClientOptions["intents"][], auth: auth, paths: paths, config: config)

  public readonly config: config
  public readonly bot: Client
  public readonly commands: commandInterface[]
  public readonly isEventEnabled: isEventEnabled
  public readonly applicationID: string
  //private readonly paths: paths
  //private readonly token: string
  //private readonly rest: REST
  //private readonly events: event[]

  public login(): void
  //private get loadCommands(): commandInterface[]
  //private get loadEvents(): event[]

  //private loadCommand(command: string): commandInterface | undefined
  //private reloadCommand(command: string): commandInterface | undefined
  //private deleteCommand(command: string): void
  public registerCommand(command: commandInterface, applicationId: string): void
  public registerCommands(args: registerCommandsArgs): void

  //private loadEvent(event: string): event | undefined
  //private reloadEvent(event: string): event

  public disableEvent(event: string): void
  public enableEvent(event: string): void
  public toggleEvent(event: string): void
  public getArgs(choices: choiceInterface[], { options }: Interaction): getInteractionArgs
  public setPresence(presenceData: PresenceData): void
  public enableDynamic(): void
  public disableDynamic(): void
}