module.exports = function adminRoute(botInstance, router, mainService, panelService, searchService, profileService, banService, promoteService) {
	botInstance.callbackQuery("admin", mainService);

	botInstance.callbackQuery("users", panelService);

	botInstance.callbackQuery("find_u_uuid", searchService("uuid"));
	botInstance.callbackQuery("find_u_tid", searchService("tid"));
	botInstance.callbackQuery("find_u_username", searchService("username"));

	router.route("enter_tid", profileService);
	router.route("enter_uuid", profileService);
	router.route("enter_username", profileService);

	botInstance.callbackQuery(/ban_([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/, banService);
	botInstance.callbackQuery(/promote_([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/, promoteService);
};
