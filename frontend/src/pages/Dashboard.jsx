import { useState, useEffect } from 'react'
import { api } from '../api/api'
import { today } from '../utils/dateUtils'
import WeekSummary from '../components/WeekSummary'
import DashboardCalendar from '../components/DashboardCalendar'
import DayDetails from '../components/DayDetails'

/**
 *
 */
export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(today())
  const [profile, setProfile] = useState(null)
  const [dayData, setDayData] = useState(null)
  const [weekData, setWeekData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getProfile()
      .then(setProfile)
      .catch(err => console.error(err))
  }, [])

  const load = async (d) => {
    setLoading(true)
    try {
      const [dash, week] = await Promise.all([
        api.getDashboard(d),
        api.getWeekSummary(d),
      ])
      setDayData(dash)
      setWeekData(week)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(selectedDate) }, [selectedDate])

  if (!profile) return <div className="empty-state">Завантаження...</div>

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 16 }}>
        Дашборд <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}> календар здоров'я</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>
        <DashboardCalendar
          profile={profile}
          currentDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
        {loading ? (
          <div className="card" style={{ marginBottom: 0, fontSize: 12, color: 'var(--text-faint)' }}>
            Завантаження...
          </div>
        ) : (
          <DayDetails date={selectedDate} data={dayData} />
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <WeekSummary data={weekData} profile={profile} />
      </div>
    </div>
  )
}