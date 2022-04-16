import Discord, { Message, Intents } from 'discord.js';

// modules
import BotAutoReply from './BotAutoReply';

// configs
import config from './config/config.json';

const client = new Discord.Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS] });

const autoReply = new BotAutoReply(client);

client.on('ready', () => {
    console.log('Started');
    autoReply.loopInteract();
});

client.on('message', (msg) => {
    if (msg.author?.id === client.user?.id) return;

    autoReply.workMsg(msg as Message);
});

client.login(config.token);
