import Swal from 'sweetalert2'
import { toast } from 'sonner'

export function showSuccess(message, description) {
  toast.success(message, {
    description,
    duration: 4000,
    style: {
      background: 'rgba(2, 6, 23, 0.95)',
      border: '1px solid rgba(34, 197, 94, 0.35)',
      color: '#e2e8f0',
      backdropFilter: 'blur(12px)',
    },
  })
}

export function showError(message, description) {
  toast.error(message, {
    description,
    duration: 5000,
    style: {
      background: 'rgba(2, 6, 23, 0.95)',
      border: '1px solid rgba(239, 68, 68, 0.35)',
      color: '#e2e8f0',
      backdropFilter: 'blur(12px)',
    },
  })
}

export function showInfo(message, description) {
  toast.info(message, {
    description,
    duration: 3500,
    style: {
      background: 'rgba(2, 6, 23, 0.95)',
      border: '1px solid rgba(56, 189, 248, 0.35)',
      color: '#e2e8f0',
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
      background: 'rgba(2, 6, 23, 0.95)',
      border: '1px solid rgba(148, 163, 184, 0.3)',
      color: '#e2e8f0',
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
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    background: '#0f172a',
    color: '#e2e8f0',
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
    confirmButtonColor: '#0ea5e9',
    cancelButtonColor: '#64748b',
    background: '#0f172a',
    color: '#e2e8f0',
  })
  return result.isConfirmed
}

export function showLoading(title = 'Processing...') {
  Swal.fire({
    title,
    text: 'Please wait',
    allowOutsideClick: false,
    showConfirmButton: false,
    background: '#0f172a',
    color: '#e2e8f0',
    didOpen: () => {
      Swal.showLoading()
    }
  })
}

export function closeAlert() {
  Swal.close()
}
