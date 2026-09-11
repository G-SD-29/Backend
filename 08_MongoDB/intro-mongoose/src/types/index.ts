import { Types } from 'mongoose';

export type ProductType = {
	name: string;
	price: number;
	stock: number;
	tags?: string[];
	createdAt?: Date;
	updatedAt?: Date;
};

export type UserType = {
	name: string;
	age: number;
	isActive?: boolean;
	email: string;
	address: {
		street: string;
		city: string;
	};
};

// referenced
export type OrderType = {
	customer: Types.ObjectId;
	products: Types.ObjectId[];
};
