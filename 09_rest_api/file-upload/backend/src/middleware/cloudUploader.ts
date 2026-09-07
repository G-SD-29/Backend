import { v2 as cloudinary } from 'cloudinary';

import { type RequestHandler } from 'express';

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure_url: true
});

const cloudUploader: RequestHandler = async (req, res, next) => {
  try {
    const filePath = req.image!.filepath;
    const cloudinaryData = await cloudinary.uploader.upload(filePath, { resource_type: 'auto' });

    req.body.image = cloudinaryData.secure_url;
    next();
  } catch (error) {
    next(error);
  }
};

export default cloudUploader;
