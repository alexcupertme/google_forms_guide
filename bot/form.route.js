module.exports = function formRoute(
	botInstance,
	router,
	mainService,
	inputService,
	createService,
	deleteService,
	startService,
	answersService,
	listAnswersService
) {
	botInstance.callbackQuery("f_list", mainService);
	botInstance.callbackQuery("f_create", createService);
	botInstance.callbackQuery(/f_delete_([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/, deleteService);
	botInstance.callbackQuery(/f_start_([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/, startService);

	botInstance.callbackQuery(/f_ans_list_([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/, listAnswersService);

	router.route("f_ans_input", answersService);
	router.route("f_input", inputService);
};
