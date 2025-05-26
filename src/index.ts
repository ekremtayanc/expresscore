import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

import { logger } from './utils/logger';
import { kafkaConsumerInit } from './kafka/consumer';
import { createTopic, kafkaProducerInit, sendMessage } from './kafka/producer';

dotenv.config();
const swaggerDocument = YAML.load('./src/swagger/swagger.yaml');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
}));

// Routes
app.get('/', (_req, res) => {
  res.send('Express Kafka Starter Kit!');
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Server startup
app.listen(PORT, async () => {
  logger.info(`🚀 Server is running on port ${PORT}`);

  try {
    logger.info('🔌 Kafka bağlantısı başlatılıyor...');
    await kafkaConsumerInit();
    await kafkaProducerInit();
    await createTopic('test-topic');

    // 🧪 İlk test mesajı (dev ortamı için uygunsa)
    if (process.env.NODE_ENV !== 'production') {
      await sendMessage('Merhaba Kafka!');
    }

    logger.info('✅ Kafka bağlantıları hazır.');

  } catch (error: unknown) {
    logger.error('❌ Sunucu başlangıcında hata:', error);
    process.exit(1);
  }
});
