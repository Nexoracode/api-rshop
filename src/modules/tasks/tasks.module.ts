import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CardModule } from '../card/card.module';

@Module({
    imports: [
        CardModule, // برای دسترسی به CardStatusService
    ],
    providers: [TasksService],
})
export class TasksModule { }
