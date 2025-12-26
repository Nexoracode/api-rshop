import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('otps')
@Index(['identifier', 'verified', 'expireAt']) // ✅ Composite index برای query های مهم
@Index(['createdAt']) // ✅ برای cleanup
export class Otp {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    identifier: string;

    @Column()
    code: string;

    @Column({ default: false })
    verified: boolean;

    @Column({ type: 'timestamp' })
    expireAt: Date;

    @CreateDateColumn()
    createdAt: Date;
}