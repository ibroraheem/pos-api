import { IsString, IsNotEmpty, IsInt, NotEquals } from 'class-validator';

export class CreateStockAdjustmentDto {
    @IsString()
    @IsNotEmpty()
    productId: string;

    @IsInt()
    @NotEquals(0)
    quantity: number; // Positive for found stock, Negative for shrinkage

    @IsString()
    @IsNotEmpty()
    reason: string; // e.g. "DAMAGED", "EXPIRED", "THEFT"
}
