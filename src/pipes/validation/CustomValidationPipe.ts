import { BadRequestException, ValidationPipe, ValidationPipeOptions } from '@nestjs/common';
import { ValidationError } from 'class-validator';

function parseErrors(errors: ValidationError[], parentPath: string = '') {
  let parsedErrors = [];

  for (const error of errors) {
    const currentPath = parentPath ? `${parentPath}.${error.property}` : error.property;

    if (error.constraints) {
      for (const key in error.constraints) {
        parsedErrors.push({
          property: error.property,
          path: currentPath,
          message: error.constraints[key],
        });
      }
    }

    if (error.children && error.children.length > 0) {
      parsedErrors = parsedErrors.concat(parseErrors(error.children, currentPath));
    }
  }

  return parsedErrors;
}

export class CustomValidationPipe extends ValidationPipe {
  constructor(options: ValidationPipeOptions = {}) {
    super({
      ...options,
      exceptionFactory(errors) {
        const messages = parseErrors(errors);
        return new BadRequestException(messages);
      },
    });
  }
}
