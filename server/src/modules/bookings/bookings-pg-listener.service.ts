import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Client } from 'pg';
import { BOOKING_CHANGED_EVENT, BookingChangedEvent } from './booking-changed.event';

@Injectable()
export class BookingsPgListener implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BookingsPgListener.name);
  private client!: Client;
  private destroyed = false;

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    this.destroyed = true;
    await this.client?.end().catch(() => undefined);
  }

  private createClient(): Client {
    return new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
  }

  private async connect(): Promise<void> {
    this.client = this.createClient();

    this.client.on('error', (err) => {
      this.logger.error(`PG listener error: ${err.message}`);
      if (!this.destroyed) {
        setTimeout(() => void this.connect(), 5_000);
      }
    });

    this.client.on('end', () => {
      if (!this.destroyed) {
        this.logger.warn('PG listener disconnected, reconnecting...');
        setTimeout(() => void this.connect(), 5_000);
      }
    });

    try {
      await this.client.connect();
      await this.client.query('LISTEN booking_changed');
      this.logger.log('Listening on booking_changed');

      this.client.on('notification', (msg) => {
        if (!msg.payload) return;
        try {
          const data = JSON.parse(msg.payload) as {
            pitchId: string;
            dates: string[];
          };
          this.eventEmitter.emit(
            BOOKING_CHANGED_EVENT,
            new BookingChangedEvent(data.pitchId, data.dates),
          );
        } catch {
          // ignore malformed payload
        }
      });
    } catch (err) {
      this.logger.error(`PG listener connect failed: ${(err as Error).message}`);
      if (!this.destroyed) {
        setTimeout(() => void this.connect(), 5_000);
      }
    }
  }
}
