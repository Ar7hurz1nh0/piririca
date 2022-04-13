# Piririca Bot

## An open, reliable, modular and "Plug & Play" discord bot

Developed with modularity in mind, Piririca achieves an simple but extensive way to create a bot with a lot of features. It comes out of the box with hot-reloading commands/events, as well with a some commands and events to serve as a template for your own commands and events.

Interacting with Voice Channels is also possible, though it is still in alpha, so have that in mind.

## Configuration

1. Clone the repository

2. Install the dependencies (We use [pnpm](https://pnpm.js.org/)!)

3. Build the bot with `pnpm build`

4. Run the bot with `pnpm start`

The bot will ask for some information like your token, app id, commands/events folder path, bot status, bot activity, if you want to enable hot-reloading, etc. The bot will then create a config file and start.

## Commands / Events

### Commands
The default folder path for commands is `src/cmd`, you can change it by editing the config file or not skipping it on the [configuration](#configuration) step.

To create a new command, execute on a terminal `pnpm create command <command-name>`

Every file in the folder represents a slash command on the bot, and its file name translates to the command name.

### Events
The default folder path for events is `src/event`, you can change it by editing the config file or not skipping it on the [configuration](#configuration) step.

To create a new event, execute on a terminal `pnpm create event <event-name>`

Every file in the folder represents an event on the bot, and its file name translates to the event name.
Also, the events names comes from the discord.js library. You can see a full list of the events names [here](https://discord.js.org/#/docs/main/stable/class/Client)

## The modularity part
Now let's see some strange setups that are possible with Piririca.
Let's say you want to create multiple instances of a bot (or even different ones). The only thing you need to do is copy and change some things on the `index.ts` and done! You can have infinite sets of bots with infinite sets of commands and events

## Contributing
To contribute, you can create an issue explaning a bug you encontered or a feature you want to see. Also, you can create a pull request to add a new feature or fix a bug, or even create new default commands.