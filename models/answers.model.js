const { Schema, model } = require("mongoose");
const uuid = require("uuid");

const AnswersSchema = new Schema({
	uuid: {
		type: String,
		required: true,
		default: () => uuid.v4(),
	},
	attachedToQuestionId: {
		type: String,
		required: true,
	},
	attachedToFormId: {
		type: String,
		required: true,
	},
	attachedToUserId: {
		type: String,
		required: true,
	},
	text: {
		type: String,
		required: true,
	},
});

const answersModel = model("answer", AnswersSchema);

module.exports = answersModel;
