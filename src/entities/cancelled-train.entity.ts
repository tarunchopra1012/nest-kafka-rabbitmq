import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('cancelled_trains')
export class CancelledTrain {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  trainId: string;

  @Column()
  stanox: string;

  @Column()
  reasonCode: string;

  @Column()
  timestamp: string;
}
