import { log as log1, error as logE1, warn as logW1 } from 'console'
import colors from 'chalk';
import path from 'path';
import type { colors as Colors, bgColors } from 'global';

export const defaultColors: { [x: string]: Colors } = {
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

export const tokenTypes = [
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

function getTokens(json: any) {
  const tokens = [ ];

  let input: any = typeof json === 'string' ? json : JSON.stringify(json, null, 2);
  let foundToken: boolean;

  do {
    foundToken = false;
      for(let i of tokenTypes) {
        let match = i.regex.exec(input);
        if(match) {
          tokens.push({
            type: i.tokenType,
            value: match[0]
          });
          input = input.substring(match[0].length);
          foundToken = true;
          break;
        }
      }
    } while(input.length > 0 && foundToken);
  return tokens;
}

function date(): Array<string|number> { 
  const min = new Date().getMinutes()
  const sec = new Date().getSeconds()
  return [
    new Date().getHours(),
    min < 10 ? "0" + min : min,
    sec < 10 ? "0" + sec : sec
  ]
}

function messageHandler(message: unknown): string {
  if (message === null) return "null"
  if (message instanceof Array) return "[" + message.map(messageHandler).join(", ") + "]"
  if (message instanceof Error) return String(message)
  if (message instanceof Date) return message.toString()
  if (message instanceof Map) return "[" + Array.from(message.entries()).map(messageHandler).join(", ") + "]"
  if (message instanceof Set) return "[" + Array.from(message.values()).map(messageHandler).join(", ") + "]"
  if (message instanceof Function) return `[Function ${message.name}]`
  message = typeof message !== "string" ? JSON.stringify(message) : message
  try { message = JSON.parse(message as string) }
  catch (e) { void 0 }
  switch (typeof message) {
    case "string": return String(message)
    case "number": return String(message)
    case "boolean": return String(message)
    case "undefined": return "undefined"
    case "object": return JSON.stringify(message)
    default: return "unknown"
  }
}

function getFullStack(): string {
  let stack: any
  try { throw new Error('') }
  catch (error: any) { stack = error.stack }
  return stack
}

function logW(message: unknown, stack: string | void): void {
  logW1(colors.yellow(`[${date().join(":")}] [${typeof stack === "string" ? stack : getStack()}|WARN]: ${messageHandler(message)}`))
}

function logE(message: unknown, stack: string | void | null | undefined, Throw: boolean | void): void {
  logE1(colors.red(`[${date().join(":")}] [${typeof stack === "string" ? stack : getStack()}|${Throw ? "FATAL" : "ERROR"}]: ${messageHandler(message).replace("Error: ", "")}`))
  if (typeof Throw === "boolean" && Throw) throw new Error(String(messageHandler(message)))
}

function getStack(): string {
  const basePath = process.cwd() + "/"
  const baseModule = path.resolve(__dirname, __filename).replace(basePath, "")
  let stack: any
  try { throw new Error('') }
  catch (error: any) { stack = error.stack }
  stack = stack.split('\n').map((line: string) => { return line.trim() })

  for (const i of stack) {
    const Path = i.split('(').length > 1
      ?
    i.split('(')[1].replace(basePath, "").split(":")[0]
      :
    i.split('(')[0].replace("at ", "").replace(basePath, "").split(":")[0]
    if (Path === baseModule || Path === "Error" || Path === "<anonymous>)" || Path.includes("node")) continue
    stack = Path
    break
  }

  return stack
}

function getInfo() {
  return (
    `$c white [` + date().join(":") + `] ` +
    `[` +
    getStack( ) +
    `|INFO]:$$ `
  );
}

export default function (...args: any[ ]) {
  [...args].forEach((value) => {
    let isObject = typeof value === 'object';
    value = messageHandler(value);
    if(isObject) {
      let keys = getTokens(value);
      value = keys.reduce((acc, token: { type: any, value: any}) => {
        let colorKey = defaultColors[token.type];
        if(token.type == 'BOOLEAN_LITERAL') {
          colorKey = token.value == 'true' ? 'cyan' : 'red';
        } 
        return acc + (`$c ${colorKey} ${token.value} $$`);
      }, '\n');
    }
    value = getInfo() + value;
    value = value.replace(/\$c (\w+) (.+?)\$\$/g, (str: any, color: Colors, content: any) => {
      return colors[color](content)
    })
    value = value.replace(/\#c (\w+) (.+?)\#\#/g, (str: any, color: Colors, content: any) => {
      const Color: bgColors = 'bg' + color.charAt(0).toUpperCase() + color.slice(1) as bgColors;
      return colors[Color](content)
    })
    log1(value)
  });
}

export function warn(...args: string[ ]) {
  [...args].forEach((arg) => {
    arg = arg.replace(/\$c (\w+) (.+?)\$\$/g, (str: any, color: Colors, content: string) => {
      return colors[color](content)
    })
    arg = arg.replace(/\#c (\w+) (.+?)\#\#/g, (str: any, color: Colors, content: any) => {
      const Color: bgColors = 'bg' + color.charAt(0).toUpperCase() + color.slice(1) as bgColors;
      return colors[Color](content)
    })
      logW(arg, getStack());
  });
}

export { logE as error}