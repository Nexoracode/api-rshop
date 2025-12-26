import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { CategoryCacheService } from "../category/cache";

@Module({
    providers: [CategoryCacheService],
    controllers: [HealthController],
}) export class HealthModule { }