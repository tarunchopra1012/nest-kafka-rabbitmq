import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainService } from './train.service';
import { TrainController } from './train.controller';
import { KafkaModule } from '../kafka/kafka.module';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';
import { ActiveTrain } from '../entities/active-train.entity';
import { CancelledTrain } from '../entities/cancelled-train.entity';

@Module({
  imports: [
    KafkaModule,
    RabbitMQModule,
    TypeOrmModule.forFeature([ActiveTrain, CancelledTrain]),
  ],
  providers: [TrainService],
  controllers: [TrainController],
})
export class TrainModule {}
