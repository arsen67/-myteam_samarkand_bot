const { Telegraf } = require('telegraf');
const http = require('http');

// Вставьте сюда ваш новый токен (лучше через Environment Variables в Render)
const bot = new Telegraf(process.env.BOT_TOKEN || '9122941466:AAGZsRaw1_Fioet-seLItAnVfpqUUbkJq_I');

bot.start((ctx) => ctx.reply('Привет! Бот успешно запущен на Node.js!'));
bot.on('text', (ctx) => ctx.reply(`Вы написали: ${ctx.message.text}`));

bot.launch();

// Мини-сервер, чтобы Render не выключал бесплатный Web Service из-за отсутствия порта
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot is running');
}).listen(process.env.PORT || 3000);
