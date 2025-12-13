import { redirect } from 'next/navigation'
import StatsDashboard from '@/components/admin/stats-dashboard'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type AttendanceRow = {
  campaign_id: string | null
  session_id: string | null
  user_id: string | null
  occurred_at: string | null
  ip_address: string | null
  device_type: string | null
  device_os: string | null
  device_os_version: string | null
}

export default async function AdminStatsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const { data: campaignsData } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })
  const campaigns = campaignsData ?? []

  let uniqueMap: Record<string, number> = {}
  let unique7Map: Record<string, number> = {}
  let events30Map: Record<string, number> = {}
  let peakHourRangeMap: Record<string, string> = {}
  let peakDayMap: Record<string, string> = {}
  let onlineMap: Record<string, number> = {}
  let onlineTotal = 0
  let uniqueIpMap: Record<string, number> = {}
  let uniqueIpTotal = 0
  let topIpsMap: Record<string, { ip: string; count: number }[]> = {}
  let deviceTotals: Record<string, number> = {}
  let devicePerCampaign: Record<string, Record<string, number>> = {}
  let osTotals: Record<string, number> = {}
  let osPerCampaign: Record<string, Record<string, number>> = {}
  let userTopMap: Record<string, { label: string; count: number }[]> = {}
  const activityByHour = Array.from({ length: 24 }, () => 0)
  const activityByDay = new Map<string, number>()
  let activityAvailable = false
  const now = new Date()
  const threshold7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const threshold30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const thresholdOnline = new Date(now.getTime() - 5 * 60 * 1000)
  const weekdayNames = [
    'یکشنبه',
    'دوشنبه',
    'سه‌شنبه',
    'چهارشنبه',
    'پنجشنبه',
    'جمعه',
    'شنبه',
  ]

  try {
    const { data: activityRows, error: activityError } = await supabase
      .from('campaign_activity_logs')
      .select(
        'campaign_id, session_id, user_id, occurred_at, ip_address, device_type, device_os, device_os_version',
      )

    const rows = (activityRows || []) as AttendanceRow[]

    if (!activityError && rows) {
      const uniqueSessions = new Map<string, Set<string>>()
      const uniqueSessions7 = new Map<string, Set<string>>()
      const events30 = new Map<string, number>()
      const hourBuckets = new Map<string, Map<number, number>>()
      const dayBuckets = new Map<string, Map<number, number>>()
      const onlineSessions = new Map<string, Set<string>>()
      const onlineGlobal = new Set<string>()
      const uniqueIps = new Map<string, Set<string>>()
      const uniqueIpsGlobal = new Set<string>()
      const ipCounts = new Map<string, Map<string, number>>()
      const deviceCounts = new Map<string, Map<string, number>>()
      const deviceCountsGlobal = new Map<string, number>()
      const osCounts = new Map<string, Map<string, number>>()
      const osCountsGlobal = new Map<string, number>()
      const userCounts = new Map<string, Map<string, number>>() // counts by session_id

      rows.forEach((row: AttendanceRow) => {
        if (!row.campaign_id || !row.session_id) return
        const occurredAt = row.occurred_at ? new Date(row.occurred_at) : null
        const ip = row.ip_address?.trim()
        const device = (row.device_type || 'unknown').toLowerCase()
        const os = (row.device_os || 'unknown').toLowerCase()
        const userLabel = row.session_id || 'unknown-session'

        if (!uniqueSessions.has(row.campaign_id)) {
          uniqueSessions.set(row.campaign_id, new Set())
        }
        uniqueSessions.get(row.campaign_id)!.add(row.session_id)

        if (occurredAt && occurredAt >= threshold7) {
          if (!uniqueSessions7.has(row.campaign_id)) {
            uniqueSessions7.set(row.campaign_id, new Set())
          }
          uniqueSessions7.get(row.campaign_id)!.add(row.session_id)
        }

        if (occurredAt && occurredAt >= threshold30) {
          events30.set(
            row.campaign_id,
            (events30.get(row.campaign_id) ?? 0) + 1,
          )
        }

        if (row.occurred_at) {
          const dt = new Date(row.occurred_at)
          const hour = dt.getHours()
          const day = dt.getDay()
          const dayKey = dt.toISOString().slice(0, 10) // YYYY-MM-DD
          activityByDay.set(dayKey, (activityByDay.get(dayKey) ?? 0) + 1)
          activityByHour[hour] = activityByHour[hour] + 1
          if (dt >= thresholdOnline) {
            if (!onlineSessions.has(row.campaign_id)) {
              onlineSessions.set(row.campaign_id, new Set())
            }
            onlineSessions.get(row.campaign_id)!.add(row.session_id)
            onlineGlobal.add(row.session_id)
          }
          if (!hourBuckets.has(row.campaign_id)) {
            hourBuckets.set(row.campaign_id, new Map())
          }
          const map = hourBuckets.get(row.campaign_id)!
          map.set(hour, (map.get(hour) ?? 0) + 1)

          if (!dayBuckets.has(row.campaign_id)) {
            dayBuckets.set(row.campaign_id, new Map())
          }
          const dayMap = dayBuckets.get(row.campaign_id)!
          dayMap.set(day, (dayMap.get(day) ?? 0) + 1)
        }

        if (ip) {
          if (!uniqueIps.has(row.campaign_id)) {
            uniqueIps.set(row.campaign_id, new Set())
          }
          uniqueIps.get(row.campaign_id)!.add(ip)
          uniqueIpsGlobal.add(ip)

          if (!ipCounts.has(row.campaign_id)) {
            ipCounts.set(row.campaign_id, new Map())
          }
          const map = ipCounts.get(row.campaign_id)!
          map.set(ip, (map.get(ip) ?? 0) + 1)
        }

        if (!deviceCounts.has(row.campaign_id)) {
          deviceCounts.set(row.campaign_id, new Map())
        }
        const dMap = deviceCounts.get(row.campaign_id)!
        dMap.set(device, (dMap.get(device) ?? 0) + 1)

        deviceCountsGlobal.set(
          device,
          (deviceCountsGlobal.get(device) ?? 0) + 1,
        )

        if (!osCounts.has(row.campaign_id)) {
          osCounts.set(row.campaign_id, new Map())
        }
        const osMap = osCounts.get(row.campaign_id)!
        osMap.set(os, (osMap.get(os) ?? 0) + 1)

        osCountsGlobal.set(os, (osCountsGlobal.get(os) ?? 0) + 1)

        if (!userCounts.has(row.campaign_id)) {
          userCounts.set(row.campaign_id, new Map())
        }
        const uMap = userCounts.get(row.campaign_id)!
        uMap.set(userLabel, (uMap.get(userLabel) ?? 0) + 1)
      })

      uniqueMap = Object.fromEntries(
        Array.from(uniqueSessions.entries()).map(([id, set]) => [id, set.size]),
      )

      unique7Map = Object.fromEntries(
        Array.from(uniqueSessions7.entries()).map(([id, set]) => [
          id,
          set.size,
        ]),
      )

      events30Map = Object.fromEntries(events30.entries())

      onlineMap = Object.fromEntries(
        Array.from(onlineSessions.entries()).map(([id, set]) => [id, set.size]),
      )
      onlineTotal = onlineGlobal.size

      uniqueIpMap = Object.fromEntries(
        Array.from(uniqueIps.entries()).map(([id, set]) => [id, set.size]),
      )
      uniqueIpTotal = uniqueIpsGlobal.size

      topIpsMap = Object.fromEntries(
        Array.from(ipCounts.entries()).map(([id, map]) => {
          const sorted = Array.from(map.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([ip, count]) => ({ ip, count }))
          return [id, sorted]
        }),
      )

      devicePerCampaign = Object.fromEntries(
        Array.from(deviceCounts.entries()).map(([id, map]) => [
          id,
          Object.fromEntries(map.entries()),
        ]),
      )

      deviceTotals = Object.fromEntries(deviceCountsGlobal.entries())

      osPerCampaign = Object.fromEntries(
        Array.from(osCounts.entries()).map(([id, map]) => [
          id,
          Object.fromEntries(map.entries()),
        ]),
      )

      osTotals = Object.fromEntries(osCountsGlobal.entries())

      userTopMap = Object.fromEntries(
        Array.from(userCounts.entries()).map(([id, map]) => {
          const sorted = Array.from(map.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([label, count]) => ({ label, count }))
          return [id, sorted]
        }),
      )

      peakHourRangeMap = Object.fromEntries(
        Array.from(hourBuckets.entries()).map(([id, map]) => {
          if (map.size === 0) return [id, '—']
          const [peakHour] = Array.from(map.entries()).reduce(
            (acc, curr) => (curr[1] > acc[1] ? curr : acc),
            [-1, -1] as [number, number],
          )
          const start = peakHour.toString().padStart(2, '0')
          const end = ((peakHour + 1) % 24).toString().padStart(2, '0')
          return [id, `${start}:00 - ${end}:00`]
        }),
      )

      peakDayMap = Object.fromEntries(
        Array.from(dayBuckets.entries()).map(([id, map]) => {
          if (map.size === 0) return [id, '—']
          const [peakDay] = Array.from(map.entries()).reduce(
            (acc, curr) => (curr[1] > acc[1] ? curr : acc),
            [-1, -1] as [number, number],
          )
          return [id, weekdayNames[peakDay] ?? '—']
        }),
      )

      activityAvailable = activityRows.length > 0
    } else {
      activityAvailable = false
    }
  } catch (error) {
    console.error('Activity data unavailable', error)
    activityAvailable = false
  }

  const campaignsWithAttendance = campaigns.map(campaign => ({
    ...campaign,
    uniqueUsers: uniqueMap[campaign.id] ?? 0,
    uniqueUsers7: unique7Map[campaign.id] ?? 0,
    events30: events30Map[campaign.id] ?? 0,
    onlineUsers: onlineMap[campaign.id] ?? 0,
    uniqueIps: uniqueIpMap[campaign.id] ?? 0,
    topIps: topIpsMap[campaign.id] ?? [],
    deviceCounts: devicePerCampaign[campaign.id] ?? {},
    osCounts: osPerCampaign[campaign.id] ?? {},
    userCounts: userTopMap[campaign.id] ?? [],
    peakRange: peakHourRangeMap[campaign.id] ?? '—',
    peakDay: peakDayMap[campaign.id] ?? '—',
  }))

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        <StatsDashboard
          campaigns={campaignsWithAttendance}
          activityAvailable={activityAvailable}
          onlineTotal={onlineTotal}
          uniqueIpTotal={uniqueIpTotal}
          deviceTotals={deviceTotals}
          osTotals={osTotals}
          activityByHour={activityByHour}
          activityByDay={Array.from(activityByDay.entries()).map(
            ([date, count]) => ({
              date,
              count,
            }),
          )}
        />
      </div>
    </div>
  )
}
