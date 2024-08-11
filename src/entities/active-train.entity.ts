import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('active_trains')
export class ActiveTrain {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  trainId: string;

  @Column()
  stanox: string;

  @Column()
  timestamp: string;
}
