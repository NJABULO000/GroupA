import { useState } from 'react'

export function useCart() {
  const [lines, setLines] = useState([])

  // Adding the same dish with the same extras increases its quantity
  function addLine(newLine) {
    setLines((current) => {
      const existing = current.find((l) => l.key === newLine.key)
      if (existing) {
        return current.map((l) =>
          l.key === newLine.key
            ? { ...l, quantity: Math.min(20, l.quantity + newLine.quantity) }
            : l,
        )
      }
      return [...current, newLine]
    })
  }

  function setQuantity(key, quantity) {
    setLines((current) => current.map((l) => (l.key === key ? { ...l, quantity } : l)))
  }

  function removeLine(key) {
    setLines((current) => current.filter((l) => l.key !== key))
  }

  function clearCart() {
    setLines([])
  }

  // Calculated from the lines, never stored separately
  const count = lines.reduce((sum, l) => sum + l.quantity, 0)
  const totalCents = lines.reduce((sum, l) => sum + l.unitCents * l.quantity, 0)

  return { lines, addLine, setQuantity, removeLine, clearCart, count, totalCents }
}