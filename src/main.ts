import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ 
    whitelist: true, 
    transform: true,
    exceptionFactory: (errors) => {
      try {
        fs.writeFileSync('C:\\Users\\vivek\\validation_errors_debug.json', JSON.stringify(errors, null, 2));
      } catch (err) {
        console.error('Failed to log validation errors:', err);
      }
      return new ValidationPipe().createExceptionFactory()(errors);
    }
  }));
  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
