import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Kafka, KafkaConfig, Admin, Producer, Consumer } from 'kafkajs';
import { TrainService } from '../train/train.service';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private admin: Admin;

  constructor(
    @Inject(forwardRef(() => TrainService))
    private readonly trainService: TrainService,
  ) {
    const kafkaConfig: KafkaConfig = {
      clientId: 'my-app',
      brokers: ['192.0.0.1:9092'],
    };
    this.kafka = new Kafka(kafkaConfig);
  }

  async onModuleInit() {
    // Connect Admin to Kafka
    this.admin = this.kafka.admin();
    console.log('Admin connecting...');
    await this.admin.connect();
    console.log('Admin Connection Success...');

    // Check if the topics exist and create them if not
    await this.createTopicsIfNotExist([
      'train_activation',
      'train_cancellation',
    ]);

    console.log('Disconnecting Admin...');
    await this.admin.disconnect();

    // Connect Producer
    this.producer = this.kafka.producer();
    await this.producer.connect();
    console.log('Kafka Producer connected successfully.');

    // Connect Consumer
    this.consumer = this.kafka.consumer({ groupId: 'rail_consumer_group' });
    await this.consumer.connect();
    console.log('Kafka Consumer connected successfully.');

    await this.consumer.subscribe({
      topics: ['train_activation', 'train_cancellation'],
    });
    this.runConsumer();
  }

  private async createTopicsIfNotExist(topics: string[]) {
    console.log(`Creating Topics if not exist [${topics.join(', ')}]`);

    // Fetch existing topics
    const existingTopics = await this.admin.listTopics();

    // Filter out topics that already exist
    const topicsToCreate = topics.filter(
      (topic) => !existingTopics.includes(topic),
    );

    if (topicsToCreate.length > 0) {
      await this.admin.createTopics({
        topics: topicsToCreate.map((topic) => ({
          topic,
          numPartitions: 2,
        })),
      });
      console.log(`Topics Created: [${topicsToCreate.join(', ')}]`);
    } else {
      console.log('All topics already exist. No new topics created.');
    }
  }

  private async runConsumer() {
    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        const processedMessage = JSON.parse(message.value.toString());
        console.log(
          `Received message from topic "${topic}":`,
          processedMessage,
        );

        // Process the message as needed
        if (topic === 'train_activation') {
          const { trainId, stanox, timestamp } = processedMessage;
          await this.trainService.handleTrainActivation(
            trainId,
            stanox,
            timestamp,
          );
        } else if (topic === 'train_cancellation') {
          const { trainId, stanox, reasonCode, timestamp } = processedMessage;
          await this.trainService.handleTrainCancellation(
            trainId,
            stanox,
            reasonCode,
            timestamp,
          );
        }
      },
    });
  }

  async sendMessage(topic: string, message: object) {
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
    console.log(`Message sent to Kafka topic "${topic}":`, message);
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    await this.consumer.disconnect();
  }
}
