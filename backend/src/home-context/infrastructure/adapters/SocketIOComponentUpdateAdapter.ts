import { Server } from "socket.io";
import { Component, Home } from "../../domain";
import { ComponentUpdatePort } from "../../domain/ComponentUpdatePort";
import { ComponentStateSerializer } from "../ComponentStateSerializer";

export class SocketIOComponentUpdateAdapter implements ComponentUpdatePort {
  private serializer = new ComponentStateSerializer();

  constructor(private io: Server) {}

  sendComponentUpdate(home: Home, component: Component): void {
    const room = home.rooms.find((r) =>
      r.components.some((c) => c.id === component.id),
    );
    this.io.to(`home-${home.id}`).emit("component:updated", {
      ...component.accept(this.serializer),
      roomName: room?.name,
    });
  }
}
