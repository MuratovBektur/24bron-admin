export interface WsClientOptions {
  url: () => string
  pingIntervalMs?: number
  reconnectDelayMs?: number
  onOpen?: () => void
  onMessage: (data: string) => void
}

export interface WsClient {
  connect: () => void
  disconnect: () => void
  send: (data: object) => void
}

export function useWsClient({
  url,
  pingIntervalMs = 3000,
  reconnectDelayMs = 5000,
  onOpen,
  onMessage,
}: WsClientOptions): WsClient {
  let ws: WebSocket | null = null
  let pingTimer: ReturnType<typeof setInterval> | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let destroyed = false

  function send(data: object): void {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data))
    }
  }

  function stopPing(): void {
    if (pingTimer !== null) {
      clearInterval(pingTimer)
      pingTimer = null
    }
  }

  function startPing(): void {
    stopPing()
    pingTimer = setInterval(() => send({ type: 'ping' }), pingIntervalMs)
  }

  function scheduleReconnect(): void {
    if (destroyed) return
    reconnectTimer = setTimeout(connect, reconnectDelayMs)
  }

  function connect(): void {
    if (ws || destroyed) return

    ws = new WebSocket(url())

    ws.onopen = () => {
      startPing()
      onOpen?.()
    }

    ws.onmessage = ({ data }: MessageEvent<string>) => {
      onMessage(data)
    }

    ws.onclose = () => {
      stopPing()
      ws = null
      scheduleReconnect()
    }

    ws.onerror = () => {
      ws?.close()
    }
  }

  function disconnect(): void {
    destroyed = true
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    stopPing()
    if (ws) {
      ws.onopen = null
      ws.onmessage = null
      ws.onerror = null
      ws.onclose = null
      ws.close()
      ws = null
    }
  }

  return { connect, disconnect, send }
}
