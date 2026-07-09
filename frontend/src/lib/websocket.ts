import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuthStore } from '@/stores/auth.store'

interface StompClientWrapper {
  client: Client | null
  connect: (onConnectCallback?: () => void) => void
  subscribe: (destination: string, callback: (message: any) => void) => () => void
  send: (destination: string, body: any) => void
  disconnect: () => void
}

let stompClient: Client | null = null

export const wsService: StompClientWrapper = {
  client: null,

  connect(onConnectCallback) {
    if (stompClient?.connected) {
      onConnectCallback?.()
      return
    }

    const { accessToken } = useAuthStore.getState()
    if (!accessToken) return

    // SockJS connection to backend /ws endpoint
    // Fallback to absolute URL if needed or relative
    const socket = new SockJS('http://localhost:8080/ws')

    stompClient = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      debug: (msg) => {
        if (import.meta.env.DEV) {
          console.debug('[WS]', msg)
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('[WS] Connected successfully')
        wsService.client = stompClient
        onConnectCallback?.()
      },
      onStompError: (frame) => {
        console.error('[WS] Broker error: ' + frame.headers['message'])
        console.error('[WS] Additional details: ' + frame.body)
      },
      onDisconnect: () => {
        console.log('[WS] Disconnected')
        wsService.client = null
      },
    })

    stompClient.activate()
  },

  subscribe(destination, callback) {
    if (!stompClient || !stompClient.connected) {
      console.warn('[WS] Cannot subscribe, STOMP client is not connected')
      // Try to connect and delay subscription
      this.connect(() => {
        this.subscribe(destination, callback)
      })
      return () => {}
    }

    const subscription = stompClient.subscribe(destination, (message) => {
      try {
        const payload = JSON.parse(message.body)
        callback(payload)
      } catch (e) {
        callback(message.body)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  },

  send(destination, body) {
    if (!stompClient || !stompClient.connected) {
      console.warn('[WS] Cannot send message, STOMP client is not connected')
      return
    }

    stompClient.publish({
      destination,
      body: JSON.stringify(body),
    })
  },

  disconnect() {
    if (stompClient) {
      stompClient.deactivate()
      stompClient = null
      wsService.client = null
    }
  },
}
export default wsService
