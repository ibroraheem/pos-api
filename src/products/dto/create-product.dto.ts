import { IsString, IsInt, IsBoolean, IsOptional, IsDateString, Min } from 'class-validator';

export class CreateProductDto {
    @IsString()
    name: string;

    @IsInt()
    @Min(0)
    costPrice: number;

    @IsInt()
    @Min(0)
    salePrice: number;

    @IsInt()
    @Min(0)
    stockLevel: number;

    @IsString()
    @IsOptional()
    unit?: string; // e.g. 'KG', 'UNIT'

    @IsBoolean()
    @IsOptional()
    isVatExempt?: boolean;

    @IsDateString()
    @IsOptional()
    expiryDate?: string;

    @IsString()
    @IsOptional()
    batchNumber?: string;

    @IsBoolean()
    @IsOptional()
    isPrescriptionRequired?: boolean;
}
