# Project Plan: Splinter Pedestrian Thermal & Shade Routing Engine

## 1. Executive Summary & Vision
Extreme urban heat waves create acute pedestrian health risks. Standard navigation apps route solely for the shortest geometric distance or travel time, exposing pedestrians to unshaded asphalt corridors, severe solar irradiance, and elevated Mean Radiant Temperatures ($T_{mrt}$). 

**Splinter** is an intelligent pedestrian thermal routing and microclimate navigation platform. It continuously combines astronomical solar geometry, real-time building shadow extrusion, urban heat island (UHI) sensor data, tree canopy foliage metrics, and cooling infrastructure to calculate comfortable, shade-prioritized walking corridors.

---

## 2. Core Architecture & System Modules

### Module 1: Astronomical Solar Engine (`solar_engine`)
- Computes real-time solar elevation ($\alpha$) and solar azimuth ($\theta_z$) angles for any global coordinate and timestamp down to the minute.
- Accounts for day of year, solar declination ($\delta$), and equation of time (EOT).

### Module 2: 2.5D/3D Shadow Extrusion Engine (`shadow_extruder`)
- Ingests OpenStreetMap (OSM) / municipal building footprints with heights/levels.
- Vectorized shadow extrusion along the anti-solar directional vector:
  $$\vec{v}_{shadow} = \frac{h}{\tan(\alpha)} [-\sin(\theta_z), -\cos(\theta_z)]$$
- Computes building shadow polygons, union merges, and edge-clipping against the pedestrian sidewalk graph.

### Module 3: Microclimate & Thermal Cost Evaluator (`thermal_cost`)
- Computes effective segment temperature:
  $$T_{eff} = T_{base} + \Delta T_{surface} - \beta_{shade} \cdot (\text{Coverage} \times 100) - \beta_{cool\_hub}$$
- Formulates multi-objective pedestrian thermal edge cost:
  $$W(e) = \text{Dist}(e) \cdot \left[ 1.0 + \lambda_{heat} \cdot \max(0, T_{ambient} - 25) \cdot (1 - \text{Coverage}(e)) - \gamma_{bonus} \cdot \text{Coverage}(e) \right]$$

### Module 4: Multi-Objective A* / Pareto Thermal Router (`router`)
- Computes dual routes simultaneously:
  1. **Direct Route (Baseline)**: Shortest distance / minimum travel time.
  2. **Splinter Cool Route**: Shade-optimized, thermal-exposure minimized path with cooling oasis checkpoints (misting stations, hydration hubs, indoor cool corridors).
- Quantifies comparative metrics: distance penalty, time delta, shade coverage gain (%), and reduction in thermal load (Joules absorbed / perceived °C).

### Module 5: Interactive Web Application & Visualizer (`frontend`)
- Multi-page responsive web dashboard built in React, TypeScript, Tailwind CSS, Lucide icons, and Motion.
- Includes **Interactive 2.5D Shadow Router Simulator**, **UHI Heat Island Analytics**, **Cooling Oasis Network**, **Developer API & Python SDK**, **About & Mission**, and **Documentation & Pipeline Inspection Console**.

---

## 3. Development Phases & Roadmap

### Phase 1: Mathematical Foundations & Day 1 Focus (Completed ✅)
- [x] Sun position equations (azimuth, zenith, elevation).
- [x] Vector shadow extrusion algorithm for building heights.
- [x] Line-polygon intersection & shade coverage calculation on graph edges.
- [x] Thermal edge cost function implementation.
- [x] Dual-route evaluation (Direct vs. Cool).

### Phase 2: Hyperlocal Sensors & Real-World Geolocation (Completed ✅)
- [x] Integrated HTML5 Browser Geolocation with multi-tier IP Geolocation mesh fallback (`ipwho.is` + `ipapi.co`).
- [x] Live Open-Meteo real-time weather integration (ambient temperature, humidity, UV index).
- [x] City presets library (Phoenix, Dubai, Singapore, Seville, Las Vegas, Tokyo, + Live GPS Location).
- [x] Real-time solar slider and interactive time-of-day playback (6:00 AM – 8:00 PM).

### Phase 3: Comprehensive Multi-Page Platform (Completed ✅)
- [x] **Home Page**: Hero, interactive demo teaser, feature cards, live microclimate pulse.
- [x] **Live 2.5D Router Simulator**: Canvas with raytraced shadows, building models, sidewalk grid, cooling hubs, dual routing paths, and inspector cards.
- [x] **UHI Analytics Page**: Heat island delta breakdowns, canopy cooling analysis, diurnal temperature curves.
- [x] **Cooling Network Page**: Registry of cooling stations, water refill nodes, misting zones, and shade structures with real-time status.
- [x] **Developer API / SDK Page**: Interactive code samples (Python, cURL, TypeScript/Node), OpenAPI schemas, and documentation.
- [x] **About & Mission Page**: Urban heat vulnerability research, SDG alignment, and open data roadmap.
- [x] **Embedded Pipeline Console**: Live markdown viewer for `project-plan.md`, `prd.md`, `architecture.md`, `memory.md`, and `handoff.md`.

### Phase 4: Future Enhancements & Production Roadmap (Next Up 🚀)
- [ ] Export Python library to PyPI (`pip install splinter-routing`).
- [ ] Integration with real OSM Overpass API for live worldwide street vector tiles.
- [ ] Mobile PWA offline shadow tile caching for low-connectivity pedestrian navigation.
- [ ] Integration with municipal IoT heat sensor networks (e.g., Array of Things).
