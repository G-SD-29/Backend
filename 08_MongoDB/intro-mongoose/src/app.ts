import { Product, User, Order } from '#models';
import type { ProductType, OrderType } from '#types';
import { overwriteMiddlewareResult, Types } from 'mongoose';
import '#db';

// const newProducts: ProductType[] = [
// 	{
// 		name: 'something',
// 		price: 20.2,
// 		stock: 100,
// 		tags: ['something'],
// 	},
// 	{ name: 'something else', price: 2.2, stock: 424, tags: ['else'] },
// ];

// try {
// 	const insertedProducts = await Product.insertMany(newProducts);
// 	console.log(insertedProducts);
// } catch (error) {
// 	if (error instanceof Error) {
// 		console.log('Something went wrong', error.message);
// 	} else {
// 		console.log('unknown error occured');
// 	}
// }

// try {
// 	const products = await Product.find();
// 	products.forEach((product) => console.log(product));
// } catch (error) {
// 	if (error instanceof Error) {
// 		console.log('Something went wrong', error.message);
// 	} else {
// 		console.log('unknown error occured');
// 	}
// }

const newUsers: UserType[] = [
	{
		name: 'karl',
		age: 20,
		isActive: true,
		email: 'karl@example.org',
		address: {
			street: 'rue de avignon',
			city: 'paris',
		},
	},
	{
		name: 'hannah',
		age: 30,
		email: 'hannah@example.org',
		address: {
			street: 'lindenstrasse',
			city: 'berlin',
		},
	},
];

// try {
// 	const insertedUser = await User.insertMany(newUsers);
// 	console.log(insertedUser);
// } catch (error) {
// 	if (error instanceof Error) {
// 		console.log('Something went wrong', error.message);
// 	} else {
// 		console.log('unknown error occured');
// 	}
// }

// try {
// 	const addresses = await User.find({
// 		'address._id': '6a8e9b7630d925b3201a7594',
// 	});
// 	console.log(addresses);
// } catch (error) {
// 	console.log(error);
// }

const newOrder: OrderType = {
	customer: new Types.ObjectId('6a8e9b7630d925b3201a7591'),
	products: [
		new Types.ObjectId('6a8e9a978dc9ba8a7242f9c3'),
		new Types.ObjectId('6a8e9a978dc9ba8a7242f9c5'),
	],
};

// try {
// 	const insertedOrder = await Order.insertOne(newOrder);
// 	console.log(insertedOrder);
// } catch (error) {
// 	if (error instanceof Error) {
// 		console.log('Something went wrong', error.message);
// 	} else {
// 		console.log('unknown error occured');
// 	}
// }

try {
	const orders = await Order.find().populate(['products', 'customer']);
	console.log(orders);
	orders[0].products.forEach((p) => console.log(p));
} catch (error) {
	if (error instanceof Error) {
		console.log('Something went wrong', error.message);
	} else {
		console.log('unknown error occured');
	}
}

process.exit(0);
