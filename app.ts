import https from 'https';
import { Telegraf } from 'telegraf';
import cheerio from 'cheerio';

function call () {}

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

const bot = new Telegraf(process.env.BOT_TOKEN);


bot.start((ctx) => ctx.reply('Welcome'))
bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on('sticker', (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))
bot.command('hipster', Telegraf.reply('λ'))
bot.command('oldschool', (ctx) => ctx.reply('Hello'))
bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
