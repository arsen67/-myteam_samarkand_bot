const { Telegraf, Markup } = require('telegraf');
const http = require('http');

// Лучше хранить токен в переменных окружения (BOT_TOKEN), но оставил ваш как запасной вариант
const BOT_TOKEN = process.env.BOT_TOKEN || '9122941466:AAFz1rCthnzWNBXSjrBouee3CUSIrat-dsI';
const bot = new Telegraf(BOT_TOKEN);

// ID администратора, куда приходят заявки
const ADMIN_ID = 8347565487;
const ADMIN_USERNAME = '@myteam_samarkand';

// Состояния пользователей для записи:
// userId -> { step: 'waiting_consent' | 'waiting_data', consentGiven: boolean, lang: 'ru' | 'uz' }
const bookingSessions = new Map();

// Язык пользователя по умолчанию — русский (можно переключать в оферте/ПД)
const userLang = new Map();
const getLang = (userId) => userLang.get(userId) || 'ru';

const mainMenu = Markup.keyboard([
  ['💰 Тарифы', '🎾 Записаться на тренировку'],
  ['📄 Договор оферты', '🔒 Согласие на обработку ПД'],
  ['📍 Адрес и контакты', 'ℹ️ О клубе']
]).resize();

// Команда /start
bot.start((ctx) => {
  bookingSessions.delete(ctx.from.id);
  const userName = ctx.from.first_name || 'друг';
  ctx.reply(
    `Привет, ${userName}! 👋 Добро пожаловать в теннисную школу **MyTeam Samarkand**!\n\n` +
    `Выберите нужный раздел в меню ниже:`,
    { parse_mode: 'Markdown', ...mainMenu }
  );
});

// Кнопка: 💰 Тарифы (актуальный прайс-лист)
bot.hears('💰 Тарифы', (ctx) => {
  ctx.reply(
    `💰 **ТАРИФЫ — БОЛЬШОЙ ТЕННИС (САМАРКАНД)**\n` +
    `📍 Адрес кортов: г. Самарканд, ул. Лутфи, 1\n\n` +
    `• **Разовая индивидуальная тренировка** (60 мин на корте) — **500 000 сум**\n` +
    `  _Возможна бронь и выкуп времени на месяц_\n` +
    `• **Абонемент: индивидуальные занятия** (12 × 60 мин на корте) — **6 000 000 сум**\n` +
    `• **Абонемент: сплит-тренировки (2 чел.)** (12 × 60 мин на корте) — **4 000 000 сум / чел.**\n` +
    `• **Абонемент: мини-группа (4 чел.)** (12 × 120 мин: 60 мин ОФП + 60 мин корт) — **2 000 000 сум / чел.**\n` +
    `• **Абонемент: группа (8–10 чел.)** (12 × 120 мин: 60 мин ОФП + 60 мин корт) — **1 200 000 сум / чел.**\n\n` +
    `📌 **Основные правила:**\n` +
    `• Срок действия абонемента: **30 календарных дней** с даты 1-го занятия.\n` +
    `• Оплата: **100% предоплата** (наличные, перевод на карту, Payme, Click, Uzum).\n` +
    `• Перенос индивидуальных занятий — не позднее чем за **24 часа**.\n` +
    `• Пропуски в группах не переносятся (исключение: болезнь > 5 занятий подряд при наличии справки; при дожде/ветре на открытом корте занятие переносится без списания).\n` +
    `• Форма: спортивная одежда и обувь **non-marking** (ракетка и мячи предоставляются).\n\n` +
    `Для записи и вопросов: ${ADMIN_USERNAME}`,
    { parse_mode: 'Markdown' }
  );
});

// Тексты Договора оферты (RU / UZ)
function getOfertaText(lang) {
  if (lang === 'uz') {
    return (
      `📄 **OMMAVIY OFERTA**\n` +
      `_Katta tennis bo‘yicha mashg‘ulotlar o‘tkazish xizmatlari to‘g‘risida (Samarqand sh., Lutfiy ko‘chasi, 1-uy)_\n\n` +
      `**1. Ofertani akseptlash (O‘zR FK 369-moddasi):** 100% oldindan to‘lov amalga oshirilishi ushbu Oferta shartlarini to‘liq qabul qilish hisoblanadi va yozma Shartnomaga tenglashtiriladi.\n\n` +
      `**2. Tariflar va muddat:**\n` +
      `• Bir martalik individual (60 daq.): 500 000 so‘m\n` +
      `• 12 ta individual abonement (60 daq.dan): 6 000 000 so‘m\n` +
      `• 12 ta split-mashg‘ulot (2 kishi, 60 daq.): 4 000 000 so‘m/kishi\n` +
      `• 12 ta mini-guruh (4 kishi, 60 daq. UJT + 60 daq. kort): 2 000 000 so‘m/kishi\n` +
      `• 12 ta guruh (8–10 kishi, 60 daq. UJT + 60 daq. kort): 1 200 000 so‘m/kishi\n` +
      `Abonement muddati — 1-mashg‘ulotdan 30 kalendar kun. Kort ijarasi va inventar narx ichida. Tariflar o‘zgarishi haqida messenjerda 10 kun oldin ogohlantiriladi.\n\n` +
      `**3. Ko‘chirish va qoldirish:**\n` +
      `• Individual: kamida 24 soat oldin ogohlantirilsa ko‘chiriladi; kechroq yoki kelmaganda kuyadi.\n` +
      `• Guruh (2, 4, 8–10 kishi): qoldirilgan darslar ko‘chirilmaydi.\n` +
      `• Kasallik: ketma-ket 5 tadan ortiq dars qoldirilganda (tibbiy ma’lumotnoma bilan) ko‘chiriladi.\n` +
      `• Ob-havo: ochiq kortda yomg‘ir/shamol bo‘lsa dars yechilmasdan ko‘chiriladi.\n` +
      `• Kechikish: vaqt uzaytirilmaydi.\n\n` +
      `**4. Hujjatlar va xavfsizlik:** 1-mashg‘ulotgacha Sog‘liq anketasi, abonement uchun 2-mashg‘ulotgacha 086/u ma’lumotnoma, 2 dona 3×4 rasm va pasport/guvohnoma nusxasi topshiriladi. Sport kiyimi va non-marking poyabzal majburiy.\n\n` +
      `**5. Qaytarish va aloqa:** Muddatidan oldin voz kechilganda ariza asosida o‘tkazilgan/yechilgan darslar (500 000 so‘mlik bir martalik tarif bo‘yicha) va band qilish xarajatlari chegirib qaytariladi. Telegram/WhatsApp yozishmalari yuridik kuchga ega.`
    );
  }

  return (
    `📄 **ПУБЛИЧНАЯ ОФЕРТА**\n` +
    `_на оказание услуг по тренировкам по большому теннису (г. Самарканд, ул. Лутфи, 1)_\n\n` +
    `**1. Акцепт оферты (ст. 369 ГК РУз):** Внесение 100% предоплаты за разовую тренировку или абонемент является полным и безоговорочным принятием условий Оферты и приравнивается к заключению письменного Договора.\n\n` +
    `**2. Тарифы и срок действия:**\n` +
    `• Разовая индивидуальная (60 мин на корте): 500 000 сум\n` +
    `• Абонемент 12 индивидуальных (по 60 мин): 6 000 000 сум\n` +
    `• Абонемент 12 сплит-занятий (2 чел., 60 мин): 4 000 000 сум/чел\n` +
    `• Абонемент 12 мини-группа (4 чел., 60 мин ОФП + 60 мин корт): 2 000 000 сум/чел\n` +
    `• Абонемент 12 группа (8–10 чел., 60 мин ОФП + 60 мин корт): 1 200 000 сум/чел\n` +
    `Срок действия любого абонемента — 30 календарных дней с даты 1-го занятия. Аренда корта и инвентарь включены. Об изменении тарифов уведомляем в мессенджере за 10 дней.\n\n` +
    `**3. Переносы, пропуски и опоздания:**\n` +
    `• Индивидуальные: отмена/перенос без списания — не позднее чем за 24 часа; позднее или при неявке занятие сгорает.\n` +
    `• Группы (2, 4, 8–10 чел.): пропущенные занятия не переносятся и не компенсируются.\n` +
    `• Болезнь: перенос только при пропуске более 5 занятий подряд при наличии мед. справки.\n` +
    `• Погода: при дожде/ветре на открытом корте занятие переносится без списания.\n` +
    `• Опоздание: время не продлевается.\n\n` +
    `**4. Документы и безопасность:** До 1-й тренировки заполняется Анкета здоровья; для абонемента до 2-го занятия предоставляются мед. справка 086/у, 2 фото 3×4 и копия паспорта/свидетельства о рождении. Обязательны спортивная форма и обувь non-marking.\n\n` +
    `**5. Возврат и переписка:** При досрочном отказе от абонемента возврат производится по заявлению за вычетом проведённых/списанных занятий (по разовому тарифу 500 000 сум) и расходов на бронь корта. Переписка в Telegram/WhatsApp имеет юридическую силу.`
  );
}

// Тексты Согласия на обработку персональных данных (RU / UZ)
function getConsentText(lang) {
  if (lang === 'uz') {
    return (
      `🔒 **SHAXSIY MA’LUMOTLARGA ISHLOV BERISHGA ROZILIK**\n\n` +
      `O‘zbekiston Respublikasi Qonunchiligiga muvofiq, siz o‘z ixtiyoringiz bilan va o‘z manfaatlaringiz yo‘lida **MyTeam Samarkand** (Samarqand sh., Lutfiy ko‘chasi, 1-uy; ma’mur: ${ADMIN_USERNAME}) ga quyidagi shaxsiy ma’lumotlaringizga ishlov berishga rozilik berasiz:\n` +
      `• Ism (va/yoki familiya), telefon raqami, Telegram akkaunti;\n` +
      `• Mashg‘ulotlarga yozilish, jadvalni kelishish va qayta aloqa uchun zarur bo‘lgan boshqa ma’lumotlar.\n\n` +
      `**Maqsadi:** katta tennis bo‘yicha mashg‘ulotlarga yozish, xizmatlar ko‘rsatish, tashkiliy masalalar va Ommaviy oferta shartlarini bajarish.\n` +
      `To‘lov amalga oshirilishi ham O‘zR Qonuniga muvofiq shaxsiy ma’lumotlarga ishlov berishga rozilikni bildiradi.`
    );
  }

  return (
    `🔒 **СОГЛАСИЕ НА ОБРАБОТКУ ПЕРСОНАЛЬНЫХ ДАННЫХ**\n\n` +
    `В соответствии с законодательством Республики Узбекистан вы даёте согласие **MyTeam Samarkand** (г. Самарканд, ул. Лутфи, 1; администратор: ${ADMIN_USERNAME}) на обработку ваших персональных данных:\n` +
    `• Имя (и/или фамилия), номер телефона, аккаунт Telegram;\n` +
    `• Иные сведения, переданные при записи на тренировки и согласовании расписания.\n\n` +
    `**Цель обработки:** запись на тренировки по большому теннису, оказание услуг, связь с вами и исполнение условий Публичной оферты.\n` +
    `Внесение оплаты также означает согласие на обработку персональных данных согласно Закону РУз.`
  );
}

// Кнопка: 📄 Договор оферты
bot.hears('📄 Договор оферты', (ctx) => {
  const lang = getLang(ctx.from.id);
  ctx.reply(getOfertaText(lang), {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback('🇷🇺 Русский', 'doc_oferta_ru'),
        Markup.button.callback('🇺🇿 Oʻzbekcha', 'doc_oferta_uz')
      ]
    ])
  });
});

// Кнопка: 🔒 Согласие на обработку ПД
bot.hears('🔒 Согласие на обработку ПД', (ctx) => {
  const lang = getLang(ctx.from.id);
  ctx.reply(getConsentText(lang), {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback('🇷🇺 Русский', 'doc_consent_ru'),
        Markup.button.callback('🇺🇿 Oʻzbekcha', 'doc_consent_uz')
      ]
    ])
  });
});

// Переключение языка документов по inline-кнопкам
bot.action('doc_oferta_ru', async (ctx) => {
  userLang.set(ctx.from.id, 'ru');
  await ctx.editMessageText(getOfertaText('ru'), {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback('🇷🇺 Русский', 'doc_oferta_ru'),
        Markup.button.callback('🇺🇿 Oʻzbekcha', 'doc_oferta_uz')
      ]
    ])
  });
  await ctx.answerCbQuery();
});

bot.action('doc_oferta_uz', async (ctx) => {
  userLang.set(ctx.from.id, 'uz');
  await ctx.editMessageText(getOfertaText('uz'), {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback('🇷🇺 Русский', 'doc_oferta_ru'),
        Markup.button.callback('🇺🇿 Oʻzbekcha', 'doc_oferta_uz')
      ]
    ])
  });
  await ctx.answerCbQuery();
});

bot.action('doc_consent_ru', async (ctx) => {
  userLang.set(ctx.from.id, 'ru');
  await ctx.editMessageText(getConsentText('ru'), {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback('🇷🇺 Русский', 'doc_consent_ru'),
        Markup.button.callback('🇺🇿 Oʻzbekcha', 'doc_consent_uz')
      ]
    ])
  });
  await ctx.answerCbQuery();
});

bot.action('doc_consent_uz', async (ctx) => {
  userLang.set(ctx.from.id, 'uz');
  await ctx.editMessageText(getConsentText('uz'), {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback('🇷🇺 Русский', 'doc_consent_ru'),
        Markup.button.callback('🇺🇿 Oʻzbekcha', 'doc_consent_uz')
      ]
    ])
  });
  await ctx.answerCbQuery();
});

// Раздел: О клубе
bot.hears('ℹ️ О клубе', (ctx) => {
  ctx.reply(
    `🏆 **MyTeam Samarkand** — тренировки по большому теннису для детей и взрослых в Самарканде.\n\n` +
    `✅ Индивидуальные, сплит, мини-групповые и групповые занятия\n` +
    `✅ ОФП + корт (60 + 60 мин) в групповых абонементах\n` +
    `✅ Ракетки и мячи на время тренировки предоставляем\n\n` +
    `📋 **Для зачисления понадобятся:**\n` +
    `• Анкета здоровья (до 1-й тренировки)\n` +
    `• Для абонемента (до 2-го занятия): мед. справка 086/у, 2 фото 3×4 см, копия паспорта/свидетельства о рождении`,
    { parse_mode: 'Markdown' }
  );
});

// Раздел: Адрес и контакты
bot.hears('📍 Адрес и контакты', (ctx) => {
  ctx.reply(
    `📍 **Адрес кортов:** г. Самарканд, ул. Лутфи, 1\n` +
    `📲 **Администратор / Тренер:** ${ADMIN_USERNAME}\n` +
    `💳 **Способы оплаты:** наличные, перевод на карту, Payme, Click, Uzum`,
    { parse_mode: 'Markdown' }
  );
});

// Раздел: Записаться на тренировку (сначала запрашиваем согласие на ПД и оферту)
bot.hears('🎾 Записаться на тренировку', (ctx) => {
  bookingSessions.set(ctx.from.id, {
    step: 'waiting_consent',
    consentGiven: false
  });

  ctx.reply(
    `Перед отправкой заявки, пожалуйста, подтвердите:\n` +
    `1️⃣ Согласие на обработку персональных данных\n` +
    `2️⃣ Принятие условий Договора публичной оферты\n\n` +
    `Вы можете предварительно прочитать документы кнопками в главном меню.`,
    {
      ...Markup.keyboard([
        ['✅ Принимаю оферту и согласие на ПД'],
        ['❌ Отмена']
      ]).resize()
    }
  );
});

// Подтверждение согласия на ПД и оферты при записи
bot.hears('✅ Принимаю оферту и согласие на ПД', (ctx) => {
  const session = bookingSessions.get(ctx.from.id);
  if (!session) {
    return ctx.reply('Выберите действие в главном меню:', mainMenu);
  }

  bookingSessions.set(ctx.from.id, {
    step: 'waiting_data',
    consentGiven: true
  });

  ctx.reply(
    `Спасибо! Согласие зафиксировано.\n\n` +
    `Теперь напишите ваше **Имя, желаемый формат/тариф и номер телефона** (или нажмите кнопку ниже, чтобы отправить номер автоматически):`,
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
  bookingSessions.delete(ctx.from.id);
  ctx.reply('Запись отменена. Возвращаемся в главное меню:', mainMenu);
});

// Вспомогательная функция отправки заявки администратору
async function sendBookingToAdmin(ctx, payloadText) {
  const user = ctx.from;
  const usernameStr = user.username ? `@${user.username}` : 'без юзернейма';
  const fullNameStr = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Пользователь';

  await ctx.reply(
    `✅ Спасибо! Ваша заявка принята.\n` +
    `Согласие на обработку ПД и принятие оферты подтверждены.\n` +
    `Администратор (${ADMIN_USERNAME}) свяжется с вами в ближайшее время!`,
    mainMenu
  );

  if (ADMIN_ID && ADMIN_ID !== 0) {
    await bot.telegram.sendMessage(
      ADMIN_ID,
      `🔥 **Новая заявка на тренировку!**\n\n` +
      `${payloadText}\n` +
      `👤 Профиль: ${fullNameStr} (${usernameStr}, ID: \`${user.id}\`)\n` +
      `✅ Согласие на ПД и оферту: **Подтверждено**`,
      { parse_mode: 'Markdown' }
    );
  }
}

// Обработка контакта по кнопке
bot.on('contact', async (ctx) => {
  const session = bookingSessions.get(ctx.from.id);
  if (!session || session.step !== 'waiting_data') {
    return ctx.reply('Используйте кнопки меню ниже 👇', mainMenu);
  }

  bookingSessions.delete(ctx.from.id);
  const contact = ctx.message.contact;

  await sendBookingToAdmin(
    ctx,
    `👤 Имя: ${contact.first_name}\n` +
    `📞 Телефон: ${contact.phone_number}\n`
  );
});

// Обработка текстового сообщения при записи
bot.on('text', async (ctx) => {
  const session = bookingSessions.get(ctx.from.id);

  if (!session) {
    return ctx.reply('Используйте кнопки меню ниже 👇', mainMenu);
  }

  if (session.step === 'waiting_consent') {
    return ctx.reply(
      `Чтобы продолжить запись, нажмите кнопку **«✅ Принимаю оферту и согласие на ПД»** или **«❌ Отмена»**.`,
      { parse_mode: 'Markdown' }
    );
  }

  if (session.step === 'waiting_data') {
    bookingSessions.delete(ctx.from.id);
    await sendBookingToAdmin(ctx, `📝 Данные заявки: ${ctx.message.text}\n`);
  }
});

bot.launch();
console.log('Бот запущен и готов к работе!');

// Веб-сервер для Render, чтобы приложение работало 24/7
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot is running');
}).listen(process.env.PORT || 3000);
