import {
  WebSocketGateway, WebSocketServer, ConnectedSocket,
  OnGatewayConnection, OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EV, NS, roomCounter, roomLobby } from './events';

@WebSocketGateway({
  namespace: NS,
  cors: { origin: '*', methods: ['GET','POST'] },
})
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  handleConnection(@ConnectedSocket() client: Socket) {
    const hospitalId = String(client.handshake.query.hospitalId ?? '');
    const counterId  = client.handshake.query.counterId
      ? String(client.handshake.query.counterId)
      : null;

    if (!hospitalId) {
      client.emit('bd:error', { code: 'HOSPITAL_ID_REQUIRED' });
      return;
    }

    client.join(roomLobby(hospitalId));
    if (counterId) client.join(roomCounter(hospitalId, counterId));

    client.emit(EV.HELLO, { ns: NS, hospitalId, counterId });
    // 디버그
    console.log('[WS] connect', client.id, { hospitalId, counterId }, [...client.rooms]);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    console.log('[WS] disconnect', client.id);
  }

  // ---- Broadcast helpers ----
  emitTicketCreated(t: { hospitalId: string; counterId: string }, payload: any) {
    if (!this.server) return;
    this.server.to(roomLobby(t.hospitalId)).emit(EV.CREATED, payload);
    this.server.to(roomCounter(t.hospitalId, t.counterId)).emit(EV.CREATED, payload);
  }

  emitTicketCalled(t: { hospitalId: string; counterId: string }, payload: any) {
    if (!this.server) return;
    this.server.to(roomLobby(t.hospitalId)).emit(EV.CALLED, payload);
    this.server.to(roomCounter(t.hospitalId, t.counterId)).emit(EV.CALLED, payload);
  }

  emitSnapshot(hospitalId: string, snapshot: any) {
    this.server?.to(roomLobby(hospitalId)).emit(EV.SNAPSHOT, snapshot);
  }

  emitUpdated(hospitalId: string, payload: any) {
  this.server?.to(roomLobby(hospitalId)).emit('bd:ticket.updated', payload);
  if (payload?.counterId) {
    this.server?.to(roomCounter(hospitalId, payload.counterId)).emit('bd:ticket.updated', payload);
  }
}
}
