import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { logger } from './utils/logger';
import { kafkaConsumerInit } from './kafka/consumer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Güvenlik middlewares
app.use(helmet());
app.use(cors());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 100, // IP başına 100 istek
  })
);

// JSON parsing
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Express Kafka Starter Kit!');
});

app.listen(PORT, async () => {
  logger.info(`Server is running on port ${PORT}`);
  await kafkaConsumerInit();
});
