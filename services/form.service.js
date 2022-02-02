const { InlineKeyboard } = require("grammy");

function mainFormService(formsRepository) {
	return async function (ctx) {
		const forms = await formsRepository.getFormsByUserId(ctx.session.user.uuid);
		let stringBuilder = "\n\n";
		forms.forEach((form, index) => {
			stringBuilder += `${index + 1}# ${form.header}, https://t.me/${ctx.me.username}?start=f_${form.uuid}\n\n`;
		});
		await ctx.editMessageText("Вот созданные вами опросы:" + stringBuilder, {
			reply_markup: new InlineKeyboard().text("Создать новый опрос", "f_create").row(),
		});
	};
}

function createFormService() {
	return async function (ctx) {
		ctx.session.scene = "f_input";
		await ctx.reply(`Введите данные для опроса (максимум 10 вопросов), вопросы разделяйте пустой строкой. Формат:
#Заголовок

*Вопрос1

*Вопрос2

*Вопрос3
...`);
	};
}

function inputFormService(formsRepository) {
	return async function (ctx) {
		ctx.session.scene = "";
		const rawFormData = ctx.msg?.text?.split("\n\n");
		if (!rawFormData) return ctx.reply("Неправильные данные! Отмена операции");
		let formData = rawFormData
			.map((el) => {
				if (el[0] == "#") {
					return {
						type: "header",
						text: el.slice(1),
					};
				} else if (el[0] == "*") {
					return {
						type: "question",
						text: el.slice(1),
					};
				}
			})
			.slice(0, 10);
		const formForSave = formData.find((value) => value?.type == "header");
		if (!formForSave) return ctx.reply("Неправильный заголовок! Отмена операции");
		let questionsForSave = formData.filter((value) => value?.type == "question");
		if (!questionsForSave.length) return ctx.reply("Не введены / неправильно введены вопросы! Отмена операции");
		const savedForm = await formsRepository.createForm({ header: formForSave.text, userId: ctx.session.user.uuid });

		let questions = questionsForSave.map((value, index) => {
			return {
				attachedToFormId: savedForm.uuid,
				position: index,
				textContent: value.text,
			};
		});

		await formsRepository.createQuestions(questions);

		await ctx.reply(`Форма успешно создана! Посмотреть форму:\n https://t.me/${ctx.me.username}?start=f_${savedForm.uuid}`);
	};
}

function viewFormService(formsRepository) {
	return async function (ctx) {
		const formId = await ctx.match.replace("f_", "");
		const formData = await formsRepository.getForm(formId);

		if (!formData.form) return ctx.reply("Форма не найдена!");
		const form = formData.form;
		const questions = formData.questions.sort((a, b) => a.position - b.position);

		let stringBuilder = `Название: ${form.header}
Создатель (UUID): ${form.attachedToUserId}
Дата создания: ${new Date(form.creationDate).toLocaleString()}\n`;

		let buttons = new InlineKeyboard().text(`Пройти форму`, "f_start_" + formId).row();
		if (ctx.chat.id == form.attachedToUserId || ctx.session.isAdmin || ctx.session.isTopAdmin) {
			stringBuilder += `Пользователей прошло: ${form.usersCompleted}\n`;

			stringBuilder += "\nВопросы формы:\n\n";

			questions.forEach((val, index) => {
				stringBuilder += `${index + 1}# ${val.textContent}\n`;
			});

			buttons = buttons
				.text("Посмотреть ответы пользователей", "f_ans_list_" + form.uuid)
				.row()
				.text("Удалить форму", "f_delete_" + form.uuid)
				.row();
		}

		await ctx.reply(stringBuilder, {
			reply_markup: buttons,
		});
	};
}

function deleteFormService(formsRepository) {
	return async function (ctx) {
		const formId = await ctx.match[1];
		const formData = await formsRepository.getForm(formId);
		if (!formData.form) return ctx.reply("Форма не найдена!");
		const form = formData.form;

		if (form.uuid != ctx.session.user.uuid && !ctx.session.isTopAdmin) return ctx.reply("Вы не можете удалить данную форму!");

		await formsRepository.deleteQuestions(form.uuid);
		await formsRepository.deleteForm(form.uuid);
		await formsRepository.deleteAnswers(form.uuid);

		await ctx.reply("Форма успешно удалена!");
	};
}

function startFormService(formsRepository) {
	return async function (ctx) {
		const formId = await ctx.match[1];
		const formData = await formsRepository.getForm(formId);
		if (!formData.form) return await ctx.reply("Форма не найдена!");
		const form = formData.form;
		const questions = formData.questions.sort((a, b) => a.position - b.position);

		if (ctx.session.user.completedForms.find((val) => val == formId)) return await ctx.reply("Вы уже проходили данную форму!");

		let stringBuilder = `Это опрос, созданный через бота @${ctx.me.username}. Пожалуйста, пройдите его
Вопросы формы:\n\n`;

		questions.forEach((val, index) => {
			stringBuilder += `${index + 1}# ${val.textContent}\n`;
		});

		stringBuilder += `\n======\nФормат записи ответов (разделяйте ответы пустой строкой):
=Ответ на вопрос 1

=Ответ на вопрос 2

=Ответ на вопрос 3

...`;
		ctx.session.customData.formId = formId;
		ctx.session.scene = "f_ans_input";

		await ctx.reply(stringBuilder);
	};
}

function inputAnswersService(formsRepository, usersRepository) {
	return async function (ctx) {
		ctx.session.scene = "";
		const formId = ctx.session.customData.formId;

		const formData = await formsRepository.getForm(formId);
		const form = formData.form;
		const questions = formData.questions.sort((a, b) => a.position - b.position);

		const user = await usersRepository.getUser({ telegramId: ctx.chat.id });

		const rawAnsData = ctx.msg?.text?.split("\n\n");
		if (!rawAnsData) return ctx.reply("Неправильные данные! Отмена операции");
		let answersData = rawAnsData
			.map((el) => {
				if (el[0] == "=") {
					return {
						text: el.slice(1),
					};
				}
			})
			.slice(0, 10);
		if (!answersData.length || answersData.length != questions.length)
			return ctx.reply("Не введены некоторые / неправильно введены ответы! Отмена операции");

		let answers = questions.map((ans, index) => {
			return {
				attachedToFormId: form.uuid,
				attachedToQuestionId: ans.uuid,
				attachedToUserId: ctx.session.user.uuid,
				text: answersData[index].text,
			};
		});

		await formsRepository.saveAnswers(answers);
		await formsRepository.increaseFormCompleted(formId);

		await usersRepository.addFormCompleted(user.uuid, formId);

		await ctx.reply(`Форма успешно пройдена! Спасибо.`);
	};
}

function listAnswersService(formsRepository, usersRepository) {
	return async function (ctx) {
		const formId = ctx.match[1];

		const formData = await formsRepository.getForm(formId);

		const answers = await formsRepository.getAnswers(formId);

		if (!formData.form) return ctx.reply("Форма не найдена!");
		const form = formData.form;
		const questions = formData.questions;

		if (form.uuid != ctx.session.user.uuid && !ctx.session.isTopAdmin) return ctx.reply("Вы не можете посмотреть ответы пользователей данной формы!");

		const groupByUserId = answers.reduce((group, answer) => {
			const { attachedToUserId } = answer;
			group[attachedToUserId] = group[attachedToUserId] ?? [];
			group[attachedToUserId].push(answer);
			return group;
		}, {});
		let stringBuilder = `Ответы пользователей на опрос: ${form.header}`;
		for (let userId in groupByUserId) {
			const user = await usersRepository.getUser({ uuid: userId });
			stringBuilder += `\n======\nПользователь: ${user.telegramName}\n\nОтветы:\n`;
			groupByUserId[userId].map(async (ans) => {
				stringBuilder += `Вопрос: ${questions.find((question) => question.uuid == ans.attachedToQuestionId).textContent}\nОтвет: ${ans.text}\n\n`;
			});
		}

		await ctx.reply(stringBuilder);
	};
}

module.exports = {
	mainFormService,
	inputFormService,
	createFormService,
	viewFormService,
	deleteFormService,
	startFormService,
	inputAnswersService,
	listAnswersService,
};
