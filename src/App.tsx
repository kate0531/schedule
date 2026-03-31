import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import Holidays from 'date-holidays'
import './App.css'

const NOTICE_STORAGE_KEY = 'schedule-day-notices'

const weekdays = ['일', '월', '화', '수', '목', '금', '토']
const teams = ['1조', '2조', '3조', '4조']
const dayShiftLabel = '일'
const dayShiftWorkers = ['팀장', '총장', '교관', '김정민']
const shiftPlaceholderText = '교대 근무자는 추후 등록됩니다.'
const cycleStartReference = new Date(2026, 2, 1)

const shiftCycle = [
  ['야', '휴', '주', '휴'],
  ['야', '휴', '주', '휴'],
  ['휴', '야', '휴', '야'],
  ['휴', '야', '휴', '야'],
  ['주', '휴', '야', '주'],
  ['주', '휴', '야', '주'],
  ['휴', '주', '휴', '야'],
  ['휴', '주', '휴', '야'],
]

function getShiftByDate(date: Date) {
  const cycleStart = new Date(cycleStartReference)
  cycleStart.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const dayDiff = Math.floor(
    (target.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24),
  )
  const cycleIndex = ((dayDiff % shiftCycle.length) + shiftCycle.length) % shiftCycle.length
  return shiftCycle[cycleIndex]
}

function dateKey(d: Date) {
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function extractLeaveNames(noticeText: string) {
  const normalized = noticeText.replace(/\r/g, '\n')
  const lines = normalized.split('\n')
  const collected: string[] = []

  for (const line of lines) {
    const match = line.match(/휴가자\s*[:：]\s*(.+)$/)
    if (!match) continue
    const listText = match[1]
    const names = listText
      .split(/[,\s/|]+/)
      .map((name) => name.trim())
      .filter(Boolean)
    collected.push(...names)
  }

  return Array.from(new Set(collected))
}

function isLeaveNameInNotice(noticeText: string, name: string) {
  const leaveNames = extractLeaveNames(noticeText)
  return leaveNames.some((leaveName) => {
    const exactRegex = new RegExp(`^${escapeRegExp(name)}$`)
    return exactRegex.test(leaveName)
  })
}

function loadNotices(): Record<string, string> {
  try {
    const raw = localStorage.getItem(NOTICE_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Record<string, string>
  } catch {
    return {}
  }
}

function ShiftHoverTooltip({
  children,
  panelClassName,
  content,
}: {
  children: ReactNode
  panelClassName?: string
  content: ReactNode
}) {
  return (
    <span className="shift-tooltip" tabIndex={0}>
      {children}
      <span
        className={`shift-tooltip-panel ${panelClassName ?? ''}`.trim()}
        role="tooltip"
      >
        {content}
      </span>
    </span>
  )
}

function App() {
  const today = new Date()
  const [viewDate, setViewDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [notices, setNotices] = useState<Record<string, string>>(loadNotices)
  const [noticeModalDate, setNoticeModalDate] = useState<Date | null>(null)
  const [noticeDraft, setNoticeDraft] = useState('')
  const [openHolidayKey, setOpenHolidayKey] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth())
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const holidayApi = useMemo(() => new Holidays('KR'), [])
  const baseYear = today.getFullYear()
  const yearOptions = Array.from({ length: 21 }, (_, i) => baseYear - 10 + i)

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startWeekday = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const prevMonthLastDate = new Date(year, month, 0).getDate()

  const cells: Array<{
    day: number
    date: Date
    isOtherMonth: boolean
    isToday: boolean
  }> = []

  for (let i = startWeekday - 1; i >= 0; i -= 1) {
    const day = prevMonthLastDate - i
    cells.push({
      day,
      date: new Date(year, month - 1, day),
      isOtherMonth: true,
      isToday: false,
    })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const cellDate = new Date(year, month, day)
    const isToday =
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    cells.push({ day, date: cellDate, isOtherMonth: false, isToday })
  }

  const totalGridCount = cells.length <= 35 ? 35 : 42
  const nextMonthCount = totalGridCount - cells.length
  for (let day = 1; day <= nextMonthCount; day += 1) {
    cells.push({
      day,
      date: new Date(year, month + 1, day),
      isOtherMonth: true,
      isToday: false,
    })
  }

  const goPrevMonth = () => {
    setViewDate((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
      setSelectedYear(next.getFullYear())
      setSelectedMonth(next.getMonth())
      return next
    })
  }

  const goNextMonth = () => {
    setViewDate((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
      setSelectedYear(next.getFullYear())
      setSelectedMonth(next.getMonth())
      return next
    })
  }

  const goTodayMonth = () => {
    const next = new Date(today.getFullYear(), today.getMonth(), 1)
    setViewDate(next)
    setSelectedYear(next.getFullYear())
    setSelectedMonth(next.getMonth())
  }

  const goSelectedMonth = () => {
    setViewDate(new Date(selectedYear, selectedMonth, 1))
  }

  const getHolidayName = (date: Date) => {
    const holidays = holidayApi.isHoliday(date)
    if (!holidays || holidays.length === 0) {
      return null
    }
    return holidays[0].name
  }

  useEffect(() => {
    if (!openHolidayKey) return
    const handleDocClick = () => setOpenHolidayKey(null)
    document.addEventListener('click', handleDocClick)
    return () => document.removeEventListener('click', handleDocClick)
  }, [openHolidayKey])

  useEffect(() => {
    if (!noticeModalDate) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNoticeModalDate(null)
        setNoticeDraft('')
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [noticeModalDate])

  const openNoticeForDate = (d: Date) => {
    setNoticeModalDate(d)
    setNoticeDraft(notices[dateKey(d)] ?? '')
  }

  const closeNoticeModal = () => {
    setNoticeModalDate(null)
    setNoticeDraft('')
  }

  const saveNoticeDraft = () => {
    if (!noticeModalDate) return
    const key = dateKey(noticeModalDate)
    setNotices((prev) => {
      const next = { ...prev }
      const trimmed = noticeDraft.trim()
      if (trimmed) next[key] = trimmed
      else delete next[key]
      try {
        localStorage.setItem(NOTICE_STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* ignore quota */
      }
      return next
    })
    closeNoticeModal()
  }

  const noticeModalTitle = noticeModalDate
    ? `${noticeModalDate.getFullYear()}년 ${noticeModalDate.getMonth() + 1}월 ${noticeModalDate.getDate()}일 공지`
    : ''

  return (
    <main className="wrap">
      <header className="header">
        <div className="title-group">
          <h1>
            {year}년 {month + 1}월
          </h1>
          <p>4조 2교대 패턴 (주/야/휴) 자동 표시</p>
        </div>
        <div className="actions">
          <button type="button" onClick={goPrevMonth}>이전 달</button>
          <button type="button" onClick={goTodayMonth}>오늘</button>
          <button type="button" onClick={goNextMonth}>다음 달</button>
          <select
            aria-label="연도 선택"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {yearOptions.map((optionYear) => (
              <option key={optionYear} value={optionYear}>
                {optionYear}년
              </option>
            ))}
          </select>
          <select
            aria-label="월 선택"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {i + 1}월
              </option>
            ))}
          </select>
          <button type="button" onClick={goSelectedMonth}>이동</button>
        </div>
      </header>

      {noticeModalDate && (
        <div
          className="notice-modal-backdrop"
          role="presentation"
          onClick={closeNoticeModal}
        >
          <div
            className="notice-modal"
            role="dialog"
            aria-labelledby="notice-modal-title"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="notice-modal-title" className="notice-modal-title">
              {noticeModalTitle}
            </h2>
            <textarea
              className="notice-modal-body"
              value={noticeDraft}
              onChange={(e) => setNoticeDraft(e.target.value)}
              placeholder="공지 내용은 추후 입력합니다. 저장하면 해당 날짜에 표시가 켜집니다."
              rows={6}
            />
            <div className="notice-modal-actions">
              <button type="button" className="notice-modal-secondary" onClick={closeNoticeModal}>
                닫기
              </button>
              <button type="button" className="notice-modal-primary" onClick={saveNoticeDraft}>
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="calendar">
        <div className="calendar-grid weekday-row">
          {weekdays.map((day, i) => (
            <div
              className={`weekday ${i === 0 ? 'weekday-sun' : ''} ${i === 6 ? 'weekday-sat' : ''}`.trim()}
              key={day}
            >
              {day}
            </div>
          ))}
        </div>
        <div className="calendar-grid">
          {cells.map((cell, index) => {
            const dow = cell.date.getDay()
            const weekendClass =
              dow === 0 ? 'day-num-sun' : dow === 6 ? 'day-num-sat' : ''
            const holidayName = getHolidayName(cell.date)
            const dk = dateKey(cell.date)
            const noticeText = notices[dk] ?? ''
            const hasNotice = Boolean(noticeText.trim())
            const holidayOpen = openHolidayKey === dk
            return (
              <div
                className={`day-cell ${cell.isOtherMonth ? 'other-month' : ''}`}
                key={`${cell.day}-${index}`}
                role="button"
                tabIndex={0}
                onClick={() => openNoticeForDate(cell.date)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openNoticeForDate(cell.date)
                  }
                }}
              >
                <div className="day-num-row">
                  <span className="day-side day-side-left">
                    {holidayName ? (
                      <span className="holiday-star-wrap">
                        <button
                          type="button"
                          className="holiday-star"
                          aria-label={`공휴일: ${holidayName}`}
                          aria-expanded={holidayOpen}
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenHolidayKey((k) => (k === dk ? null : dk))
                          }}
                        >
                          ★
                        </button>
                        {holidayOpen && (
                          <span
                            className="holiday-star-popover"
                            role="status"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {holidayName}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="day-side-placeholder" aria-hidden="true" />
                    )}
                  </span>
                  <span
                    className={`day-num ${cell.isToday ? 'today' : ''} ${weekendClass}`.trim()}
                  >
                    {cell.day}
                  </span>
                  <span className="day-side day-side-right">
                    {hasNotice ? (
                      <span
                        className="notice-bulb"
                        title="공지가 있습니다. 셀을 눌러 확인하세요"
                        aria-hidden="true"
                      >
                        <svg
                          className="notice-bulb-icon"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 18a7 7 0 100-14 7 7 0 000 14z"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          />
                          <path
                            d="M9 21h6M10 18v3M14 18v3"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                    ) : (
                      <span className="day-side-placeholder" aria-hidden="true" />
                    )}
                  </span>
                </div>
                <div
                  className="shift-list"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  role="presentation"
                >
                  {getShiftByDate(cell.date).map((shift, shiftIndex) => (
                    <p
                      className="shift-item"
                      key={`${cell.day}-${teams[shiftIndex]}`}
                    >
                      <span className="team-name">{teams[shiftIndex]}</span>
                      <ShiftHoverTooltip
                        panelClassName="shift-tooltip-panel--placeholder"
                        content={<span className="shift-tooltip-text">{shiftPlaceholderText}</span>}
                      >
                        <span className={`shift-badge shift-${shift}`}>{shift}</span>
                      </ShiftHoverTooltip>
                    </p>
                  ))}
                  <p className="shift-item" key={`${cell.day}-일근`}>
                    <span className="team-name">일근</span>
                    <ShiftHoverTooltip
                      panelClassName="shift-tooltip-panel--day"
                      content={
                        <>
                          <span className="shift-tooltip-heading">일근 근무자</span>
                          <ul className="shift-tooltip-list">
                            {dayShiftWorkers.map((name) => (
                              <li key={name}>
                                <span
                                  className={`worker-name ${isLeaveNameInNotice(noticeText, name) ? 'worker-name-leave' : ''}`.trim()}
                                  title={
                                    isLeaveNameInNotice(noticeText, name)
                                      ? '공지에 휴가자로 포함됨'
                                      : undefined
                                  }
                                >
                                  {name}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </>
                      }
                    >
                      <span className={`shift-badge shift-${dayShiftLabel}`}>{dayShiftLabel}</span>
                    </ShiftHoverTooltip>
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}

export default App
