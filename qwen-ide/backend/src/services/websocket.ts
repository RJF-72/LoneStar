import { WebSocketServer, WebSocket } from 'ws'
import { ModelService } from './modelService.js'
import { v4 as uuidv4 } from 'uuid'

interface WebSocketClient {
  id: string
  ws: WebSocket
  isAlive: boolean
}

interface WSMessage {
  type: string
  id?: string
  data?: any
}

export function setupWebSocket(wss: WebSocketServer): void {
  const clients = new Map<string, WebSocketClient>()
  const modelService = ModelService.getInstance()

  // Handle new connections
  wss.on('connection', (ws: WebSocket) => {
    const clientId = uuidv4()
    const client: WebSocketClient = {
      id: clientId,
      ws,
      isAlive: true
    }

    clients.set(clientId, client)
    console.log(`📱 WebSocket client connected: ${clientId}`)

    // Send initial status
    ws.send(JSON.stringify({
      type: 'model_status',
      data: modelService.getStatus()
    }))

    // Handle messages from client
    ws.on('message', async (message: Buffer) => {
      try {
        const parsedMessage: WSMessage = JSON.parse(message.toString())
        await handleMessage(client, parsedMessage, modelService, clients)
      } catch (error) {
        console.error('Error handling WebSocket message:', error)
        ws.send(JSON.stringify({
          type: 'error',
          data: {
            error: 'Invalid message format',
            message: error instanceof Error ? error.message : 'Unknown error'
          }
        }))
      }
    })

    // Handle pong response
    ws.on('pong', () => {
      client.isAlive = true
    })

    // Handle client disconnect
    ws.on('close', () => {
      console.log(`📱 WebSocket client disconnected: ${clientId}`)
      clients.delete(clientId)
    })

    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error)
      clients.delete(clientId)
    })
  })

  // Listen to model service events
  modelService.on('statusChange', (status) => {
    broadcast(clients, {
      type: 'model_status',
      data: status
    })
  })

  // Heartbeat to keep connections alive
  const heartbeat = setInterval(() => {
    clients.forEach((client, clientId) => {
      if (!client.isAlive) {
        console.log(`💀 Terminating inactive client: ${clientId}`)
        client.ws.terminate()
        clients.delete(clientId)
        return
      }

      client.isAlive = false
      client.ws.ping()
    })
  }, 30000) // 30 seconds

  wss.on('close', () => {
    clearInterval(heartbeat)
  })
}

async function handleMessage(
  client: WebSocketClient,
  message: WSMessage,
  modelService: ModelService,
  clients: Map<string, WebSocketClient>
): Promise<void> {
  const { type, id, data } = message

  try {
    switch (type) {
      case 'chat_message':
        await handleChatMessage(client, data, modelService, id)
        break

      case 'model_config_update':
        handleModelConfigUpdate(data, modelService, clients)
        break

      case 'model_reload':
        await handleModelReload(data, modelService, clients)
        break

      case 'ping':
        client.ws.send(JSON.stringify({ type: 'pong', id }))
        break

      default:
        client.ws.send(JSON.stringify({
          type: 'error',
          id,
          data: { error: `Unknown message type: ${type}` }
        }))
    }
  } catch (error) {
    client.ws.send(JSON.stringify({
      type: 'error',
      id,
      data: {
        error: 'Message handling failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }))
  }
}

async function handleChatMessage(
  client: WebSocketClient,
  data: any,
  modelService: ModelService,
  messageId?: string
): Promise<void> {
  const { prompt, config, stream = true } = data

  if (!prompt) {
    throw new Error('Prompt is required')
  }

  try {
    if (stream) {
      // Stream response
      await modelService.generateStreamResponse(
        prompt,
        config,
        (token: string) => {
          client.ws.send(JSON.stringify({
            type: 'chat_token',
            id: messageId,
            data: { token }
          }))
        }
      )

      // Send completion signal
      client.ws.send(JSON.stringify({
        type: 'chat_complete',
        id: messageId,
        data: { finished: true }
      }))
    } else {
      // Get full response
      const response = await modelService.generateResponse(prompt, config)
      client.ws.send(JSON.stringify({
        type: 'chat_response',
        id: messageId,
        data: { response }
      }))
    }
  } catch (error) {
    client.ws.send(JSON.stringify({
      type: 'chat_error',
      id: messageId,
      data: {
        error: 'Failed to generate response',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }))
  }
}

function handleModelConfigUpdate(
  data: any,
  modelService: ModelService,
  clients: Map<string, WebSocketClient>
): void {
  modelService.updateConfig(data)
  
  broadcast(clients, {
    type: 'model_config_updated',
    data: modelService.getConfig()
  })
}

async function handleModelReload(
  data: any,
  modelService: ModelService,
  clients: Map<string, WebSocketClient>
): Promise<void> {
  const { modelPath } = data

  try {
    await modelService.dispose()
    await modelService.initialize(modelPath)
  } catch (error) {
    broadcast(clients, {
      type: 'model_reload_error',
      data: {
        error: 'Failed to reload model',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
}

function broadcast(clients: Map<string, WebSocketClient>, message: any): void {
  const messageStr = JSON.stringify(message)
  
  clients.forEach((client, clientId) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(messageStr)
      } catch (error) {
        console.error(`Error sending to client ${clientId}:`, error)
        clients.delete(clientId)
      }
    }
  })
}