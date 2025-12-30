import { useState, useEffect, useCallback, useRef } from 'react'

export interface TelemetryData {
    pitch: number
    roll: number
    yaw: number
    temperature?: number | null
    timestamp: number
}

export interface Alert {
    id: string
    severity: 'info' | 'warning' | 'danger'
    message: string
    angle?: number | null
    type?: string
    timestamp: number
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

interface UseWebSocketReturn {
    telemetry: TelemetryData | null
    alerts: Alert[]
    connectionStatus: ConnectionStatus
    clearAlerts: () => void
    sendMessage: (message: object) => void
}

/**
 * Hook personnalisé pour la connexion WebSocket
 * Gère la connexion, reconnexion automatique, et parsing des messages
 */
export function useWebSocket(url: string): UseWebSocketReturn {
    const [telemetry, setTelemetry] = useState<TelemetryData | null>(null)
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')

    const wsRef = useRef<WebSocket | null>(null)
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const reconnectAttempts = useRef(0)
    const maxReconnectAttempts = 10
    const reconnectDelay = 3000

    const clearAlerts = useCallback(() => {
        setAlerts([])
    }, [])

    const sendMessage = useCallback((message: object) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message))
        }
    }, [])

    const connect = useCallback(() => {
        // Cleanup previous connection
        if (wsRef.current) {
            wsRef.current.close()
        }

        setConnectionStatus('connecting')
        console.log(`🔌 Tentative de connexion à ${url}...`)

        try {
            const ws = new WebSocket(url)
            wsRef.current = ws

            ws.onopen = () => {
                console.log('✅ WebSocket connecté')
                setConnectionStatus('connected')
                reconnectAttempts.current = 0
            }

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data)

                    switch (message.type) {
                        case 'telemetry':
                            setTelemetry({
                                ...message.data,
                                timestamp: message.timestamp || Date.now()
                            })
                            break

                        case 'alert':
                            const newAlert: Alert = {
                                id: message.data.id || Date.now().toString(36),
                                severity: message.data.severity || 'warning',
                                message: message.data.message,
                                angle: message.data.angle,
                                type: message.data.type,
                                timestamp: message.timestamp || Date.now()
                            }
                            setAlerts(prev => [newAlert, ...prev].slice(0, 50)) // Max 50 alertes
                            break

                        case 'connection':
                            console.log('📡 Message de connexion:', message.message)
                            break

                        case 'pong':
                            // Réponse au ping
                            break

                        default:
                            console.log('📨 Message inconnu:', message)
                    }
                } catch (error) {
                    console.error('❌ Erreur parsing message:', error)
                }
            }

            ws.onerror = (error) => {
                console.error('❌ Erreur WebSocket:', error)
            }

            ws.onclose = (event) => {
                console.log(`🔌 WebSocket fermé (code: ${event.code})`)
                setConnectionStatus('disconnected')
                wsRef.current = null

                // Reconnexion automatique
                if (reconnectAttempts.current < maxReconnectAttempts) {
                    reconnectAttempts.current++
                    console.log(`🔄 Reconnexion dans ${reconnectDelay / 1000}s (tentative ${reconnectAttempts.current}/${maxReconnectAttempts})`)

                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect()
                    }, reconnectDelay)
                } else {
                    console.log('❌ Nombre maximum de tentatives de reconnexion atteint')
                }
            }
        } catch (error) {
            console.error('❌ Erreur création WebSocket:', error)
            setConnectionStatus('disconnected')
        }
    }, [url])

    // Connexion initiale
    useEffect(() => {
        connect()

        // Ping périodique pour maintenir la connexion
        const pingInterval = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'ping' }))
            }
        }, 30000)

        // Cleanup
        return () => {
            clearInterval(pingInterval)
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
            }
            if (wsRef.current) {
                wsRef.current.close()
            }
        }
    }, [connect])

    return {
        telemetry,
        alerts,
        connectionStatus,
        clearAlerts,
        sendMessage
    }
}
