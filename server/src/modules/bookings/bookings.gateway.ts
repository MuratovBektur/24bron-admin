import { Injectable, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { OnEvent } from '@nestjs/event-emitter';
import * as http from 'http';
import { WebSocket, Server as WsServer } from 'ws';
import {
  BOOKING_CHANGED_EVENT,
  BookingChangedEvent,
} from './booking-changed.event';

interface WsIncoming {
  type: 'join' | 'leave' | 'ping';
  pitchId?: string;
}

@Injectable()
export class BookingsGateway implements OnModuleInit {
  private wss!: WsServer;
  private readonly rooms = new Map<string, Set<WebSocket>>();

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  onModuleInit(): void {
    const httpServer: http.Server =
      this.httpAdapterHost.httpAdapter.getHttpServer();

    this.wss = new WsServer({ server: httpServer, path: '/ws' });

    this.wss.on('connection', (client: WebSocket) => {
      client.on('message', (raw: unknown) => {
        try {
          const msg = JSON.parse(String(raw)) as WsIncoming;

          if (msg.type === 'join' && msg.pitchId) {
            if (!this.rooms.has(msg.pitchId)) {
              this.rooms.set(msg.pitchId, new Set());
            }
            this.rooms.get(msg.pitchId)!.add(client);
          } else if (msg.type === 'leave' && msg.pitchId) {
            this.rooms.get(msg.pitchId)?.delete(client);
          } else if (msg.type === 'ping') {
            client.send(JSON.stringify({ type: 'pong' }));
          }
        } catch {
          // ignore malformed messages
        }
      });

      client.on('close', () => {
        for (const room of this.rooms.values()) {
          room.delete(client);
        }
      });
    });
  }

  @OnEvent(BOOKING_CHANGED_EVENT)
  handleBookingChangedEvent(event: BookingChangedEvent): void {
    this.notifyBookingChanged(event.pitchId, event.dates);
  }

  notifyBookingChanged(pitchId: string, dates: string[]): void {
    const room = this.rooms.get(pitchId);
    if (!room?.size) return;
    const msg = JSON.stringify({ type: 'booking:changed', pitchId, dates });
    for (const client of room) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    }
  }
}
