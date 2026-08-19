import React, { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Sun, MapPin, Menu, X, ArrowRight, Loader2 } from 'lucide-react';
import { UserCoords } from '../types';

interface SiteHeaderProps {
  userCoords: UserCoords | null;
  onOpenLocationModal: () => void;
  isLocating: boolean;
}

const NAV = [
  { to: '/router', label: 'Live Router' },
  { to: '/analytics', label: 'Heat Analytics' },
  { to: '/community', label: 'Cooling Network' },
  { to: '/api', label: 'Developers' },
  { to: '/about', label: 'Mission' }
];

export const SiteHeader: React.FC<SiteHeaderProps> = ({
  userCoords,
  onOpenLocationModal,
  isLocating
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  // Close the mobile panel on navigation, otherwise it stays open over the new page.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Don't let the page scroll behind the open mobile panel.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const locationLabel = isLocating
    ? 'Locating…'
    : userCoords?.isLive
      ? `${userCoords.city} · ${userCoords.tempC}°C`
      : 'Set location';

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2.5 rounded-xl"
          aria-label="Splinter home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary lift-primary">
            <Sun className="h-5 w-5 text-white" aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[17px] font-extrabold tracking-tight text-ink">Splinter</span>
            <span className="mt-0.5 hidden text-[11px] font-medium text-muted sm:block">
              Pedestrian shade router
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-200 ${
                  isActive
                    ? 'bg-primary-soft text-primary'
                    : 'text-body hover:bg-canvas-alt hover:text-ink'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenLocationModal}
            disabled={isLocating}
            title="Detect GPS, search a city, or enter coordinates"
            className={`hidden cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors duration-200 disabled:opacity-70 sm:flex ${
              userCoords?.isLive
                ? 'border-primary/30 bg-primary-soft text-primary hover:border-primary/50'
                : 'border-line bg-surface text-body hover:border-line-strong hover:text-ink'
            }`}
          >
            {isLocating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-ink" aria-hidden="true" />
            ) : (
              <MapPin
                className={`h-3.5 w-3.5 ${userCoords?.isLive ? 'text-primary' : 'text-muted'}`}
                aria-hidden="true"
              />
            )}
            <span className="max-w-[150px] truncate">{locationLabel}</span>
          </button>

          <Link
            to="/router"
            className="hidden cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-hover sm:flex"
          >
            Find shade
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>

          {/* Mobile toggle — 44px target */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-line bg-surface text-ink transition-colors duration-200 hover:bg-canvas-alt lg:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      {mobileOpen && (
        <div className="border-t border-line bg-surface lg:hidden">
          <nav className="mx-auto max-w-7xl space-y-1 px-4 py-4 sm:px-6" aria-label="Mobile">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `block rounded-xl px-4 py-3 text-base font-semibold transition-colors duration-200 ${
                  isActive ? 'bg-primary-soft text-primary' : 'text-body hover:bg-canvas-alt'
                }`
              }
            >
              Home
            </NavLink>
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block rounded-xl px-4 py-3 text-base font-semibold transition-colors duration-200 ${
                    isActive ? 'bg-primary-soft text-primary' : 'text-body hover:bg-canvas-alt'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            <div className="grid gap-2 pt-3">
              <button
                type="button"
                onClick={onOpenLocationModal}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-line px-4 py-3 text-sm font-semibold text-body"
              >
                <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                {locationLabel}
              </button>
              <Link
                to="/router"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white"
              >
                Find shade
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
