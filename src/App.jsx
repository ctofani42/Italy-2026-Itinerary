import { useEffect, useMemo, useState } from 'react'
import {
  BedDouble,
  Bike,
  BusFront,
  CalendarDays,
  CarFront,
  ChevronDown,
  ExternalLink,
  Footprints,
  Grape,
  Landmark,
  Map,
  MapPin,
  Navigation,
  Plane,
  Ship,
  Sparkles,
  TrainFront,
} from 'lucide-react'
import L from 'leaflet'
import { MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import itinerary from './data/itinerary.json'
import heroImage from './assets/alpine-lake-hero.jpg'

const categoryIcons = {
  hotel: BedDouble,
  airport: Plane,
  station: TrainFront,
  winery: Grape,
  town: MapPin,
  sightseeing: Landmark,
}

const transportIcons = {
  flight: Plane,
  train: TrainFront,
  van: BusFront,
  car: CarFront,
  boat: Ship,
  walk: Footprints,
  bike: Bike,
  none: Sparkles,
}

const regionCopy = {
  all: 'The complete destination itinerary across Switzerland and northern Italy.',
  switzerland: 'June 17–19 · Zurich through the arrival in St. Moritz.',
  'lake-garda': 'June 20–26 · Bernina Express, villa days, lake towns, and Verona.',
  milan: 'June 26–28 · Lake Iseo, Milan, and the trip to Malpensa.',
}

function formatDate(date, options = {}) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(new Date(`${date}T12:00:00`))
}

function daysUntil(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${date}T00:00:00`)
  return Math.ceil((target - today) / 86400000)
}

function mapsUrl(name) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`
}

function FitMap({ locations }) {
  const map = useMap()

  useEffect(() => {
    if (!locations.length) return
    const bounds = L.latLngBounds(locations.map((location) => location.coordinates))
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 9 })
  }, [locations, map])

  return null
}

function markerIcon(location) {
  const color = itinerary.categoryColors[location.category]
  const label = location.category === 'airport' ? '✈' : location.category === 'station' ? '⌁' : '●'
  return L.divIcon({
    className: 'custom-marker',
    html: `<span style="--pin:${color}"><b>${label}</b></span>`,
    iconSize: [34, 42],
    iconAnchor: [17, 40],
    popupAnchor: [0, -34],
  })
}

function localIsoDate() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function TripMap({ activeRegion }) {
  const activeRegionConfig = itinerary.regions.find((region) => region.id === activeRegion)

  const visibleLocations = useMemo(() => {
    const mapLocations = itinerary.locations.filter((location) => location.showOnMap !== false)
    if (activeRegion === 'all') return mapLocations
    const locationIds = new Set(activeRegionConfig?.mapLocationIds || [])
    return mapLocations.filter((location) => locationIds.has(location.id))
  }, [activeRegion, activeRegionConfig])

  const visibleRoutes = activeRegion === 'all'
    ? itinerary.routes
    : itinerary.routes.filter((route) => activeRegionConfig?.routeIds?.includes(route.id))

  return (
    <div className="map-shell">
      <div className="map-heading">
        <div>
          <p className="eyebrow">The journey</p>
          <h2>Follow the route</h2>
        </div>
        <span className="map-note"><Navigation size={15} /> Tap a pin</span>
      </div>
      <MapContainer center={[46.2, 9.6]} zoom={6} scrollWheelZoom={false} className="map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitMap locations={visibleLocations} />
        {visibleRoutes.map((route) => (
          <Polyline
            key={route.id}
            positions={route.points}
            pathOptions={{
              color: route.color,
              weight: 4,
              opacity: 0.82,
            }}
          >
            <Popup>{route.label}</Popup>
          </Polyline>
        ))}
        {visibleLocations.map((location) => (
          <Marker key={location.id} position={location.coordinates} icon={markerIcon(location)}>
            {location.category === 'airport' && (
              <Tooltip permanent direction="right" offset={[14, -20]} className="airport-label">
                {location.shortName} · {location.name}
              </Tooltip>
            )}
            <Popup>
              <strong>{location.name}</strong>
              {location.approximate && <small>Approximate location</small>}
              <a href={mapsUrl(location.name)} target="_blank" rel="noreferrer">
                Open in Google Maps
              </a>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="legend">
        {Object.entries(categoryIcons).map(([category, Icon]) => (
          <span key={category}>
            <i style={{ background: itinerary.categoryColors[category] }}><Icon size={12} /></i>
            {category}
          </span>
        ))}
      </div>
    </div>
  )
}

function EventRow({ event }) {
  const Icon = transportIcons[event.transport] || MapPin
  const place = itinerary.locations.find((location) => location.id === event.placeId)

  return (
    <div className="event-row">
      <time>{event.time}</time>
      <div className="transport-icon" title={event.transport}>
        <Icon size={17} strokeWidth={1.8} />
      </div>
      <div className="event-copy">
        <h4>{event.event}</h4>
        <p>{event.notes}</p>
      </div>
      {place && (
        <a
          className="map-link"
          href={mapsUrl(place.name)}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${place.name} in Google Maps`}
        >
          <ExternalLink size={16} />
        </a>
      )}
    </div>
  )
}

function DayCard({ day, index, isToday }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <article className={`day-card ${isToday ? 'is-today' : ''}`}>
      <button className="day-header" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
        <div className="date-tile">
          <span>{formatDate(day.date, { month: 'short' })}</span>
          <strong>{formatDate(day.date, { day: 'numeric' }).replace(/\D/g, '')}</strong>
        </div>
        <div className="day-title">
          <span>Day {index + 1} · {day.dayLabel}</span>
          <h3>{day.location}</h3>
          <p>{day.summary}</p>
        </div>
        <ChevronDown className={expanded ? 'rotated' : ''} size={20} />
      </button>
      {expanded && (
        <div className="event-list">
          {day.events.map((event, eventIndex) => (
            <EventRow key={`${day.date}-${eventIndex}`} event={event} />
          ))}
        </div>
      )}
    </article>
  )
}

function App() {
  const [activeRegion, setActiveRegion] = useState('all')
  const todayIso = localIsoDate()
  const todayDay = itinerary.days.find((day) => day.date === todayIso)
  const countdown = daysUntil(itinerary.trip.startDate)
  const activeRegionConfig = itinerary.regions.find((region) => region.id === activeRegion)

  const visibleDays = activeRegion === 'all'
    ? itinerary.days
    : itinerary.days.filter(
        (day) => day.date >= activeRegionConfig.startDate && day.date <= activeRegionConfig.endDate,
      )

  return (
    <main>
      <header className="hero" style={{ '--hero-image': `url(${heroImage})` }}>
        <nav>
          <a href="#top" className="brand"><Map size={20} /> MERLoT Family Trip</a>
          <a href="#itinerary" className="nav-link">View itinerary <ChevronDown size={15} /></a>
        </nav>
        <div id="top" className="hero-content">
          <p className="eyebrow light">June 16–28, 2026 · Switzerland & Italy</p>
          <h1>Swiss <em>/</em> Italia</h1>
          <p>{itinerary.trip.subtitle}</p>
          <div className="family-lockup">
            <strong>MERLoT</strong>
            <span>Massaro · Elia · Reale · Laudenslager · Tofani</span>
          </div>
          <div className="trip-stats">
            <span><strong>13</strong> days</span>
            <span><strong>2</strong> countries</span>
            <span><strong>1</strong> epic railway</span>
          </div>
        </div>
      </header>

      {(todayDay || countdown > 0) && (
        <section className="content-wrap today-panel">
          <div className="today-date">
            <CalendarDays size={22} />
            <span>{todayDay ? 'Today' : 'Coming up'}</span>
          </div>
          <div>
            <p className="eyebrow">{todayDay ? formatDate(todayDay.date, { weekday: 'long', month: 'long', day: 'numeric' }) : `${countdown} days to go`}</p>
            <h2>{todayDay ? todayDay.location : 'The adventure starts soon'}</h2>
            <p>{todayDay ? todayDay.summary : `First stop: ${itinerary.days[0].location}.`}</p>
          </div>
          {todayDay && <a href={`#day-${todayDay.date}`}>See today’s plan <ExternalLink size={15} /></a>}
        </section>
      )}

      <section className="content-wrap">
        <div className="tabs" aria-label="Filter itinerary by region">
          {itinerary.regions.map((region) => (
            <button
              key={region.id}
              className={activeRegion === region.id ? 'active' : ''}
              onClick={() => setActiveRegion(region.id)}
            >
              {region.label}
            </button>
          ))}
        </div>
        <p className="filter-description">{regionCopy[activeRegion]}</p>
      </section>

      <section className="content-wrap">
        <TripMap activeRegion={activeRegion} />
      </section>

      <section id="itinerary" className="itinerary-section">
        <div className="content-wrap itinerary-heading">
          <div>
            <p className="eyebrow">Day by day</p>
            <h2>The itinerary</h2>
          </div>
          <span>{visibleDays.length} {visibleDays.length === 1 ? 'day' : 'days'} shown</span>
        </div>
        <div className="content-wrap day-grid">
          {visibleDays.map((day) => (
            <div id={`day-${day.date}`} key={day.date}>
              <DayCard
                day={day}
                index={itinerary.days.findIndex((item) => item.date === day.date)}
                isToday={day.date === todayIso}
              />
            </div>
          ))}
        </div>
      </section>

      <footer>
        <div className="content-wrap">
          <p className="brand"><Map size={20} /> Swiss / Italia</p>
          <p>Built for the journey. Maps © OpenStreetMap contributors.</p>
        </div>
      </footer>
    </main>
  )
}

export default App
