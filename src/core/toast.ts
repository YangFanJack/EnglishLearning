import { reactive } from 'vue'
import type { ToastMessage } from '@/types'

export const toasts = reactive<ToastMessage[]>([])
let sequence = 0

export function pushToast(text: string, type: ToastMessage['type'] = 'info', duration = 3200): void {
  const id = ++sequence
  toasts.push({ id, text, type })
  window.setTimeout(() => dismissToast(id), duration)
}

export function dismissToast(id: number): void {
  const index = toasts.findIndex((toast) => toast.id === id)
  if (index >= 0) toasts.splice(index, 1)
}
