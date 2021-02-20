const https = require('https');
const { Telegraf } = require('telegraf');
const cheerio = require('cheerio');
const schedule = require('node-schedule');

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

let jobs = [];

const bot = new Telegraf(`${process.env.BOT_TOKEN}`);

bot.help((ctx) => ctx.replyWithHTML(`
    Witaj w domowy robocie!
    <code>/decathlon {url}</code> - sprawdza czy dany produkt jest dostępny w sklepie decathlon.pl
`))

bot.command('decathlon', async (ctx) => {
    const [cmd, url, ...crons] = ctx.message.text.split(' ');
    const cron = crons.join(' ');
    jobs.push(schedule.scheduleJob(cron, async () => {
        const { available } = await checkAvailibility(url.trim());
        ctx.replyWithHTML(`Powyzszy produkt <b>${available ? 'jest' : 'nie jest'} dostępny</b>`, {
            reply_to_message_id: ctx.message.message_id,
        });    
    }));
});

bot.command('clear', async (ctx) => {
    jobs.forEach(job => job.cancel());
    jobs = [];
});



bot.launch();

process.once('SIGINT', () => {
    jobs.forEach(job => job.cancel());
    jobs = [];
    return bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
    jobs.forEach(job => job.cancel());
    jobs = [];
    return bot.stop('SIGTERM');
});
