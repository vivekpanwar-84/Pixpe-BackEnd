import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: '/notifications',
    transports: ['polling', 'websocket'],
})
export class NotificationsGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private logger: Logger = new Logger('NotificationsGateway');

    afterInit(server: Server) {
        this.logger.log('Notifications Gateway Initialized');
    }

    handleConnection(client: Socket, ...args: any[]) {
        const userId = client.handshake.query.userId;
        if (userId) {
            const userIdStr = Array.isArray(userId) ? userId[0] : userId;
            const room = `user_${userIdStr}`;
            client.join(room);
            this.logger.log(`Client connected: ${client.id}, joined room: ${room}`);

            // Emit a test event to confirm connection
            client.emit('connection_success', { userId: userIdStr, room });
        } else {
            this.logger.warn(`Client connected without userId: ${client.id}`);
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    sendNotificationToUser(userId: string, data: any) {
        const room = `user_${userId}`;
        this.logger.log(`[NotificationsGateway] Emitting notification to room: ${room}`);
        this.server.to(room).emit('notification', data);
        this.logger.log(`[NotificationsGateway] Emission complete for room: ${room}`);
    }
}
