import Swal from 'sweetalert2'
import { toast } from 'sonner'

export function showSuccess(message) {
  toast.success(message)
}

export function showError(message) {
  toast.error(message)
}

export function showInfo(message) {
  toast.message(message)
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
