export interface TabItem<T extends string> {
  id: T
  label: string
  /** 相同 group 相邻显示，不同 group 之间插入分隔线 */
  group?: string
}

interface TabsProps<T extends string> {
  items: ReadonlyArray<TabItem<T>>
  value: T
  onChange: (value: T) => void
  label: string
  className?: string
}

export default function Tabs<T extends string>({ items, value, onChange, label, className = '' }: TabsProps<T>) {
  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const index = items.findIndex((item) => item.id === value)
    if (index < 0) return
    const last = items.length - 1
    const target =
      event.key === 'ArrowRight'
        ? (index + 1) % items.length
        : event.key === 'ArrowLeft'
          ? (index - 1 + items.length) % items.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : -1
    if (target < 0) return
    event.preventDefault()
    onChange(items[target].id)
    event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')[target]?.focus()
  }

  return (
    <div className={`crypto-algorithm-tabs ${className}`.trim()} role="tablist" aria-label={label} onKeyDown={handleKeyDown}>
      {items.map((item, index) => {
        const groupStart = index > 0 && item.group !== undefined && item.group !== items[index - 1].group
        const active = item.id === value
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            className={[active ? 'active' : '', groupStart ? 'group-start' : ''].filter(Boolean).join(' ')}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
