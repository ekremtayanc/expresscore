import { Kafka, logLevel } from 'kafkajs';
import dotenv from 'dotenv';

dotenv.config();

const kafka = new Kafka({ 
  clientId: 'my-app',
  brokers: [process.env.KAFKA_BROKER ?? 'kafka:9092'],
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
  logLevel: logLevel.ERROR,
});

const consumer = kafka.consumer({ 
  groupId: 'group1',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
});

let isConnected = false;
let isRunning = false;

export const kafkaConsumerInit = async (): Promise<void> => {
  if (isConnected && isRunning) {
    console.log('Kafka consumer zaten bağlı ve çalışıyor.');
    return;
  }

  try {
    console.log('Kafka consumer bağlanıyor...');
    await consumer.connect();
    isConnected = true;

    // Admin ile topic kontrolü
    const admin = kafka.admin();
    await admin.connect();

    const topicName = process.env.KAFKA_TOPIC || 'test-topic';

    const topics = await admin.listTopics();
    if (!topics.includes(topicName)) {
      console.log(`${topicName} topic'i bulunamadı, oluşturuluyor...`);
      await admin.createTopics({
        topics: [{
          topic: topicName,
          numPartitions: 3,
          replicationFactor: 1,
        }]
      });
      console.log(`${topicName} topic'i oluşturuldu.`);
    } else {
      console.log(`${topicName} topic'i zaten mevcut.`);
    }

    await admin.disconnect();

    console.log(`Topic'e subscribe ediliyor: ${topicName}`);
    await consumer.subscribe({ topic: topicName, fromBeginning: true });

    if (!isRunning) {
      await consumer.run({
        eachMessage: async ({ topic, partition, message, heartbeat }) => {
          try {
            const value = message.value?.toString() ?? '<boş>';
            console.log(`✅ Mesaj alındı - [${topic}] Offset: ${message.offset}, Value: ${value}`);
            await heartbeat();
          } catch (processingError) {
            console.error('⛔️ Mesaj işleme hatası:', processingError);
          }
        }
      });
      isRunning = true;
      console.log('Kafka consumer çalışıyor...');
    }

    // Crash Event Listener
    consumer.on(consumer.events.CRASH, async (event) => {
      console.error('🔥 Kafka consumer crash:', event.payload?.error);
      isConnected = false;
      isRunning = false;

      console.log('⏳ 5 saniye sonra yeniden bağlanma deneniyor...');
      await new Promise(res => setTimeout(res, 5000));
      await kafkaConsumerInit();
    });

  } catch (error: unknown) {
    console.error('🚨 Kafka consumer başlatma hatası:', error);

    isConnected = false;
    isRunning = false;

    console.log('🔁 5 saniye sonra yeniden bağlanma deneniyor...');
    await new Promise(res => setTimeout(res, 5000));
    await kafkaConsumerInit();
  }
};

export const kafkaConsumerShutdown = async (): Promise<void> => {
  try {
    console.log('Kafka consumer kapatılıyor...');
    await consumer.disconnect();
    isConnected = false;
    isRunning = false;
    console.log('Kafka consumer kapatıldı.');
  } catch (error) {
    console.error('Kafka consumer kapatma hatası:', error);
  }
};

process.on('SIGINT', kafkaConsumerShutdown);
process.on('SIGTERM', kafkaConsumerShutdown);
