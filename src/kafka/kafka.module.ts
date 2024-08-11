import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { ConfigModule } from '@nestjs/config';
import { KafkaProducerService } from './kafka-producer.service';

@Module({
  imports: [ConfigModule.forRoot()], // Load environment variables
  providers: [KafkaService, KafkaProducerService],
  exports: [KafkaService, KafkaProducerService],
})
export class KafkaModule {}
