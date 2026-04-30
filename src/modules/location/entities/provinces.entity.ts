import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { City } from './cities.entity';

@Entity('provinces')
export class Province {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'province_id', type: 'int', unique: true })
    provinceId!: number;

    @Column({ type: 'varchar', length: 100 })
    title!: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    location!: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    @OneToMany(() => City, (city) => city.province)
    cities!: City[];
}