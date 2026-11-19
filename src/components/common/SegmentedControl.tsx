export type SegmentedOption<T extends string> = readonly [value: T, label: string]

interface SegmentedControlProps<T extends string> {
  value: T
  options: ReadonlyArray<SegmentedOption<T>>
  onChange: (value: T) => void
  label: string
  className?: string
}

export default function SegmentedControl<T extends string>({ value, options, onChange, label, className = '' }: SegmentedControlProps<T>) {
  return (
    <div className={`segmented ${className}`.trim()} role="group" aria-label={label}>
      {options.map(([optionValue, optionLabel]) => (
        <button
          key={optionValue}
          type="button"
          className={optionValue === value ? 'active' : ''}
          aria-pressed={optionValue === value}
          onClick={() => onChange(optionValue)}
        >
          {optionLabel}
        </button>
      ))}
    </div>
  )
}
