import { scheduleJob } from 'node-schedule'
import { appendFileSync } from 'fs'
import type { choiceInterface, Interaction, getInteractionArgs as Args } from "global";

export default {
  description: "Schedule an alarm to play on a voice channel",
  choices: [{
    name: "day",
    type: "number",
    description: "What day of the month to set the alarm for",
    required: true
  },
  {
    name: "hour",
    type: "number",
    description: "What hour to set the alarm for",
    required: true
  },
  {
    name: "minute",
    type: "number",
    description: "What minute to set the alarm for",
    required: true
  }] as choiceInterface[],
  async run(interaction: Interaction, args: Args) {
    console.log(args)
    interaction.reply({ content: "Scheduling alarm...", ephemeral: true })
  }
}