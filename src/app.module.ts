import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbPingController } from './db-ping.controller';
import { FacilitiesModule } from './facilities/facilities.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cs: ConfigService) => ({
        type: 'mysql',
        host: cs.get<string>('DB_HOST'),
        port: cs.get<number>('DB_PORT', 3306),
        username: cs.get<string>('DB_USER'),
        password: cs.get<string>('DB_PASS'),
        database: cs.get<string>('DB_NAME'),
        autoLoadEntities: true,   // 엔티티 등록 시 자동 로드
        synchronize: false,      
        // timezone: 'Z',         // 필요시 UTC 고정
        logging: true,         // 연결/쿼리 로그 보고 싶을 때
      }),
    }),
    FacilitiesModule,
    QueueModule,
  ],
  controllers: [
    DbPingController,

  ]
})
export class AppModule {}
