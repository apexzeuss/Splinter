# Architecture & Technical Specifications: Splinter

## 1. High-Level Architecture Overview

```
                      ┌────────────────────────────────────────────────────────┐
                      │              Client Presentation Tier (React 19)       │
                      │  ModernHeader │ RouterSim │ Analytics │ API │ Console │
                      └────────────────────────────┬───────────────────────────┘
                                                   │
                   ┌───────────────────────────────┴───────────────────────────────┐
                   │                                                               │
                   ▼                                                               ▼
    ┌───────────────────────────────┐                             ┌─────────────────────────────────┐
    │  Geospatial & Solar Services  │                             │   Thermal Routing & Simulation  │
    │  • HTML5 GPS / IP Mesh        │                             │   • 2.5D Building Extruder      │
    │  • Reverse Geocode (BigData)  │                             │   • Edge-Polygon Shadow Clipper │
    │  • Open-Meteo Weather API     │                             │   • Modified A* Thermal Graph   │
    └───────────────────────────────┘                             └─────────────────────────────────┘
```

---

## 2. Mathematical Formulations & Algorithms

### 2.1 Solar Position Calculation
Given geographical latitude $\phi$, longitude $\lambda$, and UTC timestamp:
1. **Fractional Year $\gamma$ (radians)**:
   $$\gamma = \frac{2\pi}{365} \left( \text{day\_of\_year} - 1 + \frac{\text{hour} - 12}{24} \right)$$
2. **Equation of Time (EOT, minutes)**:
   $$\text{eqtime} = 229.18 \left( 0.000075 + 0.001868 \cos\gamma - 0.032077 \sin\gamma - 0.014615 \cos 2\gamma - 0.040849 \sin 2\gamma \right)$$
3. **Solar Declination Angle $\delta$ (radians)**:
   $$\delta = 0.006918 - 0.399912 \cos\gamma + 0.070257 \sin\gamma - 0.006758 \cos 2\gamma + 0.000907 \sin 2\gamma$$
4. **True Solar Time (TST, minutes)**:
   $$\text{TST} = \text{local\_minutes} + \text{eqtime} + 4 \times (\lambda - \text{timezone\_meridian})$$
5. **Solar Elevation / Altitude Angle $\alpha$**:
   $$\sin\alpha = \sin\phi \sin\delta + \cos\phi \cos\delta \cos\omega$$
6. **Solar Azimuth Angle $\theta_z$**:
   $$\cos\theta_z = \frac{\sin\alpha \sin\phi - \sin\delta}{\cos\alpha \cos\phi}$$

---

### 2.2 2.5D Building Shadow Polygon Extrusion
For a building footprint polygon with 2D vertices $V = \{ (x_1, y_1), (x_2, y_2), \dots, (x_n, y_n) \}$ and structural height $H$:

1. **Shadow Extrusion Length ($L_{shadow}$)**:
   $$L_{shadow} = \frac{H}{\tan(\max(1.0^\circ, \alpha))}$$
2. **Directional Displacement Vector ($\vec{d}$)**:
   $$dx = -L_{shadow} \cdot \sin(\theta_z)$$
   $$dy = -L_{shadow} \cdot \cos(\theta_z)$$
3. **Projected Vertices ($V_{proj}$)**:
   $$V_{proj} = \{ (x_i + dx, y_i + dy) \mid (x_i, y_i) \in V \}$$
4. **Shadow Polygon ($\mathcal{S}$)**:
   $$\mathcal{S} = \text{ConvexHull}(V \cup V_{proj})$$

---

### 2.3 Edge-Line Shadow Coverage Fraction
For a pedestrian segment line $E = (P_1, P_2)$ and collection of shadow polygons $\mathbb{S} = \{ \mathcal{S}_1, \dots, \mathcal{S}_m \}$:
$$\text{Coverage}(E) = \frac{\text{Length}(E \cap \bigcup \mathcal{S}_j)}{\text{Length}(E)} \in [0.0, 1.0]$$

---

### 2.4 Thermal Edge Cost Function & Modified A*
For each edge $e = (u, v)$ in the pedestrian network graph:
$$W(e) = \text{Distance}(e) \times \left[ 1.0 + w_{heat} \cdot \max(0, T_{ambient} - 25.0) \cdot (1.0 - \text{Coverage}(e)) - w_{shade} \cdot \text{Coverage}(e) - w_{cool} \cdot \text{IsCoolingNode}(v) \right]$$
Where:
- $w_{heat} = 0.08$ (thermal penalty coefficient)
- $w_{shade} = 0.35$ (shade preference bonus)
- $w_{cool} = 0.20$ (cooling hub proximity weight)

---

## 3. Technology Stack & Key Dependencies

| Component | Library / Service | Version / Role |
|---|---|---|
| **UI Framework** | React | 19.0.1 (Single-page modular application) |
| **Language** | TypeScript | ~5.8.2 (Strict type checking) |
| **Bundler / Server** | Vite + TSX / Express | 6.2.3 (Dev on port 3000, production-ready static build) |
| **Styling** | Tailwind CSS v4 | Utility-first, responsive dark theme |
| **Icons** | Lucide React | Clean, scalable vector interface icons |
| **Animations** | Motion | Smooth tab transitions and status indicators |
| **Markdown** | React Markdown | Embedded documentation rendering |
| **AI Integration** | Google GenAI SDK | `@google/genai` v2.4.0 (Server-side ready) |
| **Weather Data** | Open-Meteo API | Free, keyless real-time global weather endpoint |
| **Reverse Geocoding** | BigDataCloud API | Client-side coordinate-to-city resolution |
| **IP Geolocation** | `ipwho.is` & `ipapi.co` | Multi-tier fallback geolocation mesh |

---

## 4. Directory & File Structure

```
├── .env.example                  # Environment variables documentation
├── metadata.json                 # AI Studio permissions & app metadata
├── package.json                  # Node dependencies and npm scripts
├── tsconfig.json                 # TypeScript compiler configuration
├── vite.config.ts                # Vite build & Tailwind plugin config
├── project-plan.md               # Roadmap, phases, and milestone tracking
├── prd.md                        # Product requirements and target personas
├── architecture.md               # Technical architecture and mathematical models
├── memory.md                     # Session journal and key architectural decisions
├── handoff.md                    # Immediate task state and next developer steps
└── src/
    ├── main.tsx                  # React DOM mount entry
    ├── App.tsx                   # Main state container, navigation, geolocation
    ├── types.ts                  # Global TypeScript interfaces & data models
    ├── index.css                 # Global Tailwind CSS imports
    ├── data/
    │   └── projectData.ts        # Built-in documentation, tasks, and scenario datasets
    └── components/
        ├── ModernHeader.tsx      # Navigation header with live GPS badge & status
        ├── HomePage.tsx          # Landing page with interactive highlights
        ├── ShadowRouterSimulator.tsx # 2.5D Canvas, raytracing, solar slider, A* routes
        ├── AnalyticsPage.tsx     # UHI thermal analytics, diurnal curves, canopy stats
        ├── CommunityPage.tsx     # Cooling Oasis Network & municipal shelter registry
        ├── DeveloperApiPage.tsx  # Interactive Python / TypeScript / cURL API docs
        ├── AboutMissionPage.tsx  # Scientific research, SDG goals, and methodology
        ├── DocViewer.tsx         # Embedded markdown viewer with search & syntax
        ├── HandoffOverview.tsx   # Engineering milestone cards & task checklist
        ├── NodeRegistry.tsx      # Active node & cooling asset inventory
        ├── RagSandbox.tsx        # Thermal query & simulation tester
        ├── MemoryConsole.tsx     # Pipeline execution logs and system diagnostics
        ├── Sidebar.tsx           # Secondary navigation drawer
        └── Footer.tsx            # App footer with build version and links
```
