const { Telegraf, Markup } = require('telegraf');
const http = require('http');

const bot = new Telegraf(process.env.BOT_TOKEN);

// 👉 ЗАМЕНИТЕ НОЛЬ НА СВОЙ ЧИСЛОВОЙ TELEGRAM ID (чтобы заявки приходили вам)
// Узнать свой ID можно в Telegram у бота @userinfobot
const ADMIN_ID = 8347565487; 

// Храним тех, кто ждет ввода телефона
const waitingForPhone = new Set();

// Главное меню с кнопками
const mainMenu = Markup.keyboard([
  ['📅 Расписание и цены', '🎾 Записаться на тренировку'],
  ['📍 г. Самарканд ,ул. Лутфи,1 ', 'ℹ️ Мы — профессиональная школа большого тенниса, где каждый игрок выходит на новый уровень. 🎾
Что вас ждет у нас:
🏟 6 современных кортов (включая 1 крытый для комфортной игры в любую погоду).
🏆 Профессиональные тренеры с опытом подготовки как новичков, так и турнирных игроков.
📈 Эффективные программы для детей и взрослых.']
]).resize();

// Команда /start
bot.start((ctx) => {
  waitingForPhone.delete(ctx.from.id);
  const userName = ctx.from.first_name || 'друг';
  ctx.reply(
    `Привет, ${userName}! 👋 Добро пожаловать в теннисную школу **MyTeam Samarkand**!\n\nВыберите нужный раздел в меню ниже:`,
    { parse_mode: 'Markdown', ...mainMenu }
  );
});

// Раздел: Расписание и цены
bot.hears('📅 Расписание и цены', (ctx) => {
  ctx.reply(
    `📅 **Расписание занятий:**\n` +
    `• Понедельник – Суббота: с 08:00 до 22:00\n` +
    `• Воскресенье: выходной / турнирные дни\n\n` +
    `💳 **Стоимость:**\n` +
    `• Разовое занятие: 100 000 сум\n` +
    `• Абонемент (8 занятий): 700 000 сум\n` +
    `• Индивидуальная тренировка: 150 000 сум`,
    { parse_mode: 'Markdown' }
  );
});

// Раздел: О клубе
bot.hears('ℹ️ О клубе', (ctx) => {
  ctx.reply(
    `🏆 **MyTeam Samarkand** — профессиональные тренировки для детей и взрослых с любым уровнем подготовки.\n\n` +
    `✅ Опытные тренеры\n` +
    `✅ Современные корты и инвентарь\n` +
    `✅ Уютная атмосфера`,
    { parse_mode: 'Markdown' }
  );
});

// Раздел: Адрес и контакты
bot.hears('📍 Адрес и контакты', (ctx) => {
  ctx.reply(
    `📍 **Наш адрес:** г. Самарканд\n` +
    `📞 **Телефон для справок:** +998 90 123-45-67\n` +
    `📲 **Администратор:** @ваш_ник`,
    { parse_mode: 'Markdown' }
  );
});

// Раздел: Записаться
bot.hears('🎾 Записаться на тренировку', (ctx) => {
  waitingForPhone.add(ctx.from.id);
  ctx.reply(
    `Напишите ваше **Имя и номер телефона** (или нажмите кнопку ниже, чтобы отправить номер автоматически):`,
    {
      parse_mode: 'Markdown',
      ...Markup.keyboard([
        [Markup.button.contactRequest('📱 Отправить мой номер телефона')],
        ['❌ Отмена']
      ]).resize()
    }
  );
});

// Кнопка отмены
bot.hears('❌ Отмена', (ctx) => {
  waitingForPhone.delete(ctx.from.id);
  ctx.reply('Запись отменена. Возвращаемся в главное меню:', mainMenu);
});

// Обработка контакта по кнопке
bot.on('contact', async (ctx) => {
  waitingForPhone.delete(ctx.from.id);
  const contact = ctx.message.contact;
  const user = ctx.from;

  await ctx.reply('✅ Спасибо! Ваша заявка принята. Администратор свяжется с вами в ближайшее время!', mainMenu);

  if (ADMIN_ID && ADMIN_ID !== 0) {
    await bot.telegram.sendMessage(
      ADMIN_ID,
      `🔥 **Новая заявка на тренировку!**\n\n` +
      `👤 Имя: ${contact.first_name}\n` +
      `📞 Телефон: ${contact.phone_number}\n` +
      `🔗 Профиль: ${user.username ? '@' + user.username : 'без юзернейма'}`,
      { parse_mode: 'Markdown' }
    );
  }
});

// Обработка текстового сообщения при записи
bot.on('text', async (ctx) => {
  if (waitingForPhone.has(ctx.from.id)) {
    waitingForPhone.delete(ctx.from.id);
    const user = ctx.from;

    await ctx.reply('✅ Спасибо! Ваша заявка принята. Администратор свяжется с вами в ближайшее время!', mainMenu);

    if (ADMIN_ID && ADMIN_ID !== 0) {
      await bot.telegram.sendMessage(
        ADMIN_ID,
        `🔥 **Новая заявка на тренировку!**\n\n` +
        `📝 Данные: ${ctx.message.text}\n` +
        `👤 От: ${user.first_name} (${user.username ? '@' + user.username : 'без юзернейма'})`,
        { parse_mode: 'Markdown' }
      );
    }
  } else {
    ctx.reply('Используйте кнопки меню ниже 👇', mainMenu);
  }
});

bot.launch();
console.log("Бот запущен и готов к работе!");

// Веб-сервер для Render, чтобы приложение работало 24/7
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot is running');
}).listen(process.env.PORT || 3000);
