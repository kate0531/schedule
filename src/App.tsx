import './App.css'

const weekdays = ['일', '월', '화', '수', '목', '금', '토']

function App() {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startWeekday = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const prevMonthLastDate = new Date(year, month, 0).getDate()

  const cells: Array<{ day: number; isOtherMonth: boolean; isToday: boolean }> = []

  for (let i = startWeekday - 1; i >= 0; i -= 1) {
    const day = prevMonthLastDate - i
    cells.push({ day, isOtherMonth: true, isToday: false })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const isToday = day === today.getDate()
    cells.push({ day, isOtherMonth: false, isToday })
  }

  const totalGridCount = cells.length <= 35 ? 35 : 42
  const nextMonthCount = totalGridCount - cells.length
  for (let day = 1; day <= nextMonthCount; day += 1) {
    cells.push({ day, isOtherMonth: true, isToday: false })
  }

  return (
    <main className="wrap">
      <header className="header">
        <div className="title-group">
          <h1>
            {year}년 {month + 1}월
          </h1>
          <p>팀 일정 작성을 위한 심플 월간 달력</p>
        </div>
        <div className="actions">
          <button type="button">이전 달</button>
          <button type="button">오늘</button>
          <button type="button">다음 달</button>
        </div>
      </header>

      <section className="calendar">
        <div className="calendar-grid weekday-row">
          {weekdays.map((day) => (
            <div className="weekday" key={day}>
              {day}
            </div>
          ))}
        </div>
        <div className="calendar-grid">
          {cells.map((cell, index) => (
            <div
              className={`day-cell ${cell.isOtherMonth ? 'other-month' : ''}`}
              key={`${cell.day}-${index}`}
            >
              <span className={`day-num ${cell.isToday ? 'today' : ''}`}>
                {cell.day}
              </span>
              <textarea className="memo" placeholder="일정 메모..." />
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

export default App
