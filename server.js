import { Telegraf, Markup } from 'telegraf';
import pkg from 'pg';
import fetch from "node-fetch";
import queries from "./commands/queries.js";

const { Client } = pkg;

const client = new Client({
    connectionString: 'postgresql://postgres.xqbhpmfdckbdssepvdlp:10010512111111497@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
    ssl: {
        rejectUnauthorized: false,
    },
});

client.connect((err) => {
    if (err) {
        console.error('Connection error:', err.stack);
    } else {
        console.log('Connected to PostgreSQL');
    }
});

const bot = new Telegraf('7788434308:AAFvRZ_yfmIk0lg-_ARBREe4NJ0KypGRh3g');
const secondBotToken = "7783266879:AAFCIlNLDQpzGfPx2EyIuN7Y9FPKnm57eAY";

// Foydalanuvchi order holatida ekanligini aniqlash uchun obyekt
const userOrderState = {};
let orderInfo = {};

bot.start((ctx) => {
    const user = ctx.from;
    ctx.reply(`<b><i>Assalomu alaykum, ${user.first_name}!!!</i></b>`, { parse_mode: "HTML" });
    ctx.reply(`<b><i>Sotib olmoqchi bo'lgan mahsulotingizning ID raqamini yuboring.</i></b>`, { parse_mode: "HTML" });

    // Create the buttons for each product
    const buttons = [
        [Markup.button.callback("Mening buyurtmalarim", "my_ordered_products")]
    ];

    // Send a message with buttons for each product
    ctx.reply("Iltimos, buyurtmalaringizni ko'rish uchun tugmani bosing:", {
        reply_markup: {
            inline_keyboard: buttons, // Use inline_keyboard for callback buttons
        },
    });
});

// Handler for the "Mening buyurtmalarim" button
bot.action('my_ordered_products', async (ctx) => {
    ctx.answerCbQuery(); // Acknowledge the callback query
    const userId = ctx.from.id;

    try {
        // Fetch the user's orders from the database
        const orders = await client.query(queries.getUserOrders, [userId]); // Ensure this query is defined correctly

        if (orders.rows.length > 0) {
            let orderList = orders.rows.map(order => {
                return `Buyurtma ID: ${order.id}\nMahsulot ID: ${order.order_id}\nHolati: ${order.status}\n\n`;
            }).join('');

            ctx.reply(`Sizning buyurtmalaringiz:\n\n${orderList}`, { parse_mode: "HTML" });
        } else {
            ctx.reply("Sizda hech qanday buyurtma mavjud emas.");
        }
    } catch (error) {
        console.error("Xatolik:", error);
        ctx.reply("Buyurtmalarni olishda xatolik yuz berdi.");
    }
});


bot.command("products", async (ctx) => {
    try {

    } catch (error) {
        console.log(error);
    }
});



bot.on('text', async (ctx) => {
    const userId = ctx.from.id;

    if (userOrderState[userId]) {
        // Split the message into parts based on spaces
        const orderDetails = ctx.message.text.split(" ");

        // Ensure that there are enough elements in the array to avoid errors
        if (orderDetails.length < 6) {
            return ctx.reply("Iltimos, buyurtmani to'liq kiriting (masalan: Ism Familiya, telefon raqam, Mahsulot ID, o'lcham, rang, soni).");
        }

        const name = `${orderDetails[0]} ${orderDetails[1]}`;
        const phone = orderDetails[2];
        const productId = orderDetails[3];
        const size = orderDetails[4];
        const color = orderDetails[5];
        const quantity = parseInt(orderDetails[6]);

        try {
            // Fetch the product based on the extracted product ID
            const product = await client.query(queries.getProduct, [productId]);
            if (product.rows.length > 0) {
                const ProductInfo = product.rows[0];
                const originalPrice = ProductInfo.cost;
                const discountedPrice = ProductInfo.offer
                    ? originalPrice - (originalPrice / 100) * ProductInfo.offer
                    : originalPrice;

                // Calculate the total price
                const totalPrice = discountedPrice * quantity;
                const formattedTotalPrice = totalPrice.toLocaleString('ru-RU');

                // Store order info
                orderInfo = {
                    name,
                    phone,
                    productId,
                    size,
                    color,
                    quantity,
                    totalPrice,
                    status: "Pending",
                    customerId: userId
                };

                await ctx.reply(
                    `<b><i>Buyurtma haqida ma'lumot:</i></b>\n\n` +
                    `<b>Buyurtmachi ism familyasi:</b> <i>${orderInfo.name}</i>\n` +
                    `<b>Buyurtmachi telefon raqami:</b> <i>${orderInfo.phone}</i>\n` +
                    `<b>Buyurtma ID:</b> <i>${orderInfo.productId}</i>\n` +
                    `<b>Buyurtma o'lchami:</b> <i>${orderInfo.size}</i>\n` +
                    `<b>Buyurtma rangi:</b> <i>${orderInfo.color}</i>\n` +
                    `<b>Buyurtma soni:</b> <i>${orderInfo.quantity}</i>\n` +
                    `<b>Umumiy narx:</b> <i>${formattedTotalPrice} so'm</i>\n\n` +
                    `Agar buyurtmani tasdiqlamoqchi bo'lsangiz <b>Buyurtmani tasdiqlash</b> tugmasini bosing. ` +
                    `Agar nimadir xato ketgan bo'lsa yoki o'zgartirmoqchi bo'lsangiz <b>Buyurtma berish</b> tugmasini bosib qaytadan ma'lumot kiriting.`,
                    {
                        parse_mode: "HTML",
                        ...Markup.inlineKeyboard([
                            Markup.button.callback('Buyurtmani tasdiqlash', 'confirm_order')
                        ])
                    }
                );
            } else {
                ctx.reply("Bunday ID ora mahsulot topilmadi!");
            }
        } catch (error) {
            console.error("Xatolik:", error);
            ctx.reply("Serverda xatolik yuz berdi, keyinroq qayta urinib ko'ring.");
        }

        userOrderState[userId] = false;
    } else {
        const id = ctx.message.text;
        try {
            const product = await client.query(queries.getProduct, [id]);
            if (product.rows.length > 0) {
                const ProductInfo = product.rows[0];
                const originalPrice = ProductInfo.cost;
                const discountedPrice = ProductInfo.offer
                    ? (originalPrice - (originalPrice / 100) * ProductInfo.offer).toLocaleString('ru-RU')
                    : originalPrice.toLocaleString('ru-RU');
                const formattedOriginalPrice = originalPrice.toLocaleString('ru-RU');

                const priceText = ProductInfo.offer
                    ? `${discountedPrice} so'm   (<s>${formattedOriginalPrice} so'm</s>) - ${ProductInfo.offer}% Skidka`
                    : `${formattedOriginalPrice} so'm`;

                const mediaGroup = ProductInfo.images.map((imageUrl) => ({
                    type: 'photo',
                    media: imageUrl,
                }));

                if (mediaGroup.length > 0) {
                    await ctx.replyWithMediaGroup(mediaGroup);
                }

                await ctx.reply(
                    `<b>Mahsulot nomi:</b> <i>${ProductInfo.name}</i>\n\n` +
                    `<b>Narxi:</b> <i>${priceText}</i>\n\n` +
                    `<b>Ranglari:</b> ${ProductInfo.color.join(" / ")}\n\n` +
                    `<b>O'lchamlar:</b> <i>${ProductInfo.size.join(" , ")}</i>`,
                    {
                        parse_mode: "HTML",
                        ...Markup.inlineKeyboard([
                            Markup.button.callback('Buyurtma berish', 'place_order')
                        ])
                    }
                );
            } else {
                ctx.reply("Bunday ID ora mahsulot topilmadi!");
            }
        } catch (error) {
            console.error("Xatolik:", error);
            ctx.reply("Serverda xatolik yuz berdi, keyinroq qayta urinib ko'ring.");
        }
    }
});


bot.action('place_order', (ctx) => {
    ctx.answerCbQuery();
    userOrderState[ctx.from.id] = true;
    ctx.reply(`Buyurtma berish uchun maʼlumotlaringizni namunadagidek yuboring.\n\nNamuna: <i>To'liq ism Familya, telefon raqam, Mahsulot Id, o'lcham, rang, nechta olish\n\n(Eslatma: Telefon raqami ishlayotgan bo'lishi va shunday bo'lishi kerak: +998911234567)</i>`, { parse_mode: "HTML" });
});

bot.action('confirm_order', async (ctx) => {
    ctx.answerCbQuery();

    const { name, phone, size, productId, color, quantity, totalPrice, status } = orderInfo;
    const customerId = ctx.from.id;  // Using Telegram user ID as customerId

    try {
        await client.query(queries.setOrder, [
            name,
            phone,
            size,
            productId,
            color,
            quantity,
            totalPrice,
            status,
            customerId
        ]);
        ctx.reply("Buyurtma navbatga joylandi. Buyurtma berish uchun to'lovni amalga oshiring va amalga oshirilgan to'lov chekining rasmini <b>Screen shot</b> yoki <b>Kamera</b> orqali rasmga olib tashlang.", { parse_mode: "HTML" });

        // Set a state indicating the user is waiting for payment confirmation
        userOrderState[ctx.from.id] = "waiting_for_payment";
    } catch (error) {
        console.error("Xatolik:", error);
        ctx.reply("Buyurtma saqlashda xatolik yuz berdi, iltimos qayta urinib ko'ring.");
    }
});

// Listen for photos from users
// Listen for photos from users
bot.on('photo', async (ctx) => {
    const userId = ctx.from.id;

    // To'lovni tasdiqlovchi xabar yuborish
    ctx.reply("To'lov chekingizni qabul qildik, buyurtmangiz tasdiqlanmoqda. Iltimos, admin javobini kuting.", { parse_mode: "HTML" });

    // Ikkinchi botga foydalanuvchi haqida xabar jo'natish
    const { name, phone, productId, size, color, quantity, totalPrice } = orderInfo;

    const message = `
<b>Yangi Buyurtma:</b>\n
<b>Ismi:</b> ${name}\n
<b>Telefon:</b> ${phone}\n
<b>Mahsulot ID:</b> ${productId}\n
<b>O'lchami:</b> ${size}\n
<b>Rangi:</b> ${color}\n
<b>Soni:</b> ${quantity}\n
<b>Umumiy narxi:</b> ${totalPrice.toLocaleString('ru-RU')} so'm
    `;

    try {
        // Ikkinchi botga xabar va rasm jo'natish
        const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id; // Rasm ID sini oling
        await fetch(`https://api.telegram.org/bot${secondBotToken}/sendPhoto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: '7127309788',  // Bu yerda adminning chat_id sini kiritishingiz kerak
                caption: message,
                parse_mode: 'HTML',
                photo: photoId // Rasm ID sini yuboring
            }),
        });
    } catch (error) {
        console.error("Ikkinchi botga xabar jo'natishda xatolik:", error);
    }

    // Reset the order state
    userOrderState[userId] = false; // or delete userOrderState[userId] to clear the state
});



bot.launch();

console.log('Bot is running...');
