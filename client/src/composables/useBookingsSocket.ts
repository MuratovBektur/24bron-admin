import { useWsClient } from './useWsClient'

interface WsServerMessage {
  type: 'booking:changed' | 'pong'
  dates?: string[]
}

export interface BookingsSocketOptions {
  pitchId: string
  onBookingChanged: (dates: string[]) => void
}

function getWsUrl(): string {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${location.host}/ws`
}

export function useBookingsSocket({ pitchId, onBookingChanged }: BookingsSocketOptions) {
  const { connect, disconnect, send } = useWsClient({
    url: getWsUrl,
    onOpen: () => send({ type: 'join', pitchId }),
    onMessage: (data: string) => {
      try {
        const msg = JSON.parse(data) as WsServerMessage
        if (msg.type === 'booking:changed' && msg.dates?.length) {
          onBookingChanged(msg.dates)
        }
      } catch {
        // ignore malformed messages
      }
    },
  })

  return {
    connect,
    disconnect() {
      send({ type: 'leave', pitchId })
      disconnect()
    },
  }
}
