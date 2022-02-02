const { Context, InlineKeyboard } = require("grammy");

module.exports = function startService(botInstance, userRepository, viewFormService, startFormService) {
	return function (ctx) {
		if (ctx.match.match(/^f_start_([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/)) return startFormService(ctx);
		if (ctx.match.match(/^f_([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/)) return viewFormService(ctx);
		const user = userRepository.getUser({ telegramId: ctx.chat.id });
		let buttons = new InlineKeyboard();
		if (ctx.session.isAdmin || ctx.session.isTopAdmin) {
			buttons = buttons.text("Открыть панель администратора", "admin").row();
		}
		ctx.reply(
			`Приветствую! Данный бот предназначен для тестирования пользователей. Сейчас для Вас нет доступных опросов. \n\nВаш UUID: ${ctx.session.user.uuid}`,
			{
				reply_markup: buttons,
			}
		);
	};
};
