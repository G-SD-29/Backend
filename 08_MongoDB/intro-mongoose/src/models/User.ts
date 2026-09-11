import { Schema, model } from 'mongoose';

const addressSchema = new Schema({
	street: {
		type: String,
		required: [true, 'Street is required'],
	},

	city: {
		type: String,
		required: [true, 'City is required'],
	},
});

const userSchema = new Schema({
	name: {
		type: String,
		required: [true, 'Name is required'],
	},

	age: {
		type: Number,
		required: [true, 'Age is required'],
	},

	isActive: {
		type: Boolean,
		default: true,
	},

	email: {
		type: String,
		required: true,
		unique: true,
	},
	address: addressSchema,
});

export default model('User', userSchema);
