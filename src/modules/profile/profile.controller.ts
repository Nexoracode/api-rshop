import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('03 - Profile 🧑')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) { }
}
