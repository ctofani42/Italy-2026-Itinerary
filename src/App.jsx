import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  BedDouble,
  Bike,
  Binoculars,
  BusFront,
  CalendarDays,
  CarFront,
  ChevronDown,
  ExternalLink,
  Flag,
  Footprints,
  Grape,
  Landmark,
  Map,
  MapPin,
  Mountain,
  Music2,
  Navigation,
  PawPrint,
  Plane,
  ShoppingBag,
  Ship,
  Sparkles,
  TrainFront,
  Wine,
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

const markerSvgPaths = {
  hotel: `
    <path d="M2 4v16"></path>
    <path d="M2 8h8a4 4 0 0 1 4 4v4H2"></path>
    <path d="M14 10h4a4 4 0 0 1 4 4v6"></path>
    <path d="M6 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
    <path d="M2 20v-4h20v4"></path>
  `,
  airport: `
    <path d="M17.8 19 15 12.5l4.5-2.5a2 2 0 0 0 .8-2.7 2 2 0 0 0-2.7-.8L13 9 8.5 3.5 6 5l3 6-4 2-2.5-2L1 12.5 4.5 16l6-2 3 6z"></path>
  `,
  station: `
    <rect width="16" height="16" x="4" y="3" rx="2"></rect>
    <path d="M8 3V1h8v2"></path>
    <path d="M8 19h8"></path>
    <path d="m6 23 2-4"></path>
    <path d="m18 23-2-4"></path>
    <path d="M8 8h8"></path>
    <path d="M8 14h.01"></path>
    <path d="M16 14h.01"></path>
  `,
  winery: `
    <circle cx="12" cy="7" r="2"></circle>
    <circle cx="9" cy="11" r="2"></circle>
    <circle cx="15" cy="11" r="2"></circle>
    <circle cx="12" cy="15" r="2"></circle>
    <path d="M12 5c0-2 1-3 3-4"></path>
    <path d="M15 1c2 0 3 1 4 3-2 0-3-1-4-3Z"></path>
    <path d="M12 17v5"></path>
  `,
  town: `
    <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"></path>
    <circle cx="12" cy="10" r="2.5"></circle>
  `,
  sightseeing: `
    <path d="m3 10 9-7 9 7"></path>
    <path d="M5 10h14"></path>
    <path d="M7 10v8"></path>
    <path d="M11 10v8"></path>
    <path d="M15 10v8"></path>
    <path d="M19 10v8"></path>
    <path d="M4 18h16"></path>
    <path d="M2 22h20"></path>
  `,
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

const exploreIcons = {
  walk: Footprints,
  hike: Mountain,
  boat: Ship,
  shopping: ShoppingBag,
  drinks: Wine,
  music: Music2,
  culture: Landmark,
  golf: Flag,
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

function directionsUrl(points, mode) {
  const [origin, ...remainingPoints] = points
  const destination = remainingPoints.pop()
  const params = new URLSearchParams({
    api: '1',
    origin: origin.join(','),
    destination: destination.join(','),
    travelmode: mode === 'train' ? 'transit' : 'driving',
  })

  if (remainingPoints.length) {
    params.set('waypoints', remainingPoints.map((point) => point.join(',')).join('|'))
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`
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
  const paths = markerSvgPaths[location.category] || markerSvgPaths.town
  const icon = `
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      ${paths}
    </svg>
  `

  return L.divIcon({
    className: 'custom-marker',
    html: `<span style="--pin:${color}"><b>${icon}</b></span>`,
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

  const mapRoutes = itinerary.routes.filter((route) => route.showOnMap !== false)
  const visibleRoutes = activeRegion === 'all'
    ? mapRoutes
    : mapRoutes.filter((route) => activeRegionConfig?.routeIds?.includes(route.id))

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
            <Popup>
              <strong>{route.label}</strong>
              <a href={directionsUrl(route.points, route.mode)} target="_blank" rel="noreferrer">
                Open route in Google Maps
              </a>
            </Popup>
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
              {location.address && <span>{location.address}</span>}
              {location.approximate && <small>Approximate location</small>}
              <a href={mapsUrl(location.address || location.name)} target="_blank" rel="noreferrer">
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
  const route = itinerary.routes.find((item) => item.id === event.routeId)
  const routePoints = route
    ? event.reverseRoute
      ? [...route.points].reverse()
      : route.points
    : null
  const linkUrl = event.flightTrackerUrl
    || (route
      ? directionsUrl(routePoints, route.mode)
      : place
        ? mapsUrl(place.address || place.name)
        : null)
  const linkType = event.flightTrackerUrl ? 'flight' : route ? 'route' : 'place'

  return (
    <div className="event-row">
      <time>{event.time}</time>
      <div className="transport-icon" title={event.transport}>
        <Icon size={17} strokeWidth={1.8} />
      </div>
      <div className="event-copy">
        <h4>{event.event}</h4>
        <p>{event.notes}</p>
        {place?.address && <address>{place.address}</address>}
      </div>
      {linkUrl && (
        <a
          className={`map-link ${linkType === 'route' ? 'route-link' : ''} ${linkType === 'flight' ? 'flight-link' : ''}`}
          href={linkUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={
            linkType === 'flight'
              ? `Track ${event.event}`
              : linkType === 'route'
                ? `Open ${route.label} directions in Google Maps`
                : `Open ${place.name} in Google Maps`
          }
          title={
            linkType === 'flight'
              ? 'Open live flight tracker'
              : linkType === 'route'
                ? 'Open full route and estimated travel time in Google Maps'
                : 'Open location in Google Maps'
          }
        >
          {linkType === 'flight'
            ? <Plane size={17} />
            : linkType === 'route'
              ? <Navigation size={17} />
              : <ExternalLink size={16} />}
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
        <div className="day-details">
          <div className="event-list">
            {day.events.map((event, eventIndex) => (
              <EventRow key={`${day.date}-${eventIndex}`} event={event} />
            ))}
          </div>
          <aside className="dog-fact">
            <PawPrint size={17} aria-hidden="true" />
            <div>
              <span>Dog fact of the day</span>
              <p>{day.dogFact}</p>
            </div>
          </aside>
        </div>
      )}
    </article>
  )
}

function ExploreCard({ option }) {
  const Icon = exploreIcons[option.category] || Binoculars

  return (
    <article className="explore-card">
      <div className="explore-card-icon">
        <Icon size={19} />
      </div>
      <div className="explore-card-copy">
        <div className="explore-card-meta">
          <span>{option.category}</span>
          <span>{option.duration}</span>
        </div>
        <h3>{option.title}</h3>
        <p>{option.description}</p>
        <div className="best-for">
          {option.bestFor.map((item) => <span key={item}>{item}</span>)}
        </div>
        <div className="explore-links">
          <a href={mapsUrl(option.mapQuery)} target="_blank" rel="noreferrer">
            <MapPin size={14} /> Google Maps
          </a>
          <a href={option.sourceUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={14} /> Official info
          </a>
        </div>
      </div>
    </article>
  )
}

function ExploreView({ onBack }) {
  const [activeExploreRegion, setActiveExploreRegion] = useState('all')
  const visibleExploreRegions = activeExploreRegion === 'all'
    ? itinerary.explore
    : itinerary.explore.filter((region) => region.id === activeExploreRegion)

  return (
    <main className="explore-page">
      <header className="explore-hero" style={{ '--hero-image': `url(${heroImage})` }}>
        <nav>
          <button className="brand nav-button" onClick={onBack}>
            <Map size={20} /> MERLoT Family Trip
          </button>
          <button className="nav-link nav-button" onClick={onBack}>
            <ArrowLeft size={15} /> Back to itinerary
          </button>
        </nav>
        <div className="content-wrap explore-title">
          <p className="eyebrow light">For the unscheduled hours</p>
          <h1>Go explore.</h1>
          <p>
            Walk, browse, boat, taste, golf, or find some live music. These are
            optional ideas for the trip’s free afternoons and open days.
          </p>
        </div>
      </header>

      <section className="content-wrap explore-controls">
        <div className="tabs" aria-label="Filter things to do by destination">
          <button
            className={activeExploreRegion === 'all' ? 'active' : ''}
            onClick={() => setActiveExploreRegion('all')}
          >
            All ideas
          </button>
          {itinerary.explore.map((region) => (
            <button
              key={region.id}
              className={activeExploreRegion === region.id ? 'active' : ''}
              onClick={() => setActiveExploreRegion(region.id)}
            >
              {region.location}
            </button>
          ))}
        </div>
        <p>
          Hours, seasonal transport, tee times, tours, and performances can change.
          Check the linked official site before setting out.
        </p>
      </section>

      <div className="content-wrap explore-regions">
        {visibleExploreRegions.map((region) => (
          <section key={region.id} className="explore-region">
            <div className="explore-region-heading">
              <div>
                <p className="eyebrow">{region.dates}</p>
                <h2>{region.location}</h2>
              </div>
              <p>{region.intro}</p>
            </div>
            <div className="explore-grid">
              {region.options.map((option) => (
                <ExploreCard key={option.title} option={option} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <footer>
        <div className="content-wrap">
          <p className="brand"><Binoculars size={20} /> MERLoT Explore</p>
          <p>Ideas, not obligations. Split up and compare notes later.</p>
        </div>
      </footer>
    </main>
  )
}

function DogProfile({ traveler, index }) {
  return (
    <article className="dog-profile" style={{ '--dog-color': traveler.color }}>
      <div className="dog-monogram">
        <PawPrint size={22} />
        <strong>{traveler.name.charAt(0)}</strong>
      </div>
      <div>
        <p className="dog-number">Traveler {String(index + 1).padStart(2, '0')}</p>
        <h3>{traveler.name}</h3>
        <p className="dog-breed">{traveler.breed}</p>
        <p className="dog-role">{traveler.role}</p>
        <p className="dog-bio">{traveler.bio}</p>
        <blockquote>“{traveler.quote}”</blockquote>
        <span className="dog-voice">{traveler.voice}</span>
      </div>
    </article>
  )
}

function BoysView({ onBack }) {
  return (
    <main className="boys-page">
      <header className="boys-hero" style={{ '--hero-image': `url(${heroImage})` }}>
        <nav>
          <button className="brand nav-button" onClick={onBack}>
            <Map size={20} /> MERLoT Family Trip
          </button>
          <button className="nav-link nav-button" onClick={onBack}>
            <ArrowLeft size={15} /> Back to itinerary
          </button>
        </nav>
        <div className="content-wrap boys-title">
          <p className="eyebrow light">An unauthorized parallel itinerary</p>
          <h1>Keeping Up<br />With the Boys</h1>
          <p>{itinerary.boysTrip.subtitle}</p>
          <div className="boys-roll-call">
            {itinerary.boysTrip.travelers.map((traveler) => (
              <span key={traveler.id} style={{ '--dog-color': traveler.color }}>
                {traveler.name}
              </span>
            ))}
          </div>
        </div>
      </header>

      <section className="content-wrap travelers-section">
        <div className="boys-section-heading">
          <div>
            <p className="eyebrow">The cast</p>
            <h2>Meet the Travelers</h2>
          </div>
          <p>
            Five seasoned personalities traveling as a perfectly ordinary human
            family, except for the parts where they are very obviously dogs.
          </p>
        </div>
        <div className="dog-profile-grid">
          {itinerary.boysTrip.travelers.map((traveler, index) => (
            <DogProfile key={traveler.id} traveler={traveler} index={index} />
          ))}
        </div>
      </section>

      <section className="boys-stories-section">
        <div className="content-wrap boys-section-heading story-heading">
          <div>
            <p className="eyebrow">Their version of events</p>
            <h2>The boys abroad</h2>
          </div>
          <p>
            Same dates. Same route. Significantly more seating disputes.
          </p>
        </div>
        <div className="content-wrap boys-story-grid">
          {itinerary.boysTrip.days.map((story, index) => {
            const tripDay = itinerary.days.find((day) => day.date === story.date)
            return (
              <article className="boys-story-card" key={story.date}>
                <div className="boys-story-date">
                  <span>Day {index + 1}</span>
                  <strong>{formatDate(story.date, { month: 'short', day: 'numeric' })}</strong>
                </div>
                <div className="boys-story-copy">
                  <p className="boys-story-location"><MapPin size={13} /> {tripDay.location}</p>
                  <h3>{story.title}</h3>
                  <p>{story.story}</p>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <footer>
        <div className="content-wrap">
          <p className="brand"><PawPrint size={20} /> Keeping Up With the Boys</p>
          <p>No café chairs were harmed beyond what has already been disclosed.</p>
        </div>
      </footer>
    </main>
  )
}

function App() {
  const [activeView, setActiveView] = useState('itinerary')
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeView])

  if (activeView === 'explore') {
    return <ExploreView onBack={() => setActiveView('itinerary')} />
  }

  if (activeView === 'boys') {
    return <BoysView onBack={() => setActiveView('itinerary')} />
  }

  return (
    <main>
      <header className="hero" style={{ '--hero-image': `url(${heroImage})` }}>
        <nav>
          <a href="#top" className="brand">
            <Map size={20} />
            <span className="brand-long">MERLoT Family Trip</span>
            <span className="brand-short">MERLoT</span>
          </a>
          <div className="nav-actions">
            <button className="nav-link nav-button" onClick={() => setActiveView('explore')}>
              Explore <Binoculars size={15} />
            </button>
            <button className="nav-link nav-button" onClick={() => setActiveView('boys')}>
              The Boys <PawPrint size={15} />
            </button>
            <a href="#itinerary" className="nav-link itinerary-nav-link">Itinerary <ChevronDown size={15} /></a>
          </div>
        </nav>
        <div id="top" className="hero-content">
          <p className="eyebrow light">June 16–28, 2026 · Switzerland & Italy</p>
          <h1>Swiss <em>/</em> Italia</h1>
          <p>{itinerary.trip.subtitle}</p>
          <div className="family-lockup">
            <strong>MERLoT FAMILY TRIP</strong>
            <span>Massaro · Elia · Reale · Laudenslager · Tofani</span>
          </div>
          <div className="trip-stats">
            <span><strong>13</strong> days</span>
            <span><strong>2</strong> countries</span>
            <span><strong>1</strong> cranky baby that just wants to nap</span>
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
