import { Bot, commandInterface, Interaction } from "global"
import { Logger } from "../../lib/log4"

const logger = new Logger("interactionCreate", { hideFile: true })

export default function (this: Bot, interaction: Interaction) {
  if (!interaction.isCommand()) return
  const { commandName } = interaction
  const command = this.commands.find((cmd: commandInterface) => {
    if (cmd.name === commandName) return cmd
  })
  if (!command) return
  try {
    command.run(interaction, this.getArgs(command.choices, interaction as any as Interaction))
  }
  catch (e)  {
    logger.error(e);
  }
}