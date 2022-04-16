import { Message } from 'discord.js';

export interface MessagePossesion {
    isDm: boolean;
    isBot: boolean;
    ifTempUser: {
        userIsTemp: boolean;
        correctChannel: boolean;
    };
    existRef: boolean;
    mentionMine: boolean;
}

export interface PendingRes {
    acRes: {
        msg: Message;
        content: string;
    }[]
}
