import asyncio
import logging
from aiogram import Bot, Dispatcher, F
from aiogram.filters import Command
from aiogram.types import Message

TOKEN = "9122941466:AAGrYK4ZV9A-Cc4FsZa8i3rEBYiIP4I-Ks0"

bot = Bot(token=TOKEN)
dp = Dispatcher()


@dp.message(Command("start"))
async def cmd_start(message: Message):
  user_name = message.from_user.first_name
  await message.answer(
      f"Привет, {user_name}! 🎾 Бот теннисной школы успешно запущен и работает 24/7!"
  )


@dp.message(F.text)
async def echo_message(message: Message):
  await message.answer(f"Вы написали: {message.text}")


async def main():
  logging.basicConfig(level=logging.INFO)
  print("Бот запущен и ожидает сообщения...")
  await dp.start_polling(bot)


if __name__ == "__main__":
  try:
    asyncio.run(main())
  except KeyboardInterrupt:
    print("Бот остановлен.")