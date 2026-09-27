import {
  createRealtimeEvent,
  validateSubscriptionMessage,
  type RealtimeChannel,
  type RealtimeEvent,
} from "../../domain/realtime/protocol.mjs";
export type RealtimePeer = {
  id: string;
  userId: string;
  send(data: string): void;
  close(code: number, reason: string): void;
  ping?(): void;
  isAlive: boolean;
};
export class RealtimeHub {
  private peers = new Map<string, RealtimePeer>();
  private subscriptions = new Map<RealtimeChannel, Set<string>>();
  connect(peer: RealtimePeer) {
    this.peers.set(peer.id, peer);
    peer.isAlive = true;
    peer.send(
      JSON.stringify(
        createRealtimeEvent(
          "session",
          "connection.ready",
          { connectionId: peer.id },
          { source: "PLATFORM", freshness: "LIVE" },
        ),
      ),
    );
  }
  disconnect(peerId: string) {
    this.peers.delete(peerId);
    for (const members of this.subscriptions.values()) members.delete(peerId);
  }
  message(peerId: string, raw: string) {
    const peer = this.peers.get(peerId);
    if (!peer) return false;
    let decoded: unknown;
    try {
      decoded = JSON.parse(raw);
    } catch {
      peer.send(JSON.stringify({ version: 1, type: "error", error: "Invalid JSON" }));
      return false;
    }
    const parsed = validateSubscriptionMessage(decoded);
    if (!parsed.success) {
      peer.send(JSON.stringify({ version: 1, type: "error", error: parsed.error }));
      return false;
    }
    if (parsed.data.action === "pong") {
      peer.isAlive = true;
      return true;
    }
    for (const channel of parsed.data.channels) {
      const members = this.subscriptions.get(channel) ?? new Set<string>();
      if (parsed.data.action === "subscribe") members.add(peerId);
      else members.delete(peerId);
      this.subscriptions.set(channel, members);
    }
    peer.send(
      JSON.stringify(
        createRealtimeEvent(
          "session",
          "subscription.updated",
          { action: parsed.data.action, channels: parsed.data.channels },
          { source: "PLATFORM", freshness: "LIVE" },
        ),
      ),
    );
    return true;
  }
  publish(event: RealtimeEvent) {
    for (const id of this.subscriptions.get(event.channel) ?? []) {
      const peer = this.peers.get(id);
      if (peer) peer.send(JSON.stringify(event));
    }
  }
  heartbeat() {
    for (const peer of this.peers.values()) {
      if (!peer.isAlive) {
        peer.close(4001, "Heartbeat timeout");
        this.disconnect(peer.id);
        continue;
      }
      peer.isAlive = false;
      peer.ping?.();
    }
  }
  providerDisconnected(reason = "Provider disconnected") {
    const event = createRealtimeEvent(
      "market",
      "provider.disconnected",
      { reason },
      { source: "NOT_CONFIGURED", freshness: "UNAVAILABLE" },
    );
    for (const peer of this.peers.values()) peer.send(JSON.stringify(event));
  }
  get connectionCount() {
    return this.peers.size;
  }
  subscriberCount(channel: RealtimeChannel) {
    return this.subscriptions.get(channel)?.size ?? 0;
  }
}
export const realtimeHub = new RealtimeHub();
