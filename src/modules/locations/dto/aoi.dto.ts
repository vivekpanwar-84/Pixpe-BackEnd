import { IsString, IsNotEmpty, IsObject, IsOptional, IsEnum, IsUUID, IsNumber } from 'class-validator';

export class CreateAoiDto {
    @IsString()
    @IsNotEmpty()
    aoi_name: string;

    @IsObject()
    @IsNotEmpty()
    boundary_geojson: object;

    @IsNumber()
    @IsNotEmpty()
    center_latitude: number;

    @IsNumber()
    @IsNotEmpty()
    center_longitude: number;

    @IsString()
    @IsNotEmpty()
    city?: string;

    @IsString()
    @IsNotEmpty()
    state?: string;

    @IsString()
    @IsNotEmpty()
    pin_code?: string;

    @IsString()
    @IsOptional()
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';

    @IsOptional()
    deadline?: Date;
}

export class UpdateAoiDto {
    @IsString()
    @IsOptional()
    aoi_name?: string;

    @IsObject()
    @IsOptional()
    boundary_geojson?: object;

    @IsString()
    @IsOptional()
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';

    @IsOptional()
    deadline?: Date;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class AssignAoiDto {
    @IsUUID()
    @IsOptional()
    surveyor_id?: string;

    @IsUUID()
    @IsOptional()
    editor_id?: string;
}

export class BulkAssignAoiDto {
    @IsUUID(undefined, { each: true })
    @IsNotEmpty({ each: true })
    aoi_ids: string[];

    @IsUUID()
    @IsOptional()
    surveyor_id?: string;

    @IsUUID()
    @IsOptional()
    editor_id?: string;
}
