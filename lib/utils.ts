const currencyFormatter = new Intl.NumberFormat('sv-SE', {
  style: 'currency',
  currency: 'SEK',
  maximumFractionDigits: 0,
})

export function formatVariants(variants?: {price: number}[]) {
  if (!variants || variants.length === 0) {
    return formatPrice([0])
  }

  const prices = variants.map((v) => v.price || 0)
  return formatPrice(prices)
}

export function formatPrice(prices: number[]) {
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)

  // The currency formatter likes the &nbsp; character. I don't.
  const formattedPrice = currencyFormatter.format(minPrice).replace(/\u00A0/g, ' ')

  if (minPrice === maxPrice) {
    return formattedPrice
  }

  return 'Från ' + formattedPrice
}
