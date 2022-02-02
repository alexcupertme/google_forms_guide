const { Schema, model } = require("mongoose");
const uuid = require("uuid");

const FormSchema = new Schema({
	uuid: {
		type: String,
		required: true,
		default: () => uuid.v4(),
	},
	attachedToUserId: {
		type: String,
		required: true,
	},
	usersCompleted: {
		type: Number,
		default: 0,
	},
	header: {
		type: String,
		required: true,
	},
	creationDate: {
		type: Number,
		required: true,
		default: () => new Date(),
	},
});

const formModel = model("form", FormSchema);

module.exports = formModel;
