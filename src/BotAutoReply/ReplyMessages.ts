import axios from 'axios';

// interfaces
import { Client, Message, User } from 'discord.js';
import { MessagePossesion, PendingRes } from './interfaces/messages-interface';
import Config from './interfaces/config-interface';

// utils
import sleep from './utils/sleep';
import shuffle from './utils/shuffle';

// config
import aliases from '../config/aliases.json';
import security from '../config/security.json';
import configJson from '../config/config.json';
import lucky from './utils/lucky';

const config = configJson as Config;

export default class ReplyMessages {
    private _client: Client;

    private _channelsInteract: string[];

    private _tempUsers: Array<[string, string]> = [];

    private _pendingRes: Map<string, PendingRes> = new Map();

    constructor(_client: Client) {
        this._client = _client;
        this._pendingRes = new Map();
        this._channelsInteract = config.channelsInteract;
    }

    public async loopInteract(): Promise<void> {
        setInterval(() => {
            this.sendMessageForAllChannels();
        }, 500000);
    }

    private async getSimsimiResponse(text: string): Promise<string> {
        type SimsimiResponse = {
            messages: { text: string; }[];
            database: boolean;
        };

        try {
            const { data }: { data: SimsimiResponse } = await axios.get('http://api.simsimi.net/v2/', {
                params: {
                    text,
                    lc: 'pt',
                    key: 'API-TEST-WEB',
                    cf: 'true'
                }
            });

            return data.messages[0].text;
        } catch (e) {
            return '';
        }
    }

    private checkIfMentionName(text: string): boolean {
        let mentionName = false;

        for (const name of config.names) {
            if (text.indexOf(name) !== -1) mentionName = true;
        }

        return mentionName;
    }

    private whereIsMsg(msg: Message): MessagePossesion {
        const msgContent = msg.content.toLowerCase();

        const ifTempUser = {
            correctChannel: false,
            userIsTemp: false
        };

        for (const tempUser of this._tempUsers) {
            if (msg.author.id === tempUser[0]) {
                ifTempUser.userIsTemp = true;

                if (msg.channel.id === tempUser[1]) ifTempUser.correctChannel = true;
            }
        }

        const isDm = msg.channel.type === 'DM';
        const isBot = msg.author.bot ?? false;
        const existRef = !!msg.reference;
        const mentionMine = msg.mentions.has(this._client.user as User) || this.checkIfMentionName(msgContent);

        return {
            isDm,
            isBot,
            ifTempUser,
            existRef,
            mentionMine
        };
    }

    private async ifStartCommand(text: string): Promise<void> {
        const command = text.split(' ')[0];
        if (command === '.start') this.sendMessageForAllChannels();
    }

    private async sendMessageForAllChannels(): Promise<void> {
        for (const channelId of this._channelsInteract) {
            this._client.channels.fetch(channelId)
                .then((channel) => {
                    if (!channel) return;

                    (channel as any).messages.fetch({ limit: 1 }).then((messages: any) => {
                        if (!messages) return;

                        const lastMessage = messages.first() as Message;

                        if (lastMessage.author.id === this._client.user?.id
                            || lastMessage.author.bot) return;

                        this.workSimsimi(this.cleanString(lastMessage.content)).then((res: string | null) => {
                            this.replyMsg(res || '', lastMessage, true);
                        });
                    }).catch(() => { });
                });
        }
    }

    private cleanSimsimi(text: string): string {
        let newText = text;

        const simsimi = ['simsimi', 'sim simi'];

        for (const wordS of simsimi) {
            const replace = wordS;

            const re = new RegExp(replace, 'g');

            newText = newText.replace(re, '');
        }

        return newText;
    }

    private cleanString(text: string): string {
        let newText = text.replace(/[^a-zA-Z0-9!@#$%^&àáãâèéêíìóòõôùú*()._ ?<>;'"/\][{}+-]/g, '');

        const replace1 = /<@[0-9]+>/;
        const replace2 = /<@![0-9]+>/;

        const re1 = new RegExp(replace1, 'g');
        const re2 = new RegExp(replace2, 'g');

        newText = newText.replace(re1, (word) => (word === `<@${this._client.user?.id}>` ? '' : 'Matheus'));
        newText = newText.replace(re2, (word) => (word === `<@!${this._client.user?.id}>` ? '' : 'Matheus'));

        for (let index = 0; index < newText.length; index++) {
            const initial = newText.indexOf('<');
            const final = newText.indexOf('>');

            if (initial === -1 || final === -1) break;

            newText = newText.replace(newText.substring(initial, final + 1), '');
        }

        newText = newText.toLowerCase();

        for (const name of config.names) {
            const replace = name;

            const re = new RegExp(replace, 'g');

            newText = newText.replace(re, '').replace(/\s+/g, ' ').trim();
        }

        if (!newText && (this.checkIfMentionName(text)
            || text.indexOf(`<@${this._client.user?.id}>`) !== -1
            || text.indexOf(`<@${this._client.user?.id}>`) !== -1
        )) newText = 'sim simi';

        return newText.replace(/\s+/g, ' ').trim();
    }

    private removeTempUser(userId: string): void {
        for (let index = 0; this._tempUsers.length > index; index++) {
            if (this._tempUsers[index][0] === userId) this._tempUsers.splice(index, 1);
        }
    }

    private addTempUser(userId: string, channelId: string): void {
        this._tempUsers.push([userId, channelId]);

        setTimeout(() => {
            this.removeTempUser(userId);
        }, 15000);
    }

    private async lineReply(text: string, msg: Message, stickerId: string | null = null): Promise<void> {
        try {
            if (!stickerId) {
                msg.reply(text).catch(() => {});
                return;
            }

            msg.reply({
                stickers: [stickerId]
            }).catch(() => {});
        } catch (e) {
            //
        }
    }

    private async replyMsg(text: string, msg: Message, interaction: boolean): Promise<void> {
        if (interaction) {
            if (!text) {
                if (!lucky(config.luckyInteraction)) return;

                msg.channel.sendTyping();

                await sleep(1000);

                await this.sendInteraction(msg, lucky(50));

                return;
            }
        }

        msg.channel.sendTyping();

        await sleep(50 * text.length);

        await this.lineReply(text, msg);
    }

    private async sendInteraction(msg: Message, forceEmoji: boolean = false): Promise<void> {
        try {
            let stickerId: string | null = '';

            if (!forceEmoji) stickerId = await this.getRandomStickerId(msg.guild?.id as string);

            if (!stickerId) {
                const emojiId = await this.getRandomEmoji(msg.guild?.id as string);

                if (!emojiId) return;

                await this.lineReply(emojiId, msg);

                return;
            }

            await this.lineReply('', msg, stickerId);
        } catch (e) {
            //
        }
    }

    private async getRandomStickerId(guildId: string): Promise<string | null> {
        try {
            const { data }: {
                data: {
                    id: string;
                    name: string;
                    tags: string;
                    type: number;
                    format_type: number;
                    description: string;
                    asset: string;
                    available: boolean;
                    guild_id: string;
                }[]
            } = await axios.get(`https://discord.com/api/v9/guilds/${guildId}/stickers`, {
                headers: {
                    Authorization: `Bot ${config.token}`
                }
            });

            return shuffle(data)[0].id;
        } catch (e) {
            return null;
        }
    }

    private async getRandomEmoji(guildId: string): Promise<string | null> {
        try {
            const { data }: {
                data: {
                    name: string;
                    roles: string[];
                    id: string;
                    require_colons: boolean;
                    managed: boolean;
                    animated: boolean;
                    available: boolean
                }[]
            } = await axios.get(`https://discord.com/api/v9/guilds/${guildId}/emojis`, {
                headers: {
                    Authorization: `Bot ${config.token}`
                }
            });

            const emojis = data.filter((v) => !v.animated);
            const emoji = shuffle(emojis)[0];

            return `<:${emoji.name}:${emoji.id}>`;
        } catch (e) {
            return null;
        }
    }

    private hasBannedWord(text: string): boolean {
        let hasBannedWord = false;

        for (const word of security.bannedWords) {
            if (text.toLowerCase().indexOf(word) !== -1) hasBannedWord = true;
        }

        return hasBannedWord;
    }

    private changeCensure(text: string): string {
        const wordX = ['.'];

        const newText = text.replace(/_/g, () => shuffle(wordX)[0]);

        return newText;
    }

    private async workSimsimi(content: string): Promise<string | null> {
        try {
            let res = await this.getSimsimiResponse(content);
            console.log(`${content} | ${res}`);

            if (!res) return null;

            if (res.length > 160) return null;

            if (this.hasBannedWord(content) || this.hasBannedWord(res)) return '';

            res = this.changeIfAliases(res);

            return this.changeCensure(res);
        } catch (e) {
            return null;
        }
    }

    private changeIfAliases(text: string): string {
        for (const a of Object.keys(aliases)) {
            if (a === text) return shuffle<string>(aliases[a as keyof typeof aliases])[0];
        }

        return text;
    }

    private async addPendingMsg(channelId: string, msg: Message, content: string): Promise<void> {
        let hasResponding = false;
        try {
            if (content) {
                // eslint-disable-next-line no-param-reassign
                content = await this.workSimsimi(content) || '';

                // eslint-disable-next-line no-param-reassign
                content = this.cleanSimsimi(content);
            }
        } catch (e) {
            // eslint-disable-next-line no-param-reassign
            content = '';
        }

        // eslint-disable-next-line no-unused-vars
        for (const [key, value] of this._pendingRes) {
            if (channelId === key) {
                hasResponding = true;
                value.acRes.push({
                    msg,
                    content
                });
            }
        }

        if (!hasResponding) {
            this._pendingRes.set(channelId, {
                acRes: [{
                    msg,
                    content
                }]
            });

            this.linearResponds(channelId);
        }
    }

    private async linearResponds(channelId: string): Promise<void> {
        const channelRes = this._pendingRes.get(channelId)?.acRes;

        if (!channelRes) return;
        if (channelRes.length === 0) return;

        const { msg, content } = channelRes.splice(0, 1)[0];

        await this.replyMsg(content, msg, true);

        await sleep(1000);

        if (channelRes.length !== 0) {
            this.linearResponds(channelId);
        } else {
            this._pendingRes.delete(channelId);
        }
    }

    public async workMsg(msg: Message): Promise<void> {
        const {
            isDm, isBot, ifTempUser, mentionMine, existRef
        } = this.whereIsMsg(msg);

        const userId = msg.author.id;

        if (config.ownerId.indexOf(userId) !== -1) this.ifStartCommand(msg.content);

        if (!mentionMine && existRef) return;
        if (((!mentionMine && !ifTempUser.userIsTemp) || (!mentionMine && existRef)) || isBot) return;

        const msgContent = this.cleanString(msg.content);

        if (mentionMine && !isDm) {
            if (ifTempUser.userIsTemp) this.removeTempUser(userId);
            this.addTempUser(msg.author.id as string, msg.channel.id as string);
        }

        this.addPendingMsg(msg.channel.id, msg, msgContent);
    }
}
