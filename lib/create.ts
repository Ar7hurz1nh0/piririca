import { appendFileSync } from 'fs'
import { argv } from 'process'

const commandTemplate = `import { Interaction, choiceInterface, getInteractionArgs as Args } from 'global';\n\nexport default {\n  description: "Example description",\n  choices: [] as choiceInterface[],\n  async run(interaction: Interaction, args: Args) {\n    /**\n     * Your code goes here\n     */\n  }\n};` as string
const eventTemplate = `import { Bot } from "global"\n\nexport default function (this: Bot) {\n  /**\n   * Your code goes here\n   */\n}` as string

switch (argv[2]) {
  case 'event': {
    ((name: string) => {
      try { appendFileSync(`src/event/${name}.ts`, eventTemplate) }
      catch (e) { throw e }
    })(argv[3])
    break
  }
  case 'command': {
    ((name: string) => {
      try { appendFileSync(`src/cmd/${name}.ts`, commandTemplate) }
      catch (e) { throw e }
    })(argv[3])
    break
  }
  default: throw new Error(`Invalid command ${argv[2]}`)
}
