import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet'; // 헤더를 자동 설정으로 보안 강화

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  
  app.enableCors();
  
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  
  await app.listen(3000);
  console.log('BaroDoc API http://localhost:3000  |  Socket NS: /barodoc');
}
bootstrap();
