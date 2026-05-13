import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';

/**
 * Custom Validation Pipe
 * Validates request payloads against DTO classes using class-validator.
 * Automatically transforms plain objects to class instances.
 */
@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, metadata: ArgumentMetadata) {
    // Skip validation for primitive types and arrays if explicitly disabled
    if (!metadata.type || metadata.type === 'custom') {
      return value;
    }

    // Skip for built-in types
    const { metatype } = metadata;
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Transform and validate
    const object = plainToClass(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const messages = errors
        .map((error) =>
          Object.values(error.constraints || {})
            .flat()
            .join(', ')
        )
        .filter(Boolean);

      throw new BadRequestException({
        message: messages.length > 0 ? messages : 'Validation failed',
        error: 'Bad Request',
      });
    }

    return object;
  }

  private toValidate(metatype: any): boolean {
    const types: any[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
