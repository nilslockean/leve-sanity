import {useEffect, useState} from 'react'
import {DashboardWidgetContainer} from '@sanity/dashboard'
import {Card, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {useClient} from 'sanity'
import {formatPrice} from '../lib/utils'

const TIME_ZONE = 'Europe/Stockholm'
const API_VERSION = '2025-02-19'

// Orders have no status field in the current schema, so every order document is a completed order.
const ORDER_STATISTICS_QUERY = /* groq */ `
  {
    "allTime": {
      "count": count(*[_type == "order"]),
      "revenue": coalesce(math::sum(*[_type == "order"].totals.total), 0)
    },
    "firstOrderDate": *[_type == "order"] | order(_createdAt asc)[0]._createdAt,
    "customerEmails": *[_type == "order" && defined(customer.email)].customer.email,
    "thisMonth": {
      "count": count(*[_type == "order" && _createdAt >= $monthStart]),
      "revenue": coalesce(math::sum(*[_type == "order" && _createdAt >= $monthStart].totals.total), 0)
    },
    "thisYear": {
      "count": count(*[_type == "order" && _createdAt >= $yearStart]),
      "revenue": coalesce(math::sum(*[_type == "order" && _createdAt >= $yearStart].totals.total), 0)
    }
  }
`

type OrderStatistics = {
  allTime: {count: number; revenue: number}
  returningCustomers: number
  firstOrderDate: string | null
  thisMonth: {count: number; revenue: number}
  thisYear: {count: number; revenue: number}
}

type OrderStatisticsResponse = Omit<OrderStatistics, 'returningCustomers'> & {
  customerEmails: (string | null)[]
}

function getStockholmDateParts() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  return {
    year: Number(parts.find((part) => part.type === 'year')?.value),
    month: Number(parts.find((part) => part.type === 'month')?.value),
  }
}

function getStockholmMidnightIso(year: number, month: number) {
  const utcGuess = new Date(Date.UTC(year, month - 1, 1))
  const offset = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    timeZoneName: 'longOffset',
  })
    .formatToParts(utcGuess)
    .find((part) => part.type === 'timeZoneName')?.value

  const offsetMatch = offset?.match(/GMT([+-])(\d{2}):?(\d{2})/)
  const offsetMinutes = offsetMatch
    ? (Number(offsetMatch[2]) * 60 + Number(offsetMatch[3])) * (offsetMatch[1] === '+' ? 1 : -1)
    : 0

  return new Date(utcGuess.getTime() - offsetMinutes * 60 * 1000).toISOString()
}

function formatCurrency(value: number) {
  return formatPrice([value])
}

function countReturningCustomers(emails: (string | null)[]) {
  const orderCountByEmail = new Map<string, number>()

  emails.forEach((email) => {
    if (!email) return

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) return

    orderCountByEmail.set(normalizedEmail, (orderCountByEmail.get(normalizedEmail) ?? 0) + 1)
  })

  return [...orderCountByEmail.values()].filter((orderCount) => orderCount > 1).length
}

const currentMonth = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  timeZone: TIME_ZONE,
}).format(new Date())

const currentYear = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  timeZone: TIME_ZONE,
}).format(new Date())

function Stat({
  label,
  value,
  detail,
  wide = false,
}: {
  label: string
  value: string
  detail?: string
  wide?: boolean
}) {
  return (
    <Card border padding={4} radius={2} style={wide ? {gridColumn: 'span 2'} : undefined}>
      <Stack space={3}>
        <Text muted size={1} weight="semibold">
          {label}
        </Text>
        <Text size={3} weight="bold">
          {value}
        </Text>
        {detail && (
          <Text muted size={1}>
            {detail}
          </Text>
        )}
      </Stack>
    </Card>
  )
}

export function OrderStatisticsWidget() {
  const client = useClient({apiVersion: API_VERSION})
  const [statistics, setStatistics] = useState<OrderStatistics | null>(null)
  const [error, setError] = useState<string | null>(null)

  const firstOrderDetail = statistics?.firstOrderDate
    ? `since ${new Intl.DateTimeFormat('sv-SE', {dateStyle: 'medium', timeZone: TIME_ZONE}).format(
        new Date(statistics.firstOrderDate),
      )}`
    : 'No completed orders yet'

  useEffect(() => {
    const {year, month} = getStockholmDateParts()

    client
      .fetch<OrderStatisticsResponse>(ORDER_STATISTICS_QUERY, {
        monthStart: getStockholmMidnightIso(year, month),
        yearStart: getStockholmMidnightIso(year, 1),
      })
      .then((response) =>
        setStatistics({
          ...response,
          returningCustomers: countReturningCustomers(response.customerEmails),
        }),
      )
      .catch(() => setError('Could not load order statistics.'))
  }, [client])

  return (
    <DashboardWidgetContainer header="Order statistics">
      {error ? (
        <Text muted>{error}</Text>
      ) : statistics ? (
        <Flex
          gap={3}
          direction="column"
          style={{display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))'}}
        >
          <Stat
            label="All-time revenue"
            value={formatCurrency(statistics.allTime.revenue)}
            detail={
              statistics.firstOrderDate
                ? `${statistics.allTime.count} completed orders ${firstOrderDetail}`
                : firstOrderDetail
            }
            wide
          />
          <Stat
            label="This month"
            value={formatCurrency(statistics.thisMonth.revenue)}
            detail={`${statistics.thisMonth.count} completed orders so far in ${currentMonth}`}
          />
          <Stat
            label="This year"
            value={formatCurrency(statistics.thisYear.revenue)}
            detail={`${statistics.thisYear.count} completed orders so far in ${currentYear}`}
          />
          <Stat
            label="Returning customers"
            value={String(statistics.returningCustomers)}
            detail="customers with 2+ completed orders"
          />
        </Flex>
      ) : (
        <Flex align="center" justify="center" padding={5}>
          <Spinner muted />
        </Flex>
      )}
    </DashboardWidgetContainer>
  )
}
