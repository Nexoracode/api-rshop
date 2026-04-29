import { Module } from '@nestjs/common';
import { AmadastService } from './amadast.service';
import { AmadastController } from './amadast.controller';

@Module({
  controllers: [AmadastController],
  providers: [AmadastService],
})
export class AmadastModule {}
