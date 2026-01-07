import { IsString, IsNotEmpty, IsInt, Min, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

class PurchaseOrderItemDto {
    @IsString()
    @IsNotEmpty()
    productId: string;

    @IsInt()
    @Min(1)
    quantity: number;

    @IsInt()
    @Min(0)
    unitCost: number; // Kobo
}

export class CreatePurchaseOrderDto {
    @IsString()
    @IsNotEmpty()
    supplierId: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PurchaseOrderItemDto)
    items: PurchaseOrderItemDto[];
}
