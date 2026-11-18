const { Telegraf } = require('telegraf');
const http = require('http');

// Токен берется из защищенных настроек Render
const bot = new Telegraf(process.env.BOT_TOKEN);

// Команда /start (аналог вашего cmd_start)
bot.start((ctx) => {
  const userName = ctx.from.first_name || 'друг';
  ctx.reply(`Привет, ${userName}! 🎾 Бот теннисной школы успешно запущен и работает 24/7!`);
});

// Эхо-ответ на любое текстовое сообщение (аналог echo_message)
bot.on('text', (ctx) => {
  ctx.reply(`Вы написали: ${ctx.message.text}`);
});

// Запуск бота
bot.launch();
console.log("Бот запущен и ожидает сообщения...");

// Мини-веб-сервер для Render (чтобы хостинг не выключал приложение)
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot is running');
}).listen(process.env.PORT || 3000);
