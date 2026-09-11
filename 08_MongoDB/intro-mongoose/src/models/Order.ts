import { Schema, model } from 'mongoose';

const orderSchema = new Schema({
	customer: {
		type: Schema.Types.ObjectId,
		ref: 'User',
	},
	products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
});

export default model('Order', orderSchema);
