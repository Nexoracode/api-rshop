import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { Role } from 'src/common/enums/role.enum';

export class CreateAdminUserDto {
  @ApiProperty({ description: 'نام', example: 'علی' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ description: 'نام خانوادگی', example: 'رضایی' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ description: 'شماره موبایل', example: '09120000000' })
  @IsString()
  @IsOptional()
  @Length(11, 11)
  @Matches(/^09\d{9}$/, { message: 'شماره موبایل معتبر نیست' })
  phone?: string;

  @ApiPropertyOptional({ description: 'ایمیل', nullable: true })
  @IsEmail({}, { message: 'ایمیل معتبر نیست' })
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'رمز عبور (حداقل ۶ کاراکتر)', nullable: true })
  @IsString()
  @IsNotEmpty()
  @Length(6, 100)
  @IsOptional()
  password: string;

  @ApiProperty({ description: 'آدرس تصویر پروفایل', nullable: true })
  @IsString()
  @IsOptional()
  avatarUrl: string;

  @ApiProperty({
    enum: Role,
    description: 'نقش کاربر جدید',
    example: Role.ADMIN,
    enumName: 'Role',
  })
  @IsEnum(Role, { message: 'نقش انتخاب‌شده معتبر نیست' })
  @IsNotEmpty()
  role: Role;
}
