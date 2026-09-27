"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  REALTIME_CHANNELS,
  type RealtimeChannel,
  type RealtimeEvent,
} from "@/src/domain/realtime/protocol.mjs";
type State = "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "RECONNECTING";
type Context = {
  state: State;
  lastEventAt: string | null;
  subscribe(channels: RealtimeChannel[]): () => void;
};
const RealtimeContext = createContext<Context>({
  state: "DISCONNECTED",
  lastEventAt: null,
  subscribe: () => () => undefined,
});
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>("DISCONNECTED");
  const [lastEventAt, setLastEventAt] = useState<string | null>(null);
  const socket = useRef<WebSocket | null>(null);
  const desired = useRef(new Set<RealtimeChannel>());
  const reconnect = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attempt = useRef(0);
  useEffect(() => {
    let active = true;
    const connect = () => {
      if (!active) return;
      setState(attempt.current ? "RECONNECTING" : "CONNECTING");
      const protocol = location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${location.host}/api/realtime`);
      socket.current = ws;
      ws.onopen = () => {
        attempt.current = 0;
        setState("CONNECTED");
        if (desired.current.size)
          ws.send(JSON.stringify({ action: "subscribe", channels: [...desired.current] }));
      };
      ws.onmessage = (message) => {
        try {
          const event = JSON.parse(message.data) as RealtimeEvent;
          if (
            event.version !== 1 ||
            typeof event.channel !== "string" ||
            typeof event.timestamp !== "string"
          )
            return;
          setLastEventAt(event.timestamp);
          window.dispatchEvent(new CustomEvent(`realtime:${event.channel}`, { detail: event }));
        } catch {
          /* Invalid server events are ignored. */
        }
      };
      ws.onclose = () => {
        if (!active) return;
        setState("RECONNECTING");
        attempt.current += 1;
        reconnect.current = setTimeout(
          connect,
          Math.min(30_000, 1000 * 2 ** Math.min(attempt.current, 5)),
        );
      };
      ws.onerror = () => ws.close();
    };
    connect();
    return () => {
      active = false;
      if (reconnect.current) clearTimeout(reconnect.current);
      socket.current?.close();
    };
  }, []);
  const subscribe = useCallback((channels: RealtimeChannel[]) => {
    channels.forEach((channel) => desired.current.add(channel));
    if (socket.current?.readyState === WebSocket.OPEN)
      socket.current.send(JSON.stringify({ action: "subscribe", channels }));
    return () => {
      channels.forEach((channel) => desired.current.delete(channel));
      if (socket.current?.readyState === WebSocket.OPEN)
        socket.current.send(JSON.stringify({ action: "unsubscribe", channels }));
    };
  }, []);
  const value = useMemo(() => ({ state, lastEventAt, subscribe }), [state, lastEventAt, subscribe]);
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}
export function useRealtime() {
  return useContext(RealtimeContext);
}
export function RealtimeBridge() {
  const { state, lastEventAt, subscribe } = useRealtime();
  useEffect(() => subscribe([...REALTIME_CHANNELS]), [subscribe]);
  return (
    <div
      className="border-b border-slate-800 bg-[#07111e] px-4 py-1.5 text-center text-[10px] uppercase tracking-[.12em] text-slate-500"
      role="status"
    >
      Realtime {state.toLowerCase()} ·{" "}
      {lastEventAt
        ? `last event ${new Date(lastEventAt).toLocaleTimeString("en-IN")}`
        : "no provider event"}
    </div>
  );
}
