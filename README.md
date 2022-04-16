
# Discord AutoReply

Em resumo e um bot que utiliza as respotas do simsimi para responder mensagens do discord.

**Obs: Ele funciona em uma conta de usuario normal, ou seja, um selfbot, que e contra as TOS do discord.**

## Como funciona

A cada 10 minutos o bot ira responder a ultima mensagem de todos os chats especificados pra ele, se voce nao quiser esperar voce pode digitar .start, caso alguem o mencione ou diga umas das palavras de gatilho o bot tambem respondera

## Configurando e Iniciando 

Em src/config existe um arquivo config.json, suas configuracoes sao:


### Configurando

| Chave             | Valor                                                                |
| ----------------- | ------------------------------------------------------------------ |
| token | token da sua conta, contido no cabecalho Authorization |
| ownerId | todos os usuarios que poderao utilizar os comandos do bot |
| names | todas as mensagens que contem qualquer uma das palavras contidas nesta array, o bot respondera |
| luckyInteraction | quando o bot nao sabe responder, ele tem uma chance de 0% a 100% de responder com um emoji ou sticker do server, a porcentagem e definida aqui |
 channelsInteract | Os chats no qual o bot respondera a ultima mensagem a cada 10 minutos |


Em src/config/security.json
| Chave             | Valor                                                                |
| ----------------- | ------------------------------------------------------------------ |
| bannedWords | as mensagens com as palavras contidas aqui, o bot nao respondera mesmo que o mencione |

Em src/config/aliases.json voce pode colocar qualquer chave: [valor]

**Obs: todos os valores deve ser um array de string, e mesmo que voce deixe vazio, voce precia colocar pelo menos uma string vazia**

### Iniciando

No diretorio raiz:
```bash
npm install
```
Depois para iniciar o bot
```bash
npm start
```