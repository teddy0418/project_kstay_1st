"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Listing } from "@/types";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import { totalGuestPriceKRW } from "@/lib/policy";
import { useCurrency } from "@/components/ui/CurrencyProvider";
import { useExchangeRates } from "@/components/ui/ExchangeRatesProvider";

export type ViewBounds = { south: number; west: number; north: number; east: number };

function getBounds(map: L.Map): ViewBounds {
  const b = map.getBounds();
  return { south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() };
}

function makePriceIcon(label: string, active: boolean, hovered?: boolean) {
  const classes = ["kst-price", active ? "kst-price--active" : "", hovered ? "kst-price--hovered" : ""].filter(Boolean).join(" ");
  return L.divIcon({
    className: "kst-price-wrap",
    html: `<div class="${classes}">${label}</div>`,
    iconAnchor: [0, 0],
  });
}

function FitOnce({ items }: { items: Listing[] }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (fitted.current) return;
    const pts = items.map((i) => [i.lat, i.lng] as [number, number]);
    if (pts.length === 0) return;
    const bounds = L.latLngBounds(pts);
    if (!bounds.isValid()) return;
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    fitted.current = true;
  }, [items, map]);

  return null;
}

function MapEvents({
  onBoundsChange,
  onUserMoved,
}: {
  onBoundsChange?: (b: ViewBounds) => void;
  onUserMoved?: () => void;
}) {
  const ignoreRef = useRef(true);
  useEffect(() => {
    const t = setTimeout(() => (ignoreRef.current = false), 900);
    return () => clearTimeout(t);
  }, []);

  const map = useMapEvents({
    moveend: () => onBoundsChange?.(getBounds(map)),
    dragend: () => {
      if (ignoreRef.current) return;
      onUserMoved?.();
      onBoundsChange?.(getBounds(map));
    },
    zoomend: () => {
      if (ignoreRef.current) return;
      onUserMoved?.();
      onBoundsChange?.(getBounds(map));
    },
  });

  useEffect(() => {
    onBoundsChange?.(getBounds(map));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export default function LeafletMap({
  items,
  hoveredId, // reserved for future highlight; parent passes it
  selectedId = null,
  onHoverChange,
  onMarkerClick,
  onBoundsChange,
  onUserMoved,
}: {
  items: Listing[];
  hoveredId: string | null;
  selectedId?: string | null;
  onHoverChange?: (id: string | null) => void;
  onMarkerClick?: (id: string) => void;
  onBoundsChange?: (b: ViewBounds) => void;
  onUserMoved?: () => void;
}) {
  const { currency } = useCurrency();
  const { formatFromKRW } = useExchangeRates();
  const center = useMemo<[number, number]>(() => [36.5, 127.8], []);

  return (
    <MapContainer center={center} zoom={7} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
      />

      <FitOnce items={items} />
      <MapEvents onBoundsChange={onBoundsChange} onUserMoved={onUserMoved} />

      {items.map((l) => {
        const active = selectedId === l.id;
        const hovered = hoveredId === l.id;
        const allIn = totalGuestPriceKRW(l.pricePerNightKRW);
        const label = formatFromKRW(allIn, currency);

        return (
          <Marker
            key={l.id}
            position={[l.lat, l.lng]}
            icon={makePriceIcon(label, active, hovered)}
            eventHandlers={{
              mouseover: () => onHoverChange?.(l.id),
              mouseout: () => onHoverChange?.(null),
              click: () => onMarkerClick?.(l.id),
            }}
          />
        );
      })}
    </MapContainer>
  );
}
