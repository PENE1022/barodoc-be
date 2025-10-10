import { WebSocketGateway, WebSocketServer, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EV, NS, roomCounter, roomLobby } from './events';

@WebSocketGateway({ namespace: NS, cors: { origin: '*' }})
export class QueueGateway {
  @WebSocketServer() server!: Server;

  handleConnection(@ConnectedSocket() client: Socket) {
    // 쿼리로 병원/창구 룸 합류 (없으면 로비)
    const hospitalId = String(client.handshake.query.hospitalId ?? '');
    const counterId  = client.handshake.query.counterId ? String(client.handshake.query.counterId) : null;

    if (hospitalId) {
      client.join(roomLobby(hospitalId));
      client.emit('debug:hello', { ns: NS, hospitalId }); // 연결 확인
      if (counterId) client.join(roomCounter(hospitalId, counterId));
    }
  }

  emitTicketCreated(t: { hospitalId: string; counterId: string }, payload: any) {
    const s = this.server;
    if (!s) return;
    s.to(roomLobby(t.hospitalId)).emit(EV.CREATED, payload);
    s.to(roomCounter(t.hospitalId, t.counterId)).emit(EV.CREATED, payload);
  }

  emitTicketCalled(t: { hospitalId: string; counterId: string }, payload: any) {
    const s = this.server;
    if (!s) return;
    s.to(roomLobby(t.hospitalId)).emit(EV.CALLED, payload);
    s.to(roomCounter(t.hospitalId, t.counterId)).emit(EV.CALLED, payload);
  }

  
}
