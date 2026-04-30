import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Province } from './provinces.entity';

@Entity('cities')
export class City {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'city_id', type: 'int', unique: true })
    cityId!: number;

    @Column({ type: 'varchar', length: 100 })
    title!: string;

    @Column({ name: 'province_id', type: 'int' })
    provinceId!: number;

    @Column({ type: 'varchar', length: 100, nullable: true })
    location!: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    @ManyToOne(() => Province, (province) => province.cities, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'province_id', referencedColumnName: 'provinceId' })
    province!: Province;
}