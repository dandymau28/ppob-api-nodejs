const { Telegraf } = require('telegraf')
const Users = require('./src/models/users');

const bot = new Telegraf(process.env.BOT_TOKEN)

const startBot = () => {
    bot.start((ctx) => ctx.reply('Welcome to PPOB Nuteam. Let\'s roll out!. Use /help to get help'));
    bot.help((ctx) => {
        ctx.reply('chat me with \"GetOTP your_number\" to get OTP');
    })
    bot.hears(/GetOTP/i, async(ctx) => {
        try {
            let [, phone] = ctx.message.text.split(' ');
            
            let user = await Users.findOne({ noHandphone: phone }).exec();

            if (user) {
                if (user?.otp) {
                    ctx.reply(user.otp);
                } else {
                    ctx.reply("Your number is not generate any OTP yet! Please sign to PPOB App first! Thanks");
                }
            } else {
                ctx.reply("Your number is not signed yet to PPOB System");
            }
        } catch(err) {
            console.log(err);
            ctx.reply("Something wrong in my brain!");
        }
    })
    bot.launch()
}

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

module.exports = startBot