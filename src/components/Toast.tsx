import type { Toast as ToastType } from '../types/domain'

export function Toast({ toast }: { toast?: ToastType }) {
  return <div className={`toast ${toast ? 'show' : ''}`}>{toast?.message}</div>
}
