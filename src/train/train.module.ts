import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainService } from './train.service';
import { TrainController } from './train.controller';
import { ActiveTrain } from '../entities/active-train.entity';
import { CancelledTrain } from '../entities/cancelled-train.entity';
import { KafkaModule } from '../kafka/kafka.module';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ActiveTrain, CancelledTrain]),
    forwardRef(() => KafkaModule),
    RabbitMQModule,
  ],
  providers: [TrainService],
  controllers: [TrainController],
  exports: [TrainService],
})
export class TrainModule {}
