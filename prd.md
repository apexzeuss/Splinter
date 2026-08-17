# Product Requirements Document (PRD): Splinter

## 1. Product Summary
- **Product Name**: Splinter
- **Tagline**: Intelligent Pedestrian Heat & Shade Router
- **Core Value Proposition**: Minimizes pedestrian heat stroke, dehydration, and cardiovascular strain during extreme heat events by dynamically calculating sun angles, building shade projections, and urban microclimates to deliver comfortable walking routes.

---

## 2. Problem Statement
Urban heat islands (UHIs) routinely elevate inner-city street temperatures by **5°C to 12°C** above ambient suburban baselines. During summer heatwaves, walking along unshaded asphalt can cause acute thermal stress within 10–15 minutes. 

Existing navigation services (Google Maps, Apple Maps) optimize exclusively for **distance** or **travel time**, directing pedestrians into high-radiation direct sun corridors. Pedestrians lack navigation software that factors in solar elevation, shadow coverage, tree canopy density, and active cooling assets.

---

## 3. User Personas & Target Audiences
1. **Urban Pedestrians & Commuters**: Workers and transit riders traveling between metro stations and offices during peak solar radiation (10:00 AM – 5:00 PM).
2. **Vulnerable Populations & Caregivers**: Elderly individuals, young children, and individuals with cardiovascular or respiratory conditions sensitive to heat stress.
3. **Delivery Workers & Outdoor Laborers**: Couriers and municipal workers needing shaded rest corridors and hydration checkpoints.
4. **Urban Planners & Municipalities**: City resilience teams identifying sidewalk shade deficits and planning tree canopy and shade sail interventions.

---

## 4. Key Functional Requirements

### 4.1 Real-Time Astronomical Solar Calculation
- Must compute solar azimuth ($\theta_z$) and solar elevation/altitude ($\alpha$) angles with minute-level precision for any global latitude and longitude.
- Must support interactive time-of-day scrubbing (06:00 to 20:00) with animated trajectory playback.
- Dynamic solar metrics: UV Index estimation, solar intensity ($W/m^2$), and Mean Radiant Temperature ($T_{mrt}$).

### 4.2 2.5D Building Shadow Projection
- Must model 3D urban geometries (building footprint polygons + building heights/levels).
- Extrudes geometric shadow polygons along the anti-solar directional vector:
  $$\text{Shadow Length} = \frac{H}{\tan(\alpha)}$$
- Must calculate polygon unions and edge-clipping against the walkable pedestrian network.

### 4.3 Thermal Routing & Edge Cost Evaluation
- Dual-objective pathfinding:
  - **Direct Path**: Minimum geometric distance baseline.
  - **Splinter Cool Path**: Maximum shade coverage, minimum thermal dose, routed through cooling nodes.
- Quantified trade-off report:
  - Total walk distance & delta (+X meters).
  - Walk duration (+X minutes).
  - Average shade coverage percentage (e.g., 84% shaded vs 18% direct).
  - Effective temperature drop ($\Delta T = -4.5^\circ\text{C}$).
  - Cumulative thermal radiation exposure reduction (Joules / Joules per minute).

### 4.4 Real-World Location & Weather Ingestion
- HTML5 Browser Geolocation with high-accuracy GPS.
- Resilient multi-tier IP Geolocation mesh fallback (`ipwho.is` / `ipapi.co`) when browser permissions are unavailable.
- Real-time weather data via Open-Meteo API (ambient temperature, wind speed, relative humidity).
- Preset global heat hotspots: Phoenix, Dubai, Singapore, Seville, Las Vegas, Tokyo.

### 4.5 Multi-Page Web Platform
- **Home**: Executive overview, interactive highlights, feature cards, live microclimate pulse.
- **2.5D Router Simulator**: Interactive map canvas, raytraced shadows, building models, draggable nodes, cooling hub checkpoints, time scrubber, and route inspector.
- **UHI Analytics**: Heat island maps, canopy deficit analysis, diurnal thermal profiles.
- **Cooling Network**: Directory and status monitor of municipal cooling centers, hydration stations, and misting zones.
- **Developer API & Python SDK**: Interactive code snippets, OpenAPI documentation, and Python package usage instructions.
- **Mission & Research**: Scientific justification, thermal comfort indices ($T_{mrt}$, PET, UTCI), and community resilience roadmap.
- **Pipeline & Handoff Console**: Embedded markdown documentation viewer for AI coding agents and human engineers.

---

## 5. Non-Functional Requirements
- **Performance**: Sub-100ms shadow extrusion and graph edge-weight recalculation during interactive scrubbing.
- **Portability**: Standard React + Vite + TypeScript codebase with zero proprietary lock-in.
- **Accessibility**: High-contrast typography, WCAG AA compliant contrast ratios, intuitive visual heat maps.
- **Responsiveness**: Fluid layout across mobile, tablet, desktop, and embedded iframe displays.
