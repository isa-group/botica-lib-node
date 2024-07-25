import Packet from "../protocol/Packet.js";

export default interface BoticaClient {
  connect(): Promise<void>;

  isConnected(): boolean;

  registerOrderListener(order: string, callback: OrderListener): void;

  publishOrder(key: string, order: string, message: string): Promise<void>;

  registerPacketListener(packetType: string, callback: PacketListener): void;

  sendPacket(packet: Packet): Promise<void>;

  close(): Promise<void>;
}

export interface OrderListener {
  (order: string, message: string): void;
}

export interface PacketListener {
  <P extends Packet>(packet: P): void;
}
