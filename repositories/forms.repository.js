const uuid = require("uuid");
const answersModel = require("../models/answers.model");

const formModel = require("../models/form.model");
const questionModel = require("../models/question.model");

class FormsRepository {
	constructor() {}
	async getForm(formId) {
		const formData = await formModel
			.findOne({
				uuid: formId,
			})
			.exec();
		const questionsArr = await questionModel
			.find({
				attachedToFormId: formId,
			})
			.exec();

		return {
			form: formData,
			questions: questionsArr,
		};
	}

	async getFormsByUserId(userId) {
		const formData = await formModel
			.find({
				attachedToUserId: userId,
			})
			.exec();
		return formData;
	}

	async createForm(data) {
		return await formModel.create({
			attachedToUserId: data.userId,
			header: data.header,
		});
	}

	async deleteForm(formId) {
		return await formModel.deleteOne({ uuid: formId }).exec();
	}

	async editForm(formId, data) {
		return await formModel
			.updateOne(
				{ uuid: formId },
				{
					attachedToUserId: data.userId,
					header: data.header,
				}
			)
			.exec();
	}

	async increaseFormCompleted(formId) {
		return await formModel.updateOne({ uuid: formId }, { $inc: { usersCompleted: 1 } }).exec();
	}

	async getQuestion(questionId) {
		return await questionModel
			.findOne({
				uuid: questionId,
			})
			.exec();
	}

	async deleteQuestions(formId) {
		return await questionModel.deleteMany({ formId });
	}

	async createQuestions(data) {
		return await questionModel.insertMany(data);
	}

	async saveAnswers(data) {
		return await answersModel.insertMany(data);
	}

	async removeAnswers(formId) {
		return await answersModel.deleteMany({ attachedToFormId: formId });
	}

	async getAnswers(formId) {
		return await answersModel.find({ attachedToFormId: formId });
	}
}

module.exports.FormsRepository = FormsRepository;
