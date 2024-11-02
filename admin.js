const { Telegraf } = require("telegraf");

const bot = new Telegraf("7783266879:AAFCIlNLDQpzGfPx2EyIuN7Y9FPKnm57eAY");

bot.start((ctx) => {
    ctx.reply("Hello, it's admin bot");
});

bot.on("text", (ctx) => {
    ctx.reply(`Qabul qilingan ma'lumot: ${ctx.message.text}`);
});

// Rasm qabul qilinganda (agar bu birinchi botda rasmni yuborgan bo'lsa)
bot.on("photo", async (ctx) => {
    // Foydalanuvchidan kelgan rasmni olish
    const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;

    // Rasmni admin botga yuborish
    await ctx.reply(`Rasm qabul qilindi! Rasmni ko'rsatmoqchi bo'lsangiz:`);
    await ctx.replyWithPhoto(photoId, { caption: "Bu foydalanuvchidan olingan rasm." });
});

bot.launch();

console.log('Bot is running...');
