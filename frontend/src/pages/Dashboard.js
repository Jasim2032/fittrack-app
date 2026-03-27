import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  Activity, Flame, Clock, Target, TrendingUp, Zap,
  Dumbbell, Flame as StreakIcon, CloudSun, Droplets
} from 'lucide-react';
import { getStats, getWorkouts, seedData } from '../api';
import { useAuth } from '../contexts/AuthContext';

const COLORS = ['#6c5ce7', '#00d2ff', '#ff6b6b', '#2ed573', '#ffa502'];

// ─── WMO weather code map ─────────────────────────────────────
const WMO = {
  0:  { label: 'Clear sky',       icon: '☀️',  tip: 'Perfect for an outdoor workout!' },
  1:  { label: 'Mainly clear',    icon: '🌤️',  tip: 'Great conditions — get outside!' },
  2:  { label: 'Partly cloudy',   icon: '⛅',  tip: 'Nice weather for training!' },
  3:  { label: 'Overcast',        icon: '☁️',  tip: 'Good day for any workout.' },
  45: { label: 'Foggy',           icon: '🌫️',  tip: 'Indoor workout recommended.' },
  51: { label: 'Light drizzle',   icon: '🌦️',  tip: 'Maybe hit the gym today.' },
  61: { label: 'Rainy',           icon: '🌧️',  tip: 'Perfect indoor workout day!' },
  71: { label: 'Snowy',           icon: '🌨️',  tip: 'Stay warm — train inside!' },
  80: { label: 'Rain showers',    icon: '🌦️',  tip: 'Consider an indoor session.' },
  95: { label: 'Thunderstorm',    icon: '⛈️',  tip: 'Stay inside and train hard!' },
};

function getWeatherInfo(code) {
  if (WMO[code]) return WMO[code];
  for (const threshold of [95, 80, 71, 61, 51, 45, 3, 2, 1]) {
    if (code >= threshold) return WMO[threshold];
  }
  return WMO[0];
}

// ─── Weather Widget ───────────────────────────────────────────
function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const [city, setCity] = useState('');

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lon } }) => {
        try {
          const [weatherRes, geoRes] = await Promise.all([
            fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`
            ),
            fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
              { headers: { 'Accept-Language': 'en' } }
            )
          ]);
          const weatherData = await weatherRes.json();
          const geoData = await geoRes.json();
          const cityName =
            geoData.address?.city ||
            geoData.address?.town ||
            geoData.address?.village ||
            geoData.address?.county ||
            'Your location';
          setWeather(weatherData.current_weather);
          setCity(cityName);
        } catch {
          // Silently fail — widget is optional
        }
      },
      () => {} // Geolocation denied — no widget
    );
  }, []);

  if (!weather) return null;

  const info = getWeatherInfo(weather.weathercode);

  return (
    <div className="weather-widget">
      <div className="weather-emoji">{info.icon}</div>
      <div className="weather-body">
        <div className="weather-temp">{Math.round(weather.temperature)}°C</div>
        <div className="weather-label">{info.label} · {city}</div>
        <div className="weather-tip">{info.tip}</div>
      </div>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8, padding: '10px 14px', fontSize: 12
    }}>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {payload.map((item, i) => (
        <p key={i} style={{ color: item.color }}>{item.name}: {item.value}</p>
      ))}
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────
function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [sRes, wRes] = await Promise.all([getStats(), getWorkouts()]);
      setStats(sRes.data);
      setRecentWorkouts(wRes.data.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    try {
      await seedData();
      await loadData();
    } catch (err) {
      console.error('Seed failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        <Activity />
        <h3>Loading dashboard...</h3>
      </div>
    );
  }

  const statCards = [
    { icon: <Dumbbell size={20} />, value: stats?.total_workouts || 0, label: 'Total Workouts', accent: '#6c5ce7' },
    { icon: <Zap size={20} />, value: stats?.this_week || 0, label: 'This Week', accent: '#00d2ff' },
    { icon: <Flame size={20} />, value: (stats?.total_calories || 0).toLocaleString(), label: 'Calories Burned', accent: '#ff6b6b' },
    { icon: <Clock size={20} />, value: `${Math.round((stats?.total_minutes || 0) / 60)}h`, label: 'Total Hours', accent: '#2ed573' },
    { icon: <Target size={20} />, value: stats?.active_goals || 0, label: 'Active Goals', accent: '#ffa502' },
    {
      icon: <StreakIcon size={20} />,
      value: stats?.streak || 0,
      label: 'Day Streak',
      accent: '#fd79a8',
      suffix: stats?.streak > 0 ? '🔥' : ''
    },
  ];

  const firstName = user?.username
    ? user.username.charAt(0).toUpperCase() + user.username.slice(1)
    : 'Athlete';

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2>Dashboard</h2>
          <p>Welcome back, <strong style={{ color: 'var(--text-primary)' }}>{firstName}</strong>. Here's your fitness overview.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <WeatherWidget />
          {stats?.total_workouts === 0 && (
            <button className="btn btn-primary" onClick={handleSeed}>
              <Zap size={16} /> Load Demo Data
            </button>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {statCards.map((card, i) => (
          <div key={i} className="stat-card animate-in" style={{ '--card-accent': card.accent }}>
            <div className="stat-icon" style={{ background: `${card.accent}18`, color: card.accent }}>
              {card.icon}
            </div>
            <div className="stat-value">
              {card.value}{card.suffix && <span style={{ fontSize: '20px', marginLeft: 4 }}>{card.suffix}</span>}
            </div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {stats?.total_workouts > 0 && (
        <div className="charts-grid">
          <div className="chart-card">
            <h3>Weekly Activity</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={stats.weekly_data}>
                <defs>
                  <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6c5ce7" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6c5ce7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" stroke="#55556a" fontSize={12} />
                <YAxis stroke="#55556a" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone" dataKey="calories" name="Calories"
                  stroke="#6c5ce7" strokeWidth={2} fill="url(#calGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>Workout Types</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={stats.workout_types} dataKey="count" nameKey="workout_type"
                  cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  paddingAngle={4} strokeWidth={0}
                >
                  {stats.workout_types.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {stats.workout_types.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                  {t.workout_type}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Workouts */}
      {recentWorkouts.length > 0 && (
        <div className="card" style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Recent Workouts</h3>
          <div className="workout-list">
            {recentWorkouts.map((w) => (
              <div key={w.id} className="workout-item">
                <div className="workout-item-left">
                  <span className={`workout-type-badge badge-${w.workout_type.toLowerCase()}`}>
                    {w.workout_type}
                  </span>
                  <div className="workout-info">
                    <h4>{w.notes || w.workout_type + ' Session'}</h4>
                    <span>
                      {new Date(w.date).toLocaleDateString('en-IE', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div className="workout-stats">
                  <div className="workout-stat">
                    <div className="value">{w.duration_minutes}</div>
                    <div className="label">min</div>
                  </div>
                  <div className="workout-stat">
                    <div className="value">{w.calories_burned}</div>
                    <div className="label">kcal</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats?.total_workouts === 0 && (
        <div className="empty-state">
          <Activity size={48} />
          <h3>No workout data yet</h3>
          <p>Click "Load Demo Data" above to see the dashboard in action, or log your first workout.</p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
