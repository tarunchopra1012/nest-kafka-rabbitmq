import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import * as stompit from 'stompit';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly kafkaProducer: Producer;

  constructor(private configService: ConfigService) {
    const kafkaConfig = {
      clientId: 'rail_app_producer',
      brokers: ['192.0.0.1:9092'],
    };

    this.kafkaProducer = new Kafka(kafkaConfig).producer();
  }

  async onModuleInit() {
    await this.kafkaProducer.connect();
    console.log('Kafka Producer connected successfully');
    this.initStompClient();
  }

  async onModuleDestroy() {
    await this.kafkaProducer.disconnect();
  }

  private initStompClient() {
    const connectOptions = {
      host: 'publicdatafeeds.networkrail.co.uk',
      port: 61618,
      connectHeaders: {
        'heart-beat': '15000,15000',
        'client-id': '',
        host: '/',
        login: this.configService.get<string>('LOGIN_EMAIL'),
        passcode: this.configService.get<string>('LOGIN_PASSWORD'),
      },
    };

    const reconnectOptions = {
      initialReconnectDelay: 10,
      maxReconnectDelay: 30000,
      useExponentialBackOff: true,
      maxReconnects: 30,
      randomize: false,
    };

    const connectionManager = new stompit.ConnectFailover(
      [connectOptions],
      reconnectOptions,
    );

    connectionManager.connect((error, client, reconnect) => {
      if (error) {
        console.log('Terminal error, gave up reconnecting');
        return;
      }

      client.on('error', (error) => {
        console.log('Connection lost. Reconnecting...');
        reconnect();
      });

      const headers = {
        destination: '/topic/TRAIN_MVT_ALL_TOC',
        'activemq.subscriptionName': 'somename-train_mvt',
        ack: 'client-individual',
      };

      client.subscribe(headers, (error, message) => {
        if (error) {
          console.log('Subscription failed:', error.message);
          return;
        }

        message.readString('utf-8', async (error, body) => {
          if (error) {
            console.log('Failed to read a message', error);
            return;
          }

          if (body) {
            try {
              const data = JSON.parse(body);

              for (const item of data) {
                const timestamp = new Date().toISOString();

                if (item.header) {
                  if (item.header.msg_type === '0001') {
                    // Train Activation
                    const stanox =
                      item.body.tp_origin_stanox ||
                      item.body.sched_origin_stanox ||
                      'N/A';
                    console.log(
                      timestamp,
                      '- Train',
                      item.body.train_id,
                      'activated at stanox',
                      stanox,
                    );

                    const messagePayload = {
                      timestamp,
                      trainId: item.body.train_id,
                      stanox,
                    };

                    // Send the message to Kafka
                    await this.sendToKafka('train_activation', messagePayload);
                  } else if (item.header.msg_type === '0002') {
                    // Train Cancellation
                    const stanox = item.body.loc_stanox || 'N/A';
                    const reasonCode = item.body.canx_reason_code || 'N/A';
                    console.log(
                      timestamp,
                      '- Train',
                      item.body.train_id,
                      'cancelled. Cancellation Reason:',
                      reasonCode,
                      'at stanox',
                      stanox,
                    );

                    // Send the message to Kafka
                    const messagePayload = {
                      timestamp,
                      trainId: item.body.train_id,
                      stanox,
                      reasonCode,
                    };

                    // Send the message to Kafka
                    await this.sendToKafka(
                      'train_cancellation',
                      messagePayload,
                    );
                  }
                }
              }
            } catch (e) {
              console.log('Failed to parse JSON', e);
            }
          }

          client.ack(message);
        });
      });
    });
  }

  private async sendToKafka(topic: string, message: object) {
    try {
      await this.kafkaProducer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
      });

      console.log(`Message sent to Kafka topic "${topic}":`, message);
    } catch (error) {
      console.error('Error sending message to Kafka:', error.message);
    }
  }
}
