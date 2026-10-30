function QuantityStepper({ value, onChange, min = 1, max = 10 }) {
  const buttonStyle =
    'flex h-9 w-9 items-center justify-center rounded border border-wine text-lg text-wine hover:bg-wine hover:text-paper disabled:pointer-events-none disabled:opacity-40'

  return (
    <div className="inline-flex items-center gap-3">
      <button
        type="button"
        aria-label="Decrease quantity"
        className={buttonStyle}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >
        -
      </button>
      <span className="min-w-6 text-center font-semibold">{value}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        className={buttonStyle}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >
        +
      </button>
    </div>
  )
}

export default QuantityStepper