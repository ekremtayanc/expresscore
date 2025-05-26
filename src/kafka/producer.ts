import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';

dotenv.config();

const kafka = new Kafka({ 
  clientId: 'my-producer',
  brokers: [process.env.KAFKA_BROKER ?? 'kafka:9092'],
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});

const producer = kafka.producer({
  maxInFlightRequests: 1,
  idempotent: false,
  transactionTimeout: 30000,
});

let isConnected = false;

export const kafkaProducerInit = async (): Promise<void> => {
  if (isConnected) {
    console.log('Kafka producer zaten bağlı.');
    return;
  }

  try {
    console.log('Kafka producer bağlanıyor...');
    await producer.connect();
    isConnected = true;
    console.log('Kafka producer bağlandı.');
  } catch (error: unknown) {
    isConnected = false;
    console.error('❌ Kafka producer bağlantı hatası:', error);
    throw error;
  }
};

export const sendMessage = async (message: string, topicOverride?: string): Promise<void> => {
  const topic = topicOverride || process.env.KAFKA_TOPIC || 'test-topic';

  try {
    if (!isConnected) await kafkaProducerInit();

    console.log(`📤 Mesaj gönderiliyor - Topic: ${topic}, Message: ${message}`);

    const result = await producer.send({
      topic,
      messages: [{
        value: message,
        timestamp: Date.now().toString(),
      }],
    });

    console.log('✅ Mesaj başarıyla gönderildi:', result);
  } catch (error: unknown) {
    console.error('❌ Mesaj gönderme hatası:', error);
    isConnected = false;

    // Retry after delay
    console.log('🔁 2 saniye sonra yeniden deneniyor...');
    await new Promise(res => setTimeout(res, 2000));
    try {
      await kafkaProducerInit();
      await sendMessage(message, topic);
    } catch (retryError: unknown) {
      console.error('🛑 Yeniden deneme başarısız:', retryError);
      throw retryError;
    }
  }
};

// Topic oluşturma (admin API üzerinden)
export const createTopic = async (topicName: string, partitions = 3): Promise<void> => {
  const admin = kafka.admin();

  try {
    await admin.connect();
    const topics = await admin.listTopics();

    if (!topics.includes(topicName)) {
      console.log(`${topicName} topic'i oluşturuluyor...`);
      await admin.createTopics({
        topics: [{
          topic: topicName,
          numPartitions: partitions,
          replicationFactor: 1,
        }],
      });
      console.log(`${topicName} topic'i oluşturuldu.`);
    } else {
      console.log(`${topicName} topic'i zaten mevcut.`);
    }
  } catch (error: unknown) {
    console.error('❌ Topic oluşturma hatası:', error);
    throw error;
  } finally {
    await admin.disconnect();
  }
};

export const kafkaProducerShutdown = async (): Promise<void> => {
  try {
    if (isConnected) {
      console.log('Kafka producer kapatılıyor...');
      await producer.disconnect();
      isConnected = false;
      console.log('Kafka producer kapatıldı.');
    }
  } catch (error: unknown) {
    console.error('Kafka producer kapatma hatası:', error);
  }
};

process.on('SIGINT', kafkaProducerShutdown);
process.on('SIGTERM', kafkaProducerShutdown);
