export function formatPrice(cents) {
  return `R${(cents / 100).toFixed(2)}`
}