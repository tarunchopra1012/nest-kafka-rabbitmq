import { Controller } from '@nestjs/common';
import { TrainService } from './train.service';

@Controller('train')
export class TrainController {
  constructor(private readonly trainService: TrainService) {}

  // Define routes to handle incoming requests if needed
}
