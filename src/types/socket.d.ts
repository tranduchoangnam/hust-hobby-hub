import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { Socket } from 'socket.io';

// Extend the Socket type to include userId
declare module 'socket.io' {
  interface Socket<
    ListenEvents = DefaultEventsMap,
    EmitEvents = DefaultEventsMap,
    ServerSideEvents = DefaultEventsMap,
    SocketData = any
  > {
    userId: string;
  }
}