const { Context, InlineKeyboard } = require("grammy");
const { UsersRepository } = require("../repositories/users.repository");

function adminService() {
	return async function (ctx) {
		await ctx.editMessageText(
			"Здесь вы можете создать новый опрос или отредактировать существующий, а также посмотреть результаты ответов пользователей! Выберите функцию меню",
			{
				reply_markup: new InlineKeyboard()
					.text("Создать новый опрос", "f_create")
					.row()
					.text("Мои опросы", "f_list")
					.row()
					.text("Управление пользователями", "users"),
			}
		);
	};
}

function userPanelService() {
	return async function (ctx) {
		let buttons = new InlineKeyboard()
			.text("Найти пользователя по айди", "find_u_uuid")
			.row()
			.text("Найти пользователя по нику Telegram", "find_u_username")
			.row()
			.text("Найти пользователя по Telegram ID", "find_u_tid");
		await ctx.editMessageText("Панель управления пользователями", {
			reply_markup: buttons,
		});
	};
}

function userSearchService(type) {
	return async function (ctx) {
		switch (type) {
			case "tid":
				await ctx.editMessageText(`Введите Telegram ID пользователя`, {});
				ctx.session.scene = "enter_tid";
				break;
			case "uuid":
				ctx.editMessageText(`Введите UUID пользователя`, {});
				ctx.session.scene = "enter_uuid";
				break;
			case "username":
				ctx.editMessageText(`Введите никнейм пользователя`, {});
				ctx.session.scene = "enter_username";
				break;
		}
	};
}

function userProfileService(usersRepository) {
	return async function (ctx) {
		const exitSceneBtn = new InlineKeyboard().text("Назад", "start").row();
		const id = ctx.msg?.text;
		let user;
		switch (ctx.session.scene) {
			case "enter_tid":
				if (!isNaN(parseInt(id))) user = await usersRepository.getUser({ telegramId: id });
				else user = null;
				break;
			case "enter_uuid":
				user = await usersRepository.getUser({ uuid: id });
				break;
			case "enter_username":
				if (id[0] == "@") id.slice(1);
				user = await usersRepository.getUser({ telegramName: id });
				break;
		}
		ctx.session.scene = "";
		if (!user) return await ctx.reply("Данный пользователь не найден!", { reply_markup: exitSceneBtn });

		return await ctx.reply(
			`Информация о пользователе:
Дата регистрации: ${new Date(user.registerDate).toLocaleString()}
UUID: ${user.uuid}
Telegram ID: ${user.telegramId}
Никнейм: ${user.telegramName}

Пройдено опросов: ${user.completedForms.length}

Роль: ${user.userGroup}`,
			{
				reply_markup: new InlineKeyboard()
					.text(user.userGroup == "admin" ? "Разжаловать" : "Повысить до администратора", `promote_${user.uuid}`)
					.row()
					.text(user.userGroup == "admin" || user.userGroup == "user" ? "Забанить" : "Разбанить", `ban_${user.uuid}`),
			}
		);
	};
}

function userBanService(usersRepository) {
	return async function (ctx) {
		const bannedId = ctx.match[1];
		const user = await usersRepository.getUser({ uuid: bannedId });

		if (!ctx.session.isAdmin) return await ctx.reply("Вы не администратор!");

		if (bannedId == ctx.chat.id) return await ctx.reply("Вы не можете заблокировать самого себя!");

		if (user.isAdmin && !ctx.session.isTopAdmin) return await ctx.reply("Вы не можете забанить администратора!");

		if (user.userGroup == "banned") {
			await usersRepository.updateUser(bannedId, {
				userGroup: "user",
			});
			await ctx.reply("Пользователь успешно разблокирован!");
		} else if (user.userGroup == "user" || user.userGroup == "admin") {
			await usersRepository.updateUser(bannedId, {
				userGroup: "banned",
			});
			await ctx.reply("Пользователь успешно заблокирован!");
		}
	};
}

function userPromoteService(usersRepository) {
	return async function (ctx) {
		const promotedId = ctx.match[1];
		const user = await usersRepository.getUser({ uuid: promotedId });

		if (!ctx.session.isTopAdmin) return await ctx.reply("Вы не администратор!");

		if (user.userGroup == "admin") {
			await usersRepository.updateUser(promotedId, {
				userGroup: "user",
			});
			return await ctx.reply("Пользователь успешно понижен!");
		} else if (user.userGroup == "user") {
			await usersRepository.updateUser(promotedId, {
				userGroup: "admin",
			});
			return await ctx.reply("Пользователь успешно повышен!");
		} else if (user.userGroup == "banned") {
			await usersRepository.updateUser(promotedId, {
				userGroup: "admin",
			});
			return await ctx.reply("Пользователь успешно разблокирован и повышен до администратора!");
		}
	};
}

module.exports = {
	adminService,
	userSearchService,
	userPanelService,
	userProfileService,
	userBanService,
	userPromoteService,
};
