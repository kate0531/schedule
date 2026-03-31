import type { ReactNode } from 'react'
import './App.css'

const weekdays = ['일', '월', '화', '수', '목', '금', '토']
const teams = ['1조', '2조', '3조', '4조']
const dayShiftLabel = '일'
const dayShiftWorkers = ['팀장', '총장', '교관', '김정민']
const shiftPlaceholderText = '교대 근무자는 추후 등록됩니다.'

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
  const cycleStart = new Date(date.getFullYear(), 2, 1)
  cycleStart.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const dayDiff = Math.floor(
    (target.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24),
  )
  const cycleIndex = ((dayDiff % shiftCycle.length) + shiftCycle.length) % shiftCycle.length
  return shiftCycle[cycleIndex]
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
  const year = today.getFullYear()
  const month = today.getMonth()

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
          <button type="button">이전 달</button>
          <button type="button">오늘</button>
          <button type="button">다음 달</button>
        </div>
      </header>

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
            return (
            <div
              className={`day-cell ${cell.isOtherMonth ? 'other-month' : ''}`}
              key={`${cell.day}-${index}`}
            >
              <span
                className={`day-num ${cell.isToday ? 'today' : ''} ${weekendClass}`.trim()}
              >
                {cell.day}
              </span>
              <div className="shift-list">
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
                            <li key={name}>{name}</li>
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
