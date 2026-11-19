import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import type { SegmentedOption } from './SegmentedControl'

interface SelectProps<T extends string> {
  value: T
  options: ReadonlyArray<SegmentedOption<T>>
  onChange: (value: T) => void
  label: string
  className?: string
}

/** 自定义下拉框：原生 select 的弹层无法跟随主题，这里用 listbox 实现统一外观 */
export default function Select<T extends string>({ value, options, onChange, label, className = '' }: SelectProps<T>) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(() =>
    Math.max(
      0,
      options.findIndex(([optionValue]) => optionValue === value),
    ),
  )
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const current = options.find(([optionValue]) => optionValue === value)
  const selectedIndex = options.findIndex(([optionValue]) => optionValue === value)

  useEffect(() => {
    if (!open) return
    setActive(selectedIndex < 0 ? 0 : selectedIndex)
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [open, selectedIndex])

  useEffect(() => {
    if (!open) return
    menuRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  function commit(index: number) {
    const next = options[index]
    if (!next) return
    onChange(next[0])
    setOpen(false)
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault()
        if (!open) {
          setOpen(true)
          return
        }
        const step = event.key === 'ArrowDown' ? 1 : -1
        setActive((index) => (index + step + options.length) % options.length)
        return
      }
      case 'Home':
      case 'End': {
        if (!open) return
        event.preventDefault()
        setActive(event.key === 'Home' ? 0 : options.length - 1)
        return
      }
      case 'Enter':
      case ' ': {
        event.preventDefault()
        if (open) commit(active)
        else setOpen(true)
        return
      }
      case 'Escape': {
        if (!open) return
        event.preventDefault()
        setOpen(false)
        return
      }
      case 'Tab': {
        setOpen(false)
        return
      }
      default:
        return
    }
  }

  return (
    <div className={`select ${className}`.trim()} ref={rootRef}>
      <button
        type="button"
        className={`select-trigger ${open ? 'open' : ''}`.trim()}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${listId}-list` : undefined}
        aria-activedescendant={open ? `${listId}-opt-${active}` : undefined}
        aria-label={label}
        onClick={() => setOpen((next) => !next)}
        onKeyDown={onKeyDown}
      >
        <span>{current?.[1] ?? '—'}</span>
        <ChevronDown size={15} className={open ? 'rotate-180' : ''} aria-hidden />
      </button>
      {open && (
        <div className="select-menu" id={`${listId}-list`} role="listbox" aria-label={label} ref={menuRef}>
          {options.map(([optionValue, optionLabel], index) => {
            const isSelected = optionValue === value
            return (
              <button
                key={optionValue}
                id={`${listId}-opt-${index}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                data-active={index === active}
                className={`select-option ${isSelected ? 'selected' : ''}`.trim()}
                onPointerEnter={() => setActive(index)}
                onClick={() => commit(index)}
              >
                <span>{optionLabel}</span>
                {isSelected && <Check size={14} aria-hidden />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
