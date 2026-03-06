import {test, expect, describe} from 'vitest'
import {formatPrice, formatVariants} from './utils'

describe('formatPrice', () => {
  test('formats single price', () => {
    expect(formatPrice([1])).toBe('1 kr')
  })

  test('formats price range', () => {
    expect(formatPrice([379, 580])).toBe('Från 379 kr')
  })

  test('formats unordered price range', () => {
    expect(formatPrice([2000, 1200, 104580])).toBe('Från 1 200 kr')
  })
})

describe('formatVariants', () => {
  test('formats variants', () => {
    expect(formatVariants([{price: 100}, {price: 200}])).toBe('Från 100 kr')
  })

  test('formats empty variants', () => {
    expect(formatVariants([])).toBe('0 kr')
    expect(formatVariants()).toBe('0 kr')
  })

  test('formats single variant', () => {
    expect(formatVariants([{price: 100}])).toBe('100 kr')
  })
})
