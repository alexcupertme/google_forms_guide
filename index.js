const dotenv = require("dotenv");
const mongoose = require("mongoose");
const grammy = require("grammy");
const { Router } = require("@grammyjs/router");
const { session } = require("grammy");
dotenv.config();
const config = process.env;
const bot = new grammy.Bot(config.BOT_TOKEN);

const authMiddleware = require("./middlewares/auth.mw");

const router = new Router((ctx) => ctx.session.scene);
bot.use(session({ initial: () => ({ scene: "", isAdmin: false, user: {}, isTopAdmin: false, customData: {} }) }));
bot.use(router);

const { UsersRepository } = require("./repositories/users.repository");
const { FormsRepository } = require("./repositories/forms.repository");

const startRoute = require("./bot/start.route");
const startService = require("./services/start.service");

const adminRoute = require("./bot/admin.route");
const {
	adminService,
	userPanelService,
	userSearchService,
	userProfileService,
	userBanService,
	userPromoteService,
} = require("./services/admin.service");

const formRoute = require("./bot/form.route");
const {
	mainFormService,
	inputFormService,
	createFormService,
	viewFormService,
	deleteFormService,
	startFormService,
	inputAnswersService,
	listAnswersService,
} = require("./services/form.service");

mongoose.connect(config.MONGODB_CONNECTION_STRING);

bot.use(authMiddleware(new UsersRepository()));

startRoute(bot, startService(bot, new UsersRepository(), viewFormService(new FormsRepository())));
adminRoute(
	bot,
	router,
	adminService(),
	userPanelService(),
	userSearchService,
	userProfileService(new UsersRepository()),
	userBanService(new UsersRepository()),
	userPromoteService(new UsersRepository())
);
formRoute(
	bot,
	router,
	mainFormService(new FormsRepository()),
	inputFormService(new FormsRepository()),
	createFormService(),
	deleteFormService(new FormsRepository()),
	startFormService(new FormsRepository()),
	inputAnswersService(new FormsRepository(), new UsersRepository()),
	listAnswersService(new FormsRepository(), new UsersRepository())
);

bot.start();
