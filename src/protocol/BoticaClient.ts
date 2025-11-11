import {
  Packet,
  PacketMap,
  PacketType,
  RequestPacket,
  ResponsePacket,
} from "@/protocol/index.js";

export interface BoticaClient {
  connect(): Promise<void>;

  isConnected(): boolean;

  registerOrderListener(order: string, callback: OrderListener): void;

  publishOrder(key: string, order: string, message: string): Promise<void>;

  registerPacketListener<P extends Packet>(
    packetType: P["type"],
    callback: PacketListener<P>,
  ): void;

  registerQueryListener<
    T extends PacketType,
    RequestPacketT extends PacketMap[T] & RequestPacket<ResponsePacket>,
    ResponsePacketT extends ResponsePacket,
  >(
    packetType: T,
    callback: QueryListener<RequestPacketT, ResponsePacketT>,
  ): void;

  sendPacket(packet: Packet): Promise<void>;

  sendQuery<ResponsePacketT extends ResponsePacket>(
    packet: RequestPacket<ResponsePacketT>,
    callback: PacketListener<ResponsePacketT>,
    timeoutCallback: () => void,
  ): Promise<void>;

  sendQuery<ResponsePacketT extends ResponsePacket>(
    packet: RequestPacket<ResponsePacketT>,
    callback: PacketListener<ResponsePacketT>,
    timeoutCallback: () => void,
    timeoutMs: number,
  ): Promise<void>;

  close(): Promise<void>;
}

export type OrderListener = (message: string, order: string) => void;

export type PacketListener<P extends Packet> = (packet: P) => void;

export type QueryListener<
  RequestPacketT extends RequestPacket<ResponsePacketT>,
  ResponsePacketT extends ResponsePacket,
> = (request: RequestPacketT) => Promise<ResponsePacketT>;
