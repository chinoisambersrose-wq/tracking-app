import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL ?? 'http://localhost:5173', credentials: true },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(private jwtService: JwtService) {}

  handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      const publicCode = client.handshake.auth?.publicCode as string | undefined;

      if (publicCode) {
        // Accès public : uniquement la room de suivi de cet item précis.
        client.join(`track:${publicCode}`);
        return;
      }

      if (!token) throw new Error('no token');
      const payload = this.jwtService.verify(token, { secret: process.env.JWT_ACCESS_SECRET });
      if (payload.organizationId) {
        client.join(`org:${payload.organizationId}`);
      }
      if (payload.sub) {
        client.join(`user:${payload.sub}`);
      }
    } catch {
      this.logger.warn(`Connexion socket rejetée (${client.id})`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Socket déconnecté: ${client.id}`);
  }

  emitPositionUpdate(organizationId: string, publicCode: string, position: unknown) {
    this.server.to(`org:${organizationId}`).emit('position:update', position);
    this.server.to(`track:${publicCode}`).emit('position:update', position);
  }

  emitStatusUpdate(organizationId: string, publicCode: string, statusEvent: unknown) {
    this.server.to(`org:${organizationId}`).emit('status:update', statusEvent);
    this.server.to(`track:${publicCode}`).emit('status:update', statusEvent);
  }
}
