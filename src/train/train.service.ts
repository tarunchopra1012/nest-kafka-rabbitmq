import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KafkaService } from '../kafka/kafka.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { ActiveTrain } from '../entities/active-train.entity';
import { CancelledTrain } from '../entities/cancelled-train.entity';

@Injectable()
export class TrainService {
  constructor(
    private readonly kafkaService: KafkaService,
    private readonly rabbitMQService: RabbitMQService,

    @InjectRepository(ActiveTrain)
    private readonly activeTrainRepository: Repository<ActiveTrain>,

    @InjectRepository(CancelledTrain)
    private readonly cancelledTrainRepository: Repository<CancelledTrain>,
  ) {}

  async handleTrainActivation(
    trainId: string,
    stanox: string,
    timestamp: string,
  ) {
    await this.kafkaService.sendMessage('train_activation', {
      trainId,
      stanox,
      timestamp,
    });
    await this.rabbitMQService.publishToQueue('train_activation_queue', {
      trainId,
      stanox,
      timestamp,
    });

    const activeTrain = this.activeTrainRepository.create({
      trainId,
      stanox,
      timestamp,
    });
    await this.activeTrainRepository.save(activeTrain);
    console.log('Active train data saved:', activeTrain);
  }

  async handleTrainCancellation(
    trainId: string,
    stanox: string,
    reasonCode: string,
    timestamp: string,
  ) {
    await this.kafkaService.sendMessage('train_cancellation', {
      trainId,
      stanox,
      reasonCode,
      timestamp,
    });

    await this.rabbitMQService.publishToQueue('train_cancellation_queue', {
      trainId,
      stanox,
      reasonCode,
      timestamp,
    });

    const cancelledTrain = this.cancelledTrainRepository.create({
      trainId,
      stanox,
      reasonCode,
      timestamp,
    });

    await this.cancelledTrainRepository.save(cancelledTrain);
    console.log('Cancelled train data saved:', cancelledTrain);
  }
}
