'use client'

import Link from 'next/link'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { Campaign } from '@/lib/types'

type CampaignWithAttendance = Campaign & {
  uniqueUsers?: number
  uniqueUsers7?: number
  events30?: number
  onlineUsers?: number
  uniqueIps?: number
  topIps?: { ip: string; count: number }[]
  deviceCounts?: Record<string, number>
  osCounts?: Record<string, number>
  userCounts?: { label: string; count: number }[]
  peakRange?: string
  peakDay?: string
}

type Props = {
  campaigns: CampaignWithAttendance[]
  activityAvailable: boolean
  onlineTotal: number
  uniqueIpTotal: number
  deviceTotals: Record<string, number>
  osTotals: Record<string, number>
  activityByHour: number[]
}

const COLORS = ['#6366F1', '#22C55E', '#F97316', '#06B6D4', '#A855F7']

export default function StatsDashboard({
  campaigns,
  activityAvailable,
  onlineTotal,
  uniqueIpTotal,
  deviceTotals,
  osTotals,
  activityByHour,
}: Props) {
  const totalCampaigns = campaigns.length
  const activeCampaigns = campaigns.filter(c => c.is_active).length
  const publicCampaigns = campaigns.filter(c => c.is_public).length
  const totalCompletions = campaigns.reduce(
    (sum, c) => sum + (c.completion_count || 0),
    0,
  )
  const totalUnique7 = campaigns.reduce(
    (sum, c) => sum + (c.uniqueUsers7 || 0),
    0,
  )
  const totalEvents30 = campaigns.reduce((sum, c) => sum + (c.events30 || 0), 0)

  const typeCounts = campaigns.reduce(
    (acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const completionData = campaigns.map(c => ({
    name: c.name,
    completions: c.completion_count || 0,
    uniqueUsers: c.uniqueUsers ?? 0,
    uniqueUsers7: c.uniqueUsers7 ?? 0,
  }))

  const deviceTotalEntries = Object.entries(deviceTotals || {})
  const deviceData = deviceTotalEntries.length
    ? deviceTotalEntries.map(([type, value]) => ({
        name:
          type === 'mobile'
            ? 'موبایل'
            : type === 'tablet'
              ? 'تبلت'
              : type === 'desktop'
                ? 'دسکتاپ'
                : 'نامشخص',
        value,
        rawType: type,
      }))
    : []

  const osTotalEntries = Object.entries(osTotals || {})
  const osData = osTotalEntries.length
    ? osTotalEntries.map(([os, value]) => ({
        name:
          os === 'android'
            ? 'اندروید'
            : os === 'ios'
              ? 'iOS'
              : os === 'macos'
                ? 'macOS'
                : os === 'windows'
                  ? 'ویندوز'
                  : os === 'linux'
                    ? 'لینوکس'
                    : 'نامشخص',
        value,
        rawOs: os,
      }))
    : []

  const hourlyData = activityByHour.map((count, idx) => ({
    hour: `${idx.toString().padStart(2, '0')}:00`,
    count,
  }))

  const typeData = Object.entries(typeCounts).map(([type, value]) => ({
    name:
      type === 'general'
        ? 'ختم کامل'
        : type === 'surah'
          ? 'بر اساس سوره'
          : 'دعا',
    value,
  }))

  const timelineMap = campaigns.reduce(
    (acc, c) => {
      if (!c.created_at) return acc
      const key = new Date(c.created_at).toISOString().slice(0, 7) // YYYY-MM
      acc[key] = (acc[key] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const timelineData = Object.entries(timelineMap)
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([month, count]) => ({
      month,
      count,
    }))

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">داشبورد آمار</h1>
          <p className="text-muted-foreground">
            نمای کلی از پویش‌ها و میزان مشارکت کاربران
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin">
            <Button variant="outline">بازگشت به پنل</Button>
          </Link>
          <Link href="/admin/create-campaign">
            <Button>ایجاد پویش جدید</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader>
            <CardTitle>تعداد کل پویش‌ها</CardTitle>
            <CardDescription>فعال و غیرفعال</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {totalCampaigns}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>پویش‌های فعال</CardTitle>
            <CardDescription>در حال اجرا</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {activeCampaigns}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>پویش‌های عمومی</CardTitle>
            <CardDescription>نمایش داده شده به همه</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {publicCampaigns}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>مجموع دفعات ختم</CardTitle>
            <CardDescription>همه پویش‌ها</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {totalCompletions}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>کاربران یکتا (۷ روز)</CardTitle>
            <CardDescription>مجموع یکتا در ۷ روز اخیر</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {totalUnique7}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>تعداد رویدادها (۳۰ روز)</CardTitle>
            <CardDescription>کل فعالیت ثبت شده</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {totalEvents30}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>کاربران آنلاین</CardTitle>
            <CardDescription>۵ دقیقه اخیر (تمام پویش‌ها)</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {activityAvailable ? onlineTotal : '—'}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>IPهای یکتا</CardTitle>
            <CardDescription>تمام پویش‌ها (انباشته)</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {activityAvailable ? uniqueIpTotal : '—'}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>نوع دستگاه کاربران</CardTitle>
          <CardDescription>توزیع کل بر اساس دستگاه</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={deviceData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
              >
                {deviceData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>سیستم‌عامل کاربران</CardTitle>
          <CardDescription>توزیع کل بر اساس سیستم‌عامل</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={osData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
              >
                {osData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {campaigns.map(c => {
          const userData =
            (c.userCounts || []).map(u => ({
              name: u.label.startsWith('unknown')
                ? 'نامشخص'
                : u.label.slice(0, 8),
              count: u.count,
              full: u.label,
            })) || []

          if (!activityAvailable || userData.length === 0) return null

          return (
            <Card key={`users-${c.id}`}>
              <CardHeader>
                <CardTitle>جلسات پویش (session_id): {c.name}</CardTitle>
                <CardDescription>
                  تعداد حضور هر session (تا ۱۰ مورد برتر)
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                      formatter={(
                        value: number,
                        _name: string,
                        entry?: { payload?: { full?: string; name?: string } },
                      ) => [
                        value,
                        entry?.payload?.full || entry?.payload?.name,
                      ]}
                    />
                    <Bar dataKey="count" name="حضور" fill="#06B6D4" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>فعالیت بر اساس ساعت شبانه‌روز</CardTitle>
          <CardDescription>تعداد رویداد ثبت‌شده در هر ساعت</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="رویدادها" fill="#6366F1" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>میزان اتمام و مشارکت</CardTitle>
            <CardDescription>مقایسه ختم و کاربران یکتا (۷ روز)</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={completionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" hide />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completions" name="ختم" fill="#6366F1" />
                {activityAvailable && (
                  <Bar
                    dataKey="uniqueUsers7"
                    name="کاربران یکتا (۷ روز)"
                    fill="#22C55E"
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ترکیب نوع پویش</CardTitle>
            <CardDescription>توزیع بر اساس نوع</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {typeData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>روند ایجاد پویش‌ها</CardTitle>
          <CardDescription>تعداد پویش‌های ایجاد شده در هر ماه</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#06B6D4"
                fill="#CFFAFE"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {!activityAvailable && (
        <Card>
          <CardHeader>
            <CardTitle>داده‌های مشارکت در دسترس نیست</CardTitle>
            <CardDescription>
              جدول فعالیت کاربران در دسترس نیست؛ لطفا جدول
              campaign_activity_logs را اجرا یا پر کنید.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>جزئیات پویش‌ها</CardTitle>
          <CardDescription>اطلاعات کلیدی هر پویش</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-[1200px] space-y-2">
            <div className="grid grid-cols-[1.4fr_repeat(14,1fr)] text-sm font-semibold text-muted-foreground">
              <div>نام</div>
              <div>نوع</div>
              <div>وضعیت</div>
              <div>عمومی</div>
              <div>ختم</div>
              <div>کاربران یکتا</div>
              <div>کاربران یکتا (۷ روز)</div>
              <div>رویدادها (۳۰ روز)</div>
              <div>آنلاین (۵ دقیقه)</div>
              <div>IPهای یکتا</div>
              <div>بازه پیک فعالیت</div>
              <div>روز پیک</div>
              <div>۱۰ IP برتر</div>
              <div>دستگاه‌ها</div>
              <div>سیستم‌عامل</div>
            </div>
            {campaigns.map(c => (
              <div
                key={c.id}
                className="grid grid-cols-[1.4fr_repeat(14,1fr)] items-center rounded-lg border bg-card p-3 text-sm"
              >
                <div className="font-medium">{c.name}</div>
                <div>
                  <Badge variant="secondary">
                    {c.type === 'general'
                      ? 'ختم کامل'
                      : c.type === 'surah'
                        ? 'بر اساس سوره'
                        : 'دعا'}
                  </Badge>
                </div>
                <div>
                  <Badge variant={c.is_active ? 'default' : 'outline'}>
                    {c.is_active ? 'فعال' : 'غیرفعال'}
                  </Badge>
                </div>
                <div>
                  <Badge variant={c.is_public ? 'default' : 'outline'}>
                    {c.is_public ? 'عمومی' : 'خصوصی'}
                  </Badge>
                </div>
                <div className="font-semibold">{c.completion_count ?? 0}</div>
                <div>{activityAvailable ? (c.uniqueUsers ?? 0) : '—'}</div>
                <div>{activityAvailable ? (c.uniqueUsers7 ?? 0) : '—'}</div>
                <div>{activityAvailable ? (c.events30 ?? 0) : '—'}</div>
                <div>{activityAvailable ? (c.onlineUsers ?? 0) : '—'}</div>
                <div>{activityAvailable ? (c.uniqueIps ?? 0) : '—'}</div>
                <div className="text-xs text-muted-foreground">
                  {activityAvailable ? (c.peakRange ?? '—') : '—'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {activityAvailable ? (c.peakDay ?? '—') : '—'}
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  {activityAvailable && c.topIps && c.topIps.length > 0 ? (
                    c.topIps.map(ip => (
                      <div key={`${c.id}-${ip.ip}`}>
                        {ip.ip}: {ip.count}
                      </div>
                    ))
                  ) : (
                    <span>—</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  {activityAvailable &&
                  c.deviceCounts &&
                  Object.keys(c.deviceCounts).length > 0 ? (
                    Object.entries(c.deviceCounts)
                      .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
                      .map(([type, count]) => (
                        <div key={`${c.id}-${type}`}>
                          {type === 'mobile'
                            ? 'موبایل'
                            : type === 'tablet'
                              ? 'تبلت'
                              : type === 'desktop'
                                ? 'دسکتاپ'
                                : 'نامشخص'}{' '}
                          ({count})
                        </div>
                      ))
                  ) : (
                    <span>—</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  {activityAvailable &&
                  c.osCounts &&
                  Object.keys(c.osCounts).length > 0 ? (
                    Object.entries(c.osCounts)
                      .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
                      .map(([os, count]) => (
                        <div key={`${c.id}-${os}`}>
                          {os === 'android'
                            ? 'اندروید'
                            : os === 'ios'
                              ? 'iOS'
                              : os === 'macos'
                                ? 'macOS'
                                : os === 'windows'
                                  ? 'ویندوز'
                                  : os === 'linux'
                                    ? 'لینوکس'
                                    : 'نامشخص'}{' '}
                          ({count})
                        </div>
                      ))
                  ) : (
                    <span>—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
