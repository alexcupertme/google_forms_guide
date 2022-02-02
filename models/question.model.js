const { Schema, model } = require("mongoose");
const uuid = require("uuid");

const QuestionSchema = new Schema({
	uuid: {
		type: String,
		required: true,
		default: () => uuid.v4(),
	},
	attachedToFormId: {
		type: String,
		required: true,
	},
	textContent: {
		type: String,
		required: true,
	},
	position: {
		type: Number,
		required: true,
	},
});

const questionModel = model("question", QuestionSchema);

module.exports = questionModel;
