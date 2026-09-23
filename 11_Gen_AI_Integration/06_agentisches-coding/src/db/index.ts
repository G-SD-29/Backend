import mongoose from 'mongoose';

export async function connectDB(uri: string) {
	await mongoose.connect(uri);
	console.log('MongoDB connected');
}

export async function disconnectDB() {
	await mongoose.disconnect();
}
