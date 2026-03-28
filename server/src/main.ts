import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const globalPrefix = 'api';
  const PORT = 5000;

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(globalPrefix);

  await app.listen(PORT);
}
void bootstrap();

// import { NestFactory } from '@nestjs/core';
// import { ValidationPipe } from '@nestjs/common';
// import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

// import { AppModule } from './app.module';

// async function bootstrap() {
//   const globalPrefix = 'api';
//   const PORT = 5000;

//   const app = await NestFactory.create(AppModule);
//   app.setGlobalPrefix(globalPrefix);

//   const config = new DocumentBuilder()
//     .setTitle('Your title')
//     .setDescription('Your description')
//     .setVersion('1.0')
//     .addTag('Your tag')
//     .addBearerAuth(
//       {
//         type: 'http',
//         scheme: 'bearer',
//         bearerFormat: 'JWT', // Optional: specify the format
//         name: 'Authorization',
//         description: 'Enter your JWT token',
//         in: 'header',
//       },
//       'access-token', // This name (securitySchemeName) is important for referencing the scheme later
//     )
//     .build();

//   const documentFactory = () => SwaggerModule.createDocument(app, config);

//   SwaggerModule.setup(`${globalPrefix}/explorer`, app, documentFactory);

//   app.useGlobalPipes(
//     new ValidationPipe({
//       transform: true,
//       whitelist: true,
//     }),
//   );

//   await app.listen(PORT);
// }

// void bootstrap();
