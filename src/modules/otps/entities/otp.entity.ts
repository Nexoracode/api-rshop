import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('otps')
export class Otp {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    identifier: string;

    @Column()
    code: string;

    @Column({ type: 'datetime' })
    expireAt: Date;

    @Column({ default: false })
    verified: boolean;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
}
