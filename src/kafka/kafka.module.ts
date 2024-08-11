import { Module, forwardRef } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { ConfigModule } from '@nestjs/config';
import { KafkaProducerService } from './kafka-producer.service';
import { TrainModule } from '../train/train.module';

@Module({
  imports: [forwardRef(() => TrainModule), ConfigModule.forRoot()],
  providers: [KafkaService, KafkaProducerService],
  exports: [KafkaService, KafkaProducerService],
})
export class KafkaModule {}
