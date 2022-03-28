import colors from 'chalk';
import path from 'path';

import type { BackgroundColor, ForegroundColor, Modifiers } from 'chalk'

type Colors =  typeof ForegroundColor | typeof Modifiers
type bgColors = typeof BackgroundColor

const allColors: Colors[] = [ 'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'gray', 'grey', 'blackBright', 'redBright', 'greenBright', 'yellowBright', 'blueBright', 'magentaBright', 'cyanBright', 'whiteBright', 'reset', 'bold', 'dim', 'italic', 'underline', 'inverse', 'hidden', 'strikethrough', 'visible' ];
const backgroundColors: bgColors[] = ["bgBlack", "bgRed", "bgGreen", "bgYellow", "bgBlue", "bgMagenta", "bgCyan", "bgWhite", "bgGray", "bgGrey", "bgBlackBright", "bgRedBright", "bgGreenBright", "bgYellowBright", "bgBlueBright", "bgMagentaBright", "bgCyanBright", "bgWhiteBright"]

export class Logger {
  private readonly name: string
  private readonly config: {
    hideFile: boolean,
  }
  private static readonly tokenTypes: { regex: RegExp, tokenType: string }[] = [
    { regex: /^\s+/, tokenType: 'WHITESPACE' },
    { regex: /^[{}]/, tokenType: 'BRACE' },
    { regex: /^[[\]]/, tokenType: 'BRACKET' },
    { regex: /^:/, tokenType: 'COLON' },
    { regex: /^,/, tokenType: 'COMMA' },
    { regex: /^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/i, tokenType: 'NUMBER_LITERAL' },
    { regex: /^"(?:\\.|[^"\\])*"(?=\s*:)/, tokenType: 'STRING_KEY' },
    { regex: /^"(?:\\.|[^"\\])*"/, tokenType: 'STRING_LITERAL' },
    { regex: /^true|^false/, tokenType: 'BOOLEAN_LITERAL' },
    { regex: /^null/, tokenType: 'NULL_LITERAL' }
  ];
  private static readonly defaultColors: { [x: string]: Colors } = {
    BRACE: 'gray',
    BRACKET: 'gray',
    COLON: 'gray',
    COMMA: 'gray',
    STRING_KEY: 'green',
    STRING_LITERAL: 'yellow',
    NUMBER_LITERAL: 'cyan',
    BOOLEAN_LITERAL: 'red',
    NULL_LITERAL: 'white'
  };
  public constructor(name: string, config: { hideFile: boolean } = { hideFile: false }) {
    this.name = name
    this.config = config
  }

  private get date(): [string, string, string] { 
    const now = new Date()
    let min: number | string = now.getMinutes()
    let sec: number | string = now.getSeconds()
    min = String(min < 10 ? "0" + min : min)
    sec = String(sec < 10 ? "0" + sec : sec)
    return [ String(now.getHours()), min, sec ]
  }

  private get stack(): string {
    const basePath = process.cwd() + "/"
    const baseModule = path.resolve(__dirname, __filename).replace(basePath, "")
    let stack: any
    try { throw new Error('') }
    catch (error: any) { stack = error.stack }
    stack = stack.split('\n').map((line: string) => line.trim())

    for (const i of stack) {
      const Path = i.split('(').length > 1
        ?
      i.split('(')[1].replace(basePath, "").split(":")[0]
        :
      i.split('(')[0].replace("at ", "").replace(basePath, "").split(":")[0]
      if (Path === baseModule || Path === "Error" || Path === "<anonymous>)" || Path.includes("node")) continue
      return Path
    }
    return "Anonymous"
  }

  private get info(): string {
    return `[${this.date.join(':')}] ${this.name ? `[${this.name}]` : ''}${this.config.hideFile ? '' : `[${this.stack}]`}`
  }

  private get logInfo(): string {
    if (this.name) return colors.white(`${this.info} [INFO]: `)
    else return colors.white(`[${this.date.join(':')}] [${this.stack}] [INFO]: `)
  }

  private get warnInfo(): string {
    if (this.name) return colors.yellow(`${this.info} [WARN]: `)
    else return colors.yellow(`[${this.date.join(':')}] [${this.stack}] [WARN]: `)
  }

  private get errorInfo(): string {
    if (this.name) return colors.red(`${this.info} [ERROR]: `)
    return colors.red(`[${this.date.join(':')}] [${this.stack}] [ERROR]: `)
  }

  private messageHandler(message: unknown): string {
    if (message === null) return "NULL"
    if (message instanceof Array) return "[" + message.map(this.messageHandler).join(", ") + "]"
    if (message instanceof Error) return String(message)
    if (message instanceof Date) return message.toString()
    if (message instanceof Map) return "[" + Array.from(message.entries()).map(this.messageHandler).join(", ") + "]"
    if (message instanceof Set) return "[" + Array.from(message.values()).map(this.messageHandler).join(", ") + "]"
    if (message instanceof Function) return `[Function ${message.name}]`
    message = typeof message !== "string" ? JSON.stringify(message) : message
    try { message = JSON.parse(message as string) }
    catch { void 0 }
    switch (typeof message) {
      case "string": return String(message)
      case "number": return String(message)
      case "boolean": return String(message)
      case "undefined": return "undefined"
      case "object": return JSON.stringify(message)
      default: return "unknown"
    }
  }

  private isValidColor<T>(color: T, set: T[]): boolean {
    return set.includes(color)
  }

  private parseColors(msg: string[]): string[] {
    let result: string[] = msg
    msg.forEach((arg, index) => {
      do {
        arg = arg.replace(/\$c([^\$c\$\$]*)\$\$/g, (a): any => {
          return a.replace(/\$c (\w+) (.+?)\$\$/g, (str: any, color: Colors, content: any): string => {
            if(this.isValidColor(color, allColors)) return colors[color](content)
            else return colors["reset"](content)
          })
        })
        do {
          arg = arg.replace(/\$c (\w+) (.+?)\$\$/g, (str: any, color: Colors, content: any): string => {
            if(this.isValidColor(color, allColors)) return colors[color](content)
            else return colors["reset"](content)
          })
        }
        while (arg.match(/\$c (\w+) (.+?)\$\$/g))
        result[index] = arg
      }
      while (arg.match(/\$c([^\$c\$\$]*)\$\$/g))
      do {
        arg = arg.replace(/\#c([^\#c\#\#]*)\#\#/g, (a): any => {
          return a.replace(/\#c (\w+) (.+?)\#\#/g, (str: any, color: Colors | bgColors, content: any): string => {
            color = 'bg' + color.charAt(0).toUpperCase() + color.slice(1) as bgColors
            if(this.isValidColor(color, backgroundColors)) return colors[color](content)
            else return colors["reset"](content)
          })
        })
        do {
          arg = arg.replace(/\#c (\w+) (.+?)\#\#/g, (str: any, color: Colors | bgColors, content: any): string => {
            color = 'bg' + color.charAt(0).toUpperCase() + color.slice(1) as bgColors
            if(this.isValidColor(color, backgroundColors)) return colors[color](content)
            else return colors["reset"](content)
          })
        }
        while (arg.match(/\#c (\w+) (.+?)\#\#/g))
        result[index] = arg
      }
      while (arg.match(/\#c([^\#c\#\#]*)\#\#/g))
    })
    return result
  }

  public log(...args: any[]): void {
    const message = this.parseColors(args.map(a => this.messageHandler(a))).join('; ')
    process.stdout.write(this.logInfo + message + "\n")
  }

  public warn(...args: any[ ]): void {
    const message = this.parseColors(args.map(a => this.messageHandler(a))).join('; ')
    process.stdout.write(this.warnInfo + colors.yellow(message) + "\n")
  }

  public error(...args: any[ ]): void {
    const message = this.parseColors(args.map(a => this.messageHandler(a))).join('; ')
    process.stdout.write(this.errorInfo + colors.red(message) + "\n")
  }
}

export const log = (...args: any[]) => Logger.prototype.log(...args)
export const warn = (...args: any[]) => Logger.prototype.warn(...args)
export const error = (...args: any[]) => Logger.prototype.error(...args)