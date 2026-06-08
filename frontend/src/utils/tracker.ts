const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

const MAX_QUEUE_SIZE = 5
const FLUSH_INTERVAL_MS = 3000
const STORAGE_KEY_ANON = 'bijing-anonymous-id'

interface TrackerEvent {
  id: string
  eventType: string
  payload?: Record<string, unknown>
  timestamp: string
  anonymousId: string
  userId?: string
}

let queue: TrackerEvent[] = []
let isFlushing = false

function getAnonymousId(): string {
  let id = localStorage.getItem(STORAGE_KEY_ANON)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY_ANON, id)
  }
  return id
}

function getAuthToken(): string | null {
  return localStorage.getItem('bijing-auth-token')
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function createEvent(eventType: string, payload?: Record<string, unknown>): TrackerEvent {
  const token = getAuthToken()
  // 从 JWT payload 中提取 userId（如果 token 存在）
  let userId: string | undefined
  if (token) {
    try {
      const payloadPart = token.split('.')[1]
      if (payloadPart) {
        const decoded = JSON.parse(atob(payloadPart))
        userId = decoded.sub || decoded.userId || decoded.id
      }
    } catch {
      // ignore decode errors
    }
  }

  return {
    id: generateId(),
    eventType,
    payload,
    timestamp: new Date().toISOString(),
    anonymousId: getAnonymousId(),
    userId,
  }
}

async function sendEvents(events: TrackerEvent[]): Promise<void> {
  if (events.length === 0) return

  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Anonymous-Id': getAnonymousId(),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    await fetch(`${API_BASE_URL}/api/events`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ events }),
    })
  } catch {
    // silently discard on failure
  }
}

async function flush(): Promise<void> {
  if (isFlushing || queue.length === 0) return
  isFlushing = true

  const batch = queue.slice()
  queue = []

  await sendEvents(batch)
  isFlushing = false
}

function scheduleFlush(): void {
  if (queue.length >= MAX_QUEUE_SIZE) {
    flush()
    return
  }
}

function handleUnload(): void {
  if (queue.length === 0) return

  const events = queue.slice()
  queue = []

  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Anonymous-Id': getAnonymousId(),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const body = JSON.stringify({ events })
  const url = `${API_BASE_URL}/api/events`

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' })
    const sent = navigator.sendBeacon(url, blob)
    if (!sent) {
      // fallback to fetch keepalive
      fetch(url, { method: 'POST', headers, body, keepalive: true }).catch(() => {})
    }
  } else {
    fetch(url, { method: 'POST', headers, body, keepalive: true }).catch(() => {})
  }
}

// 启动定时 flush
setInterval(() => {
  if (queue.length > 0) {
    flush()
  }
}, FLUSH_INTERVAL_MS)

// 页面关闭时发送剩余事件
window.addEventListener('beforeunload', handleUnload)
window.addEventListener('pagehide', handleUnload)

export function track(eventType: string, payload?: Record<string, unknown>): void {
  const event = createEvent(eventType, payload)
  queue.push(event)
  scheduleFlush()
}

export function flushNow(): Promise<void> {
  return flush()
}
