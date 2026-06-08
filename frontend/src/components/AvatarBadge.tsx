interface AvatarBadgeProps {
  nickname: string
  color: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-16 h-16 text-xl',
}

export default function AvatarBadge({ nickname, color, size = 'md' }: AvatarBadgeProps) {
  const displayText = nickname.slice(0, 2)
  const sizeClass = sizeMap[size]

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-bold shrink-0 text-white`}
      style={{ backgroundColor: color }}
    >
      {displayText}
    </div>
  )
}
