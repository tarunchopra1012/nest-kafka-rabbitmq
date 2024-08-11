import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection;
  private channel;

  private readonly RABBITMQ_URL = 'amqp://localhost';

  async onModuleInit() {
    this.connection = await amqp.connect(this.RABBITMQ_URL);
    this.channel = await this.connection.createChannel();
    console.log('Connected to RabbitMQ');
  }

  async publishToQueue(queueName: string, message: object) {
    await this.channel.assertQueue(queueName, { durable: true });
    this.channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)));
    console.log(`Message sent to RabbitMQ queue "${queueName}":`, message);
  }

  async consumeFromQueue(queueName: string, callback: (msg: any) => void) {
    await this.channel.assertQueue(queueName, { durable: true });
    this.channel.consume(queueName, (msg) => {
      if (msg !== null) {
        const content = JSON.parse(msg.content.toString());
        callback(content);
        this.channel.ack(msg);
      }
    });
    console.log(`Consuming messages from RabbitMQ queue "${queueName}"`);
  }

  async onModuleDestroy() {
    await this.channel.close();
    await this.connection.close();
  }
}
