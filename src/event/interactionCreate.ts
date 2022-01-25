import { Bot, commandInterface, Interaction } from "global"
import { error } from "../../lib/log4"

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
    error(e);
  }
}