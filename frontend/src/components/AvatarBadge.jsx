export default function AvatarBadge({ name = '', avatarUrl = '', size = 64, className = '' }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || '?'

  if (avatarUrl) {
    return <img className={`avatar-badge ${className}`.trim()} src={avatarUrl} alt={name || 'User avatar'} style={{ width: size, height: size }} />
  }

  return (
    <div className={`avatar-badge avatar-fallback ${className}`.trim()} style={{ width: size, height: size }} aria-label={name || 'User avatar'}>
      {initials}
    </div>
  )
}