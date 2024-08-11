import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainModule } from './train/train.module';
import { KafkaModule } from './kafka/kafka.module';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { ActiveTrain } from './entities/active-train.entity';
import { CancelledTrain } from './entities/cancelled-train.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [ActiveTrain, CancelledTrain],
      synchronize: true,
    }),
    TrainModule,
    KafkaModule,
    RabbitMQModule,
  ],
})
export class AppModule {}
