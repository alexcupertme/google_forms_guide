module.exports = function startRoute(botInstance, service) {
	botInstance.command("start", service);
	botInstance.callbackQuery("start", service);
};
