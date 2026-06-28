import Swal from 'sweetalert2'
import { toast } from 'sonner'

export function showSuccess(message, description) {
  toast.success(message, {
    description,
    duration: 4000,
    style: {
      background: 'rgba(var(--panel-rgb), 0.95)',
      border: '1px solid rgba(var(--success-rgb), 0.35)',
      color: 'var(--text)',
      backdropFilter: 'blur(12px)',
    },
  })
}

export function showError(message, description) {
  toast.error(message, {
    description,
    duration: 5000,
    style: {
      background: 'rgba(var(--panel-rgb), 0.95)',
      border: '1px solid rgba(var(--danger-rgb), 0.35)',
      color: 'var(--text)',
      backdropFilter: 'blur(12px)',
    },
  })
}

export function showInfo(message, description) {
  toast.info(message, {
    description,
    duration: 3500,
    style: {
      background: 'rgba(var(--panel-rgb), 0.95)',
      border: '1px solid rgba(var(--accent-rgb), 0.35)',
      color: 'var(--text)',
      backdropFilter: 'blur(12px)',
    },
  })
}

export function extractError(error) {
  const detail = error?.response?.data?.detail
  if (!detail) return error?.message || 'Something went wrong'
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((e) => e.msg?.replace('Value error, ', '') || JSON.stringify(e)).join(', ')
  }
  return JSON.stringify(detail)
}

export function showSignedOut(name) {
  toast('Signed out', {
    description: `Goodbye, ${name}. See you next time.`,
    duration: 4000,
    style: {
      background: 'rgba(var(--panel-rgb), 0.95)',
      border: '1px solid rgba(148, 163, 184, 0.3)',
      color: 'var(--text)',
      backdropFilter: 'blur(12px)',
    },
  })
}

export async function confirmLogout() {
  const result = await Swal.fire({
    title: 'Sign out?',
    text: 'You will be returned to the login page.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, sign out',
    cancelButtonText: 'Stay',
    confirmButtonColor: 'var(--danger)',
    cancelButtonColor: 'var(--muted)',
    background: 'var(--panel)',
    color: 'var(--text)',
  })
  return result.isConfirmed
}

export async function confirmAction({ title, text, confirmButtonText = 'Confirm' }) {
  const result = await Swal.fire({
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: 'Cancel',
    confirmButtonColor: 'var(--accent)',
    cancelButtonColor: 'var(--muted)',
    background: 'var(--panel)',
    color: 'var(--text)',
  })
  return result.isConfirmed
}

export function showLoading(title = 'Processing...') {
  Swal.fire({
    title,
    text: 'Please wait',
    allowOutsideClick: false,
    showConfirmButton: false,
    background: 'var(--panel)',
    color: 'var(--text)',
    didOpen: () => {
      Swal.showLoading()
    }
  })
}

export function closeAlert() {
  Swal.close()
}
