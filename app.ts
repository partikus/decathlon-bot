const https = require('https');
const { Telegraf } = require('telegraf');
const cheerio = require('cheerio');
const {  CronJob } = require('cron');

function loadPage (url: string): Promise<cheerio.Root|undefined> {
    return new Promise((resolve, reject) => {
        const req = https.get(url, res => {
            let output = '';
            res.setEncoding('utf-8');
            res.on('data', d => {
                output += d;
            });
            res.on('end', () => {
                resolve(cheerio.load(output));
            });
        });
        req.on('error', err => {
            reject(err);
        });
        req.end();
    });
}

async function checkAvailibility(url: string): Promise<{ available: boolean, url: string }> {
    let $;
    try {
        $ = await loadPage(url);
        const available = $('.stock-notification__invite--active').length === 0;
        return {
            available,
            url,
        };
    } catch (e) {
        console.error(e);
    }
    return {
        available: false,
        url,
    };
}

const bot = new Telegraf(process.env.BOT_TOKEN);


bot.start((ctx) => ctx.reply('Welcome'))
bot.help((ctx) => ctx.replyWithHTML(`
Witaj w domowy robocie!
<code>/decathlon {url}</code> - sprawdza czy dany produkt jest dostępny w sklepie decathlon.pl
`))
bot.on('sticker', (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))
bot.command('hipster', Telegraf.reply('λ'))
bot.command('decathlon', async (ctx) => {
    const [cmd, url] = ctx.message.text.split(' ');
    const { available } = await checkAvailibility(url.trim());

    ctx.replyWithHTML(`Powyzszy produkt <b>${available ? 'jest' : 'nie jest'} dostępny</b>`, {
        reply_to_message_id: ctx.message.message_id,
    });
});


bot.on('inline_query', (ctx) => {
    const result = []
    // Explicit usage
    ctx.telegram.answerInlineQuery(ctx.inlineQuery.id, result)
  
    // Using context shortcut
    ctx.answerInlineQuery(result)
});
  
bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
