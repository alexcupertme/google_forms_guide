const { Context } = require("grammy");
const { UsersRepository } = require("../repositories/users.repository");

module.exports = function authMiddleware(userRepository) {
	return async function (ctx, next) {
		const userId = ctx.chat.id;
		const userName = ctx.chat.username;

		let user = await userRepository.getUser({ telegramId: userId });
		ctx.session.user = user;
		if (!user) {
			user = userRepository.createUser({
				telegramId: userId,
				telegramName: userName,
			});
		}

		if (user.userGroup == "banned") return ctx.reply(`Вы забанены! По вопросам пишите администратору: ${process.env.CONTACT_ADDRESS}`);

		if (user.userGroup == "admin") ctx.session.isAdmin = true;
		else ctx.session.isAdmin = false;
		if (process.env.MAIN_ADMIN_ID == userId) ctx.session.isTopAdmin = true;

		await userRepository.updateUser(user.uuid, {
			telegramName: userName,
			telegramId: userId,
		});
		await next();
	};
};
