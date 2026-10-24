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
  thisMonth: {count: number; revenue: number}
  thisYear: {count: number; revenue: number}
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

function Stat({label, value, detail}: {label: string; value: string; detail?: string}) {
  return (
    <Card border padding={4} radius={2}>
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

  useEffect(() => {
    const {year, month} = getStockholmDateParts()

    client
      .fetch<OrderStatistics>(ORDER_STATISTICS_QUERY, {
        monthStart: getStockholmMidnightIso(year, month),
        yearStart: getStockholmMidnightIso(year, 1),
      })
      .then(setStatistics)
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
            detail={`${statistics.allTime.count} completed orders`}
          />
          <Stat
            label="Total orders"
            value={String(statistics.allTime.count)}
            detail="completed orders"
          />
          <Stat
            label="This month"
            value={formatCurrency(statistics.thisMonth.revenue)}
            detail={`${statistics.thisMonth.count} completed orders`}
          />
          <Stat
            label="This year"
            value={formatCurrency(statistics.thisYear.revenue)}
            detail={`${statistics.thisYear.count} completed orders`}
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
