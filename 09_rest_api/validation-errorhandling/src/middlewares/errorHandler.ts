import { type ErrorRequestHandler } from 'express';
import { appendFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const errorHandler: ErrorRequestHandler = async (err, req, res, next) => {
  // if (process.env.NODE_ENV === 'development') {
  //   return res.status(err.cause || 500).json({ message: err.message, stack: err.stack });
  // } else {
  //   console.log(`Error ${err.message} \n Stack ${err.stack}`);
  //   res.status(err.cause || 500).json({ message: err.message });
  // }

  try {
    const logDir = join(process.cwd(), 'log');
    await mkdir(logDir, { recursive: true });

    const dateString = new Date().toISOString().split('T')[0];

    const logFilePath = join(logDir, `${dateString}-error.log`);

    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${req.method} ${req.url} - Error: ${err.message} - Stack: ${err.stack}\n`;

    await appendFile(logFilePath, logEntry, 'utf-8');
    res.send('error handler');
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log(error.message);
    } else {
      console.log(error);
    }
  }
};

export default errorHandler;
