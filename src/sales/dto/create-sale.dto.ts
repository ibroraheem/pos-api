import { IsString, IsInt, ValidateNested, ArrayMinSize, Min } from 'class-validator';
import { Type } from 'class-transformer';

class CreateSaleItemDto {
    @IsString()
    productId: string;

    @IsInt()
    @Min(1)
    quantity: number;
}

export class CreateSaleDto {
    @IsString()
    clientTransactionId: string;

    @ValidateNested({ each: true })
    @ArrayMinSize(1)
    @Type(() => CreateSaleItemDto)
    items: CreateSaleItemDto[];
}
