const { Telegraf, Markup } = require('telegraf');
const http = require('http');

const bot = new Telegraf(process.env.BOT_TOKEN);

const ADMIN_ID = 8347565487; 
const waitingForPhone = new Set();

const mainMenu = Markup.keyboard([
  ['🎾 Записаться на тренировку'],
  ['📍 Адрес и контакты', 'ℹ️ О клубе']
]).resize();

bot.start((ctx) => {
  waitingForPhone.delete(ctx.from.id);
  const userName = ctx.from.first_name || 'друг';
  ctx.reply(
    `Привет, ${userName}! 👋 Добро пожаловать в теннисную школу **MyTeam Samarkand**!\n\nВыберите нужный раздел в меню ниже:`,
    { parse_mode: 'Markdown', ...mainMenu }
  );
});

bot.hears('ℹ️ О клубе', (ctx) => {
  ctx.reply(
    `ℹ️ Мы — профессиональная школа большого тенниса, где каждый игрок выходит на новый уровень.`,
    { parse_mode: 'Markdown' }
  );
});

bot.hears('📍 Адрес и контакты', (ctx) => {
  ctx.reply(
    `📍 г. Самарканд, ул. Лутфи, 1\n📞 тел: +998910993399`,
    { parse_mode: 'Markdown' }
  );
});

bot.hears('🎾 Записаться на тренировку', (ctx) => {
  waitingForPhone.add(ctx.from.id);
  ctx.reply(
    `Напишите ваше **Имя и номер телефона** (или нажмите кнопку ниже, чтобы отправить контакт автоматически):`,
    {
      parse_mode: 'Markdown',
      ...Markup.keyboard([
        [Markup.button.contactRequest('📱 Отправить мой номер телефона')],
        ['❌ Отмена']
      ]).resize()
    }
  );
});

bot.hears('❌ Отмена', (ctx) => {
  waitingForPhone.delete(ctx.from.id);
  ctx.reply('Запись отменена. Возвращаемся в главное меню:', mainMenu);
});

bot.on('contact', async (ctx) => {
  waitingForPhone.delete(ctx.from.id);
  const contact = ctx.message.contact;
  const user = ctx.from;

  await ctx.reply('✅ Спасибо! Ваша заявка принята. Администратор свяжется с вами в ближайшее время!', mainMenu);

  if (ADMIN_ID) {
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

bot.on('text', async (ctx) => {
  if (waitingForPhone.has(ctx.from.id)) {
    waitingForPhone.delete(ctx.from.id);
    const user = ctx.from;

    await ctx.reply('✅ Спасибо! Ваша заявка принята. Администратор свяжется с вами в ближайшее время!', mainMenu);

    if (ADMIN_ID) {
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

http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot is running');
}).listen(process.env.PORT || 3000);
