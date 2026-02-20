import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('roles')
export class Role extends BaseEntity {
    @Column({ type: 'varchar', length: 100 })
    title: string;

    @Column({ type: 'varchar', length: 50, unique: true })
    slug: string; // admin, manager, editor, surveyor

    @Column({ type: 'text', array: true, default: '{}' })
    permissions: string[];

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @OneToMany(() => User, (user) => user.role)
    users: User[];
}
