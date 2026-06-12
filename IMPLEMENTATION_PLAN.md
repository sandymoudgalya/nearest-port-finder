# Nearest Port Finder - Implementation Plan

## Context
Create a new project "nearest-port-finder" with a clean, premium web UI that allows users to:
1. Input latitude/longitude coordinates
2. Optional plus code input
3. Radius input (default 5km)
4. Search for the 5 nearest ports within the radius
5. Display results in both tabular view (Port Name, Address, Coordinates) and map view

## Approach
Following the pattern of the existing weather-app, I'll use **Vite + vanilla JavaScript + CSS** for a lightweight, fast, premium-feeling web application.

### Data Source
Since there's no free, simple API for global port data that works without API keys, I'll use a **curated static dataset** of major world ports (~1,000+ ports) embedded in the application. This provides:
- Zero external dependencies
- Fast client-side search
- Works offline after initial load
- No API rate limits or keys needed

### Technical Stack
- **Vite** - Build tool and dev server
- **Vanilla JS (ES Modules)** - No framework overhead
- **Leaflet.js** - Lightweight map library (via CDN)
- **Custom CSS** - Premium dark theme with clean typography

## File Structure
```
nearest-port-finder/
├── index.html              # Main HTML structure
├── style.css               # Premium dark theme styling
├── app.js                  # Main application logic
├── data/
│   └── ports.json          # Curated port dataset (~1000 ports)
├── package.json            # Vite configuration
├── vite.config.js          # Vite config
└── IMPLEMENTATION_PLAN.md  # This file
```

## Implementation Details

### 1. HTML Structure (index.html) ✅ COMPLETED
- Semantic HTML5 with meta tags for responsiveness
- Header with "Nearest Port Finder" title
- Input form section:
  - Latitude input (required, number, step=0.000001)
  - Longitude input (required, number, step=0.000001)
  - Plus code input (optional, text)
  - Radius input (number, default=5, min=1, max=500, unit=km)
  - Search button
- Results section with tabs:
  - Tabular view (table with Port Name, Address, Coordinates, Distance)
  - Map view (Leaflet map container)
- Loading and error states

### 2. Styling (style.css) ✅ COMPLETED
- Premium dark theme (similar to weather-app)
- CSS custom properties for theming
- Clean typography (Inter or system font stack)
- Responsive grid/flex layouts
- Smooth transitions and micro-interactions
- Table styling with hover states
- Map container responsive sizing
- Tab styling with active indicators
- Loading spinner animation

### 3. Port Data (data/ports.json) ✅ COMPLETED (pre-existing)
Curated dataset with fields:
- `name` - Port name
- `country` - Country name
- `countryCode` - ISO country code
- `lat` - Latitude
- `lon` - Longitude
- `unlocode` - UN/LOCODE (5-char port identifier)
- `address` - Formatted address string

### 4. Application Logic (app.js) ✅ COMPLETED
- **Haversine formula** for distance calculation
- **Plus code decoding** (Open Location Code) - optional enhancement
- **Search function**: Filter ports within radius, sort by distance, take top 5
- **Tab switching** between table and map views
- **Table rendering** with formatted coordinates and distances
- **Map initialization** with Leaflet, markers for each port
- **Geolocation API** - "Use my location" button
- **URL state** - Shareable URLs with search params
- **Error handling** and user feedback

### 5. Package.json & Vite Config ✅ COMPLETED
- Standard Vite setup
- Dev and build scripts
- No additional dependencies (Leaflet from CDN)

## Verification Plan
1. Run `npm install` in project directory ✅
2. Run `npm run dev` to start dev server
3. Open in browser and test:
   - Input coordinates (e.g., Singapore: 1.3521, 103.8198)
   - Search returns ports in table
   - Tab switch to map shows markers
   - Radius change filters results
   - "Use my location" works (if HTTPS/localhost)
   - Responsive on mobile
4. Run `npm run build` and verify dist output

## Key Design Decisions
| Decision | Rationale |
|----------|-----------|
| Static port dataset | No API keys, instant search, works offline |
| Vanilla JS + Vite | Lightweight, fast, matches existing project patterns |
| Leaflet via CDN | No bundling complexity, widely used, lightweight |
| Dark premium theme | Consistent with weather-app aesthetic |
| Haversine formula | Accurate enough for port-finding distances |
| Top 5 results | UX constraint per requirements |

## Progress Tracker
- [x] Project structure & package.json
- [x] Vite configuration
- [x] Port dataset (pre-existing)
- [x] HTML structure (index.html)
- [ ] CSS styling (style.css) - **CURRENT**
- [ ] Application logic (app.js)
- [ ] Dev server verification
- [ ] Production build verification