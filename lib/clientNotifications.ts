export const NOTIFICATIONS_CHANGED_EVENT = "notifications:changed"
export const NOTIFICATION_POLL_INTERVAL_MS = 5_000

const NOTIFICATIONS_CHANNEL = "animeblog-notifications"

function createChannel() {
  if (typeof BroadcastChannel === "undefined") return null
  return new BroadcastChannel(NOTIFICATIONS_CHANNEL)
}

export function announceNotificationsChanged() {
  if (typeof window === "undefined") return

  requestNotificationRefresh()
  const channel = createChannel()
  channel?.postMessage(NOTIFICATIONS_CHANGED_EVENT)
  channel?.close()
}

export function requestNotificationRefresh() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT))
}

export function subscribeToNotificationChanges(listener: () => void) {
  if (typeof window === "undefined") return () => undefined

  const channel = createChannel()
  const handleMessage = () => listener()

  window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, listener)
  channel?.addEventListener("message", handleMessage)

  return () => {
    window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, listener)
    channel?.removeEventListener("message", handleMessage)
    channel?.close()
  }
}
