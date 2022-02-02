const userModel = require("../models/user.model");

class UsersRepository {
	constructor() {}
	async getUser(data) {
		const user = await userModel.findOne(data).exec();
		return user;
	}
	async deleteUser(userId) {
		return await userModel.remove({ uuid: userId }).exec();
	}
	async updateUser(userId, data) {
		return await userModel
			.updateOne(
				{ uuid: userId },
				{
					userGroup: data.userGroup,
					completedForms: data.completedForms,
					telegramName: data.telegramName,
				}
			)
			.exec();
	}

	async addFormCompleted(userId, formId) {
		return await userModel.updateOne({ uuid: userId }, { $push: { completedForms: formId } }).exec();
	}

	async createUser(data) {
		return await userModel.create({
			telegramId: data.telegramId,
			telegramName: data.telegramName,
		});
	}
}

module.exports.UsersRepository = UsersRepository;
