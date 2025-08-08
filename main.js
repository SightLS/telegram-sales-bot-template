const TelegramBot = require('node-telegram-bot-api');
const API_KEY_BOT = 'СЕКРЕТ';
const techSupportChat = { id: СЕКРЕТ };

// Хранилище данных пользователей
const userData = {
    requests: {},
    dailyStats: {},
    blockedUsers: {},
    expDate: null,
    botPrice: null,
    code: null,
    vpnPrice: null
};

// Очистка старых данных каждые 30 минут
setInterval(() => {
    userData.requests = {};
}, 1800000);

const bot = new TelegramBot(API_KEY_BOT, {
    polling: {
        interval: 300,
        autoStart: true
    }
});

// Клавиатуры
const keyboards = {
    main: {
        reply_markup: {
            resize_keyboard: true,
            keyboard: [["⭐️Купить ВПН", "🤖Заказать бота", "🆘Нужна помощь"]]
        }
    },
    mainBlockedHelp: {
        reply_markup: {
            resize_keyboard: true,
            keyboard: [["⭐️Купить ВПН", "🤖Заказать бота"]]
        }
    },
    mainBlockedRequest: {
        reply_markup: {
            resize_keyboard: true,
            keyboard: [["⭐️Купить ВПН", "🤖Заказать бота", "🆘Нужна помощь"]]
        }
    },
    vpn: {
        reply_markup: {
            resize_keyboard: true,
            keyboard: [["⭐️Впервые покупаю", "⭐️Продлить ВПН"], ["⭐️Купить для нового устройства", "⤵️Назад"]]
        }
    },
    vpnOneDevice: {
        reply_markup: {
            resize_keyboard: true,
            keyboard: [["⭐️Продлить ВПН", "⭐️Купить для нового устройства"], ["⤵️Назад"]]
        }
    },
    extendVpn: {
        reply_markup: {
            resize_keyboard: true,
            keyboard: [["⭐️Я не знаю свой ключ", "⤵️Назад"]]
        }
    },
    vpnPrices: {
        reply_markup: {
            resize_keyboard: true,
            keyboard: [["⭐️1 месяц", "⭐️3 месяца", "⭐️6 месяцев"], ["⤵️Назад"]]
        }
    },
    botOrder: {
        reply_markup: {
            resize_keyboard: true,
            keyboard: [["🤖Базовая версия", "🤖Продвинутая версия"], ["⤵️Назад"]]
        }
    },
    baseBot: {
        reply_markup: {
            resize_keyboard: true,
            keyboard: [["💳Оплатить", "↪️Назад"]]
        }
    },
    advancedBot: {
        reply_markup: {
            resize_keyboard: true,
            keyboard: [["🤖оставить заявку", "↪️Назад"]]
        }
    }
};

// Команды бота
bot.setMyCommands([{ command: "start", description: "Запуск бота" }]);
bot.on("polling_error", err => console.log(err.data.error.message));

// Проверка суточного лимита
function checkDailyLimit(chatId, type) {
    const today = new Date().toISOString().slice(0, 10);
    
    if (!userData.dailyStats[chatId]) {
        userData.dailyStats[chatId] = { date: today, help: 0, request: 0 };
    } else if (userData.dailyStats[chatId].date !== today) {
        userData.dailyStats[chatId] = { date: today, help: 0, request: 0 };
    }

    userData.dailyStats[chatId][type]++;
    return userData.dailyStats[chatId][type] > 15;
}

// Обработчики команд
const handlers = {
    start: async (msg) => {
        await bot.sendMessage(msg.chat.id, `Добрый день! Я бот помощник🤖\n\nВы можете ввести свой ключ от ВПН для оплаты сразу, чтобы пропустить все диалоговые окна.`, keyboards.main);
    },

    help: async (msg) => {
        const chatId = msg.chat.id;
        
        // Проверка суточного лимита
        if (checkDailyLimit(chatId, 'help')) {
            userData.blockedUsers[chatId] = {
                time: Date.now(),
                type: 'daily_limit',
                reason: 'help'
            };
            await bot.sendMessage(chatId, `❌ Превышено максимальное количество запросов помощи в день (15). Вы заблокированы на 12 часов.`, keyboards.mainBlockedHelp);
            return;
        }

        // Краткосрочный антиспам
        if (!userData.requests[chatId]) userData.requests[chatId] = [];
        userData.requests[chatId].push(Date.now());
        userData.requests[chatId] = userData.requests[chatId].filter(t => Date.now() - t < 5000);
        
        if (userData.requests[chatId].length > 3) {
            userData.blockedUsers[chatId] = {
                time: Date.now(),
                type: 'help'
            };
            await bot.sendMessage(chatId, `⏳ Вы заблокированы за спам на 5 минут.`, keyboards.mainBlockedHelp);
            return;
        }
        
        await bot.sendMessage(chatId, 'В ближайшее время с вами свяжется наш специалист с аккаунта @Тут_телега.\n \nТем временем, вы можете обратиться к @Тут_телега и подробно описать вашу проблему.', keyboards.main);
        bot.forwardMessage(techSupportChat.id, chatId, msg.message_id);
    },

    orderBot: async (msg) => {
        await bot.sendMessage(msg.chat.id, '🤖Базовая версия - 1000₽ \n\n🤖Продвинутая версия (Подключение вашей базы данных, подключение платежных систем и т.д.) от 2000₽', keyboards.botOrder);
    },

    baseBot: async (msg) => {
        await bot.sendMessage(msg.chat.id, 'Стоимость Базовой версии - 1000₽\n\nБазовая версия включает в себя функционал отправки сообщений пользователю, диалоговое окно для взаимодействия с пользователями, а также возможность отправки фотографий и ссылок.\n\nНажмите кнопку  "💳Оплатить" для оплаты товара.\n\nПосле завершения оплаты с вами свяжется наш специалист для уточнения необходимых функций вашего бота.', keyboards.baseBot);
    },

    payBot: async (msg) => {
        userData.botPrice = 1000;
        await bot.sendMessage(msg.chat.id, `Спасибо за покупку!😊\n\nСкоро с вами свяжется наш специалист для уточнения необходимых функций вашего бота.\n\nЦена бота: ${userData.botPrice} проверяем оплату`, keyboards.main);
        bot.forwardMessage(techSupportChat.id, msg.chat.id, msg.message_id);
    },

    advancedBot: async (msg) => {
        await bot.sendMessage(msg.chat.id, 'В продвинутую версию входят, помимо базового функционала, такие возможности, как взаимодействие с базой данных, интеграция платежных систем, отправка видео, а также оформление шрифтов и многое другое.\n\nЕсли вы заинтересованы в приобретении продвинутого телеграм-бота, пожалуйста, нажмите кнопку "🤖оставить заявку", и в ближайшее время с вами свяжется наш специалист для уточнения необходимых функций вашего бота и обсуждения цен.', keyboards.advancedBot);
    },

    submitRequest: async (msg) => {
        const chatId = msg.chat.id;
        
        // Проверка суточного лимита
        if (checkDailyLimit(chatId, 'request')) {
            userData.blockedUsers[chatId] = {
                time: Date.now(),
                type: 'daily_limit',
                reason: 'request'
            };
            await bot.sendMessage(chatId, `❌ Превышено максимальное количество заявок в день (15). Вы заблокированы на 12 часов.`, keyboards.mainBlockedRequest);
            return;
        }

        // Краткосрочный антиспам
        if (!userData.requests[chatId]) userData.requests[chatId] = [];
        userData.requests[chatId].push(Date.now());
        userData.requests[chatId] = userData.requests[chatId].filter(t => Date.now() - t < 5000);
        
        if (userData.requests[chatId].length > 3) {
            userData.blockedUsers[chatId] = {
                time: Date.now(),
                type: 'request'
            };
            await bot.sendMessage(chatId, `⏳ Вы заблокированы за спам на 5 минут.`, keyboards.mainBlockedRequest);
            return;
        }
        
        await bot.sendMessage(chatId, `Спасибо за заявку!😊\n\nСкоро с вами свяжется наш специалист для уточнения необходимых функций вашего бота.`, keyboards.main);
        bot.forwardMessage(techSupportChat.id, chatId, msg.message_id);
    },

    buyVpn: async (msg) => {
        await getVpnInfo(msg);
    },

    firstTimeBuy: async (msg) => {
        await bot.sendMessage(msg.chat.id, `💵Цены:\n \n⚡️1 месяц - 190₽\n \n⚡️3 месяца - 570₽\n \n⚡️6 месяцев - 1140₽`, keyboards.vpnPrices);
        userData.code = null;
    },

    extendVpn: async (msg) => {
        if (userData.expDate && userData.expDate.length) {
            userData.code = userData.expDate[0].code;
            await bot.sendMessage(msg.chat.id, `ваш личный ключ ${userData.expDate[0].code}, дата окончания ${userData.expDate[0].expire}.\n \n💵Цены:\n \n ⚡️1 месяц - 190₽\n \n ⚡️3 месяца - 570₽\n \n ⚡️6 месяцев - 1140₽`, keyboards.vpnPrices);
        } else {
            await bot.sendMessage(msg.chat.id, `Напишите ваш личный ключ`, keyboards.extendVpn);
        }
    },

    newDevice: async (msg) => {
        await bot.sendMessage(msg.chat.id, `Вы выбрали опцию ⭐️Купить для нового устройства, после покупки вы получить новый ключ.\n \n💵Цены:\n \n ⚡️1 месяц - 190₽\n \n ⚡️3 месяца - 570₽\n \n ⚡️6 месяцев - 1140₽`, keyboards.vpnPrices);
        userData.code = null;
    },

    dontKnowKey: async (msg) => {
        await bot.sendMessage(msg.chat.id, `Личный ключ вы можете посмотреть в главном меню вашего приложения.`, keyboards.vpnPrices);
    },

    back: async (msg) => {
        await bot.sendMessage(msg.chat.id, `Вы вернулись в главное меню`, keyboards.main);
    },

    month1: async (msg) => {
        await processVpnPayment(msg, 190, 1);
    },

    month3: async (msg) => {
        await processVpnPayment(msg, 570, 3);
    },

    month6: async (msg) => {
        await processVpnPayment(msg, 1140, 6);
    },

    unknownCommand: async (msg) => {
        await bot.sendMessage(msg.chat.id, 'Не совсем понял вас.\n\nЕсли вам нужна помощь, то нажмите на кнопку "🆘Нужна помощь", чтобы в кротчайшие сроки с вами связался специалист технической поддержки', keyboards.main);
    }
};

// Вспомогательные функции
async function getVpnInfo(msg) {
    const response = await fetch(`https://СЕКРЕТ.supabase.co/rest/v1/СЕКРЕТ?select=expire,code&tg_id=eq.${msg.from.id}`, {
        headers: {
            'apikey': 'СЕКРЕТ',
            'Authorization': 'Bearer СЕКРЕТ'
        }
    });
    userData.expDate = await response.json();
    sendVpnCodes(msg);
}

function sendVpnCodes(msg) {
    const currentDate = new Date();
    const isoDate = currentDate.toISOString().slice(0, 10);
    
    if (userData.expDate.length === 1) {
        userData.code = userData.expDate[0].code;
        if (userData.expDate[0].dateEXP < isoDate) {
            bot.sendMessage(msg.chat.id, `Ваш ключ ${userData.expDate[0].code} просрочен и больше не является активным, дата окончания ${userData.expDate[0].expire}. Для продолжения работы VPN оплатите счёт`, keyboards.vpnOneDevice);
        } else {
            bot.sendMessage(msg.chat.id, `Ваш ключ ${userData.expDate[0].code} активен и закончится ${userData.expDate[0].expire}`, keyboards.vpnOneDevice);
        }
    } else if (userData.expDate.length > 1) {
        const keyboard = {
            reply_markup: {
                resize_keyboard: true,
                keyboard: [[], ["⭐️Купить для нового устройства", "⤵️Назад"]]
            }
        };
        
        const codeInfo = [];
        userData.expDate.forEach(el => {
            codeInfo.push('\n \n⭐️ключ:');
            codeInfo.push(el.code);
            keyboard.reply_markup.keyboard[0].push(`${el.code}`);
            codeInfo.push('Дата окончания подписки');
            el.expire !== null ? codeInfo.push(el.expire) : codeInfo.push('неизвестно');
        });
        
        bot.sendMessage(msg.chat.id, `Ваши ключи: ${codeInfo.join(' ')}\n \nВыберите ключ, который хотите продлить, либо закажите новый.\n \nЕсли у вас есть ключ от вашего ВПН, но вы его не знаете, то можете найти его в приложении ВПН на главной странице.`, keyboard);
    } else {
        bot.sendMessage(msg.chat.id, `Спасибо что решили выбрать наш ВПН!\n \nЕсли вы уже приобретали ВПН и хотите продлить его, то нажмите на кнопку "Продлить ВПН".\n \n Если вы хотите подключить еще одно устройство, то нажмите "Хочу купить для второго устройства"\n \nЕсли вы не знаете ключ от вашего ВПН, то можете найти его в приложении ВПН, на главной странице.`, keyboards.vpn);
    }
}

async function processVpnPayment(msg, price, months) {
    userData.vpnPrice = price;
    if (userData.code === null) {
        await bot.sendMessage(msg.chat.id, `Проверяем оплату\n\nСпасибо за покупку!\n \n Пользователь оплатил сумму ${price}\n \nКлюч = ${userData.code}, берем незарезервированный code и добавляем в expire дату окончания, затем выдаем ключ\n \nДобавляем tg_id в базу к ключу`, keyboards.main);
    } else {
        await bot.sendMessage(msg.chat.id, `Проверяем оплату\n\nСпасибо за покупку!\n \nПользователь оплатил сумму ${price}\n \nКлюч = ${userData.code}, находим в базе code и докидываем в expire дату\n \nДобавляем tg_id в базу к ключу\n \nЕсли expire < current date => expire = current date + ${months} месяц(ев)`, keyboards.main);
    }
}

// Обработчик сообщений
bot.on('text', async (msg) => {
    try {
        const text = msg.text;
        const chatId = msg.chat.id;

        // Проверка блокировок
        if (userData.blockedUsers[chatId]) {
            const block = userData.blockedUsers[chatId];
            const elapsed = Date.now() - block.time;
            
            // Разблокировка после 5 минут
            if (block.type !== 'daily_limit' && elapsed > 300000) {
                delete userData.blockedUsers[chatId];
            } 
            // Разблокировка после 12 часов
            else if (block.type === 'daily_limit' && elapsed > 43200000) {
                delete userData.blockedUsers[chatId];
                userData.dailyStats[chatId].help = 0;
                userData.dailyStats[chatId].request = 0;
            }
            // Если все еще заблокирован
            else {
                let message = '';
                if (block.type === 'daily_limit') {
                    const hoursLeft = Math.ceil((43200000 - elapsed) / 3600000);
                    message = `❌ Превышен лимит запросов (15/день). Блокировка еще ${hoursLeft} часов.`;
                } else {
                    const minsLeft = Math.ceil((300000 - elapsed) / 60000);
                    message = `⏳ Вы заблокированы за спам. Осталось ${minsLeft} минут.`;
                }
                await bot.sendMessage(chatId, message);
                return;
            }
        }

        // Обработка ввода ключа VPN (5 цифр)
        if (/^\d{5}$/.test(text)) {
            userData.code = text;
            const response = await fetch(`https://СЕКРЕТ.supabase.co/rest/v1/СЕКРЕТ?select=expire,code&code=eq.${userData.code}&isReserved=eq.true`, {
                headers: {
                    'apikey': 'СЕКРЕТ',
                    'Authorization': 'Bearer СЕКРЕТ'
                }
            });
            userData.expDate = await response.json();
            
            if (userData.expDate.length) {
                userData.code = userData.expDate[0].code;
                await bot.sendMessage(chatId, `Ключ ${userData.expDate[0].code} найден, дата окончания подписки ${userData.expDate[0].expire}.\n \n Для продления подписки выберите 1 опцию\n \n💵Цены:\n \n⚡️1 месяц - 190₽\n \n⚡️3 месяца - 570₽\n \n⚡️6 месяцев - 1140₽`, keyboards.vpnPrices);
            } else {
                await bot.sendMessage(chatId, 'Ключ не найден, попробуйте ввести повторно', keyboards.extendVpn);
            }
            return;
        }

        // Обработка команд
        switch (text) {
            case '/start':
                await handlers.start(msg);
                break;
            case '🆘Нужна помощь':
                await handlers.help(msg);
                break;
            case '🤖оставить заявку':
                await handlers.submitRequest(msg);
                break;
            case '💳Оплатить':
                await handlers.payBot(msg);
                break;
            case '🤖Заказать бота':
            case '↪️Назад':
                await handlers.orderBot(msg);
                break;
            case '🤖Базовая версия':
                await handlers.baseBot(msg);
                break;
            case '🤖Продвинутая версия':
                await handlers.advancedBot(msg);
                break;
            case '⭐️Купить ВПН':
                await handlers.buyVpn(msg);
                break;
            case '⤵️Назад':
                await handlers.back(msg);
                break;
            case '⭐️Впервые покупаю':
                await handlers.firstTimeBuy(msg);
                break;
            case '⭐️Продлить ВПН':
                await handlers.extendVpn(msg);
                break;
            case '⭐️Купить для нового устройства':
                await handlers.newDevice(msg);
                break;
            case '⭐️Я не знаю свой ключ':
                await handlers.dontKnowKey(msg);
                break;
            case '⭐️1 месяц':
                await handlers.month1(msg);
                break;
            case '⭐️3 месяца':
                await handlers.month3(msg);
                break;
            case '⭐️6 месяцев':
                await handlers.month6(msg);
                break;
            default:
                if (/^\d+$/.test(text) && text.length !== 5) {
                    await bot.sendMessage(chatId, 'Ключ не найден, попробуйте ввести повторно', keyboards.extendVpn);
                } else {
                    await handlers.unknownCommand(msg);
                }
        }
    } catch (error) {
        console.error('Ошибка в обработчике сообщений:', error);
    }
});