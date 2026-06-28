import { spacing, fontSize } from '../utils/responsive'

export default function Footer() {
  return (
    <footer style={{ 
      padding: spacing.xxl, 
      textAlign: 'center', 
      color: 'var(--muted)', 
      fontSize: fontSize.sm, 
      borderTop: '1px solid var(--panel-border)', 
      background: 'var(--bg-soft)',
      marginTop: 'auto'
    }}>
      &copy; 2026 InterChain. All rights reserved.
    </footer>
  )
}
