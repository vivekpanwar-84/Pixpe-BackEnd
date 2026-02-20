import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Role } from '../modules/roles/entities/role.entity';
import { RoleSlug } from '../common/constants/roles.enum';
import { Repository } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    // Using Repository directly from TypeORM feature
    const roleRepo = app.get<Repository<Role>>(getRepositoryToken(Role));

    const roles = [
        {
            title: 'Admin',
            slug: RoleSlug.ADMIN,
            description: 'Super Admin with full access',
            permissions: ['*'],
        },
        {
            title: 'Manager',
            slug: RoleSlug.MANAGER,
            description: 'Operations Manager',
            permissions: ['user.read', 'kyc.approve', 'aoi.assign'],
        },
        {
            title: 'Editor',
            slug: RoleSlug.EDITOR,
            description: 'Data Entry Editor',
            permissions: ['photo.view_assigned', 'form.submit'],
        },
        {
            title: 'Surveyor',
            slug: RoleSlug.SURVEYOR,
            description: 'Field Surveyor',
            permissions: ['aoi.start', 'poi.create', 'photo.upload'],
        },
    ];

    for (const roleData of roles) {
        const existing = await roleRepo.findOne({ where: { slug: roleData.slug } });
        if (!existing) {
            await roleRepo.save(roleRepo.create(roleData));
            console.log(`Created role: ${roleData.title}`);
        } else {
            console.log(`Role already exists: ${roleData.title}`);
        }
    }

    await app.close();
}

bootstrap();
