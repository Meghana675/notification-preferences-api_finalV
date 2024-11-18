
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createHandler } from '@nestjs/platform-serverless';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable security headers using Helmet
  app.use(helmet());

  // Enable CORS for all routes
  app.enableCors();

  // Apply global validation pipes for incoming requests
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Set a global prefix for all routes (e.g., "/api")
  app.setGlobalPrefix('api');

  // Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle('Notification Preferences API')
    .setDescription('API for managing user notification preferences')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // Redirect root URL to a welcome message
  app.use('/', (req, res) => {
    res.status(200).send('Welcome to Notification Preferences API. Visit /api-docs for documentation.');
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}/api`);
  console.log(`Swagger Docs: http://localhost:${port}/api-docs`);
}

// Bootstrap the application (local use)
bootstrap();

// Export the serverless handler for Vercel compatibility
export const handler = createHandler(AppModule);
