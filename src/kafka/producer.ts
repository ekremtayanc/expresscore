import { Kafka } from 'kafkajs';

const kafka = new Kafka({ brokers: ['localhost:9092'] });
const producer = kafka.producer();

export const kafkaProducerInit = async () => {
  await producer.connect();
};

export const sendMessage = async (topic: string, message: string) => {
  await producer.send({
    topic,
    messages: [{ value: message }],
  });
};
