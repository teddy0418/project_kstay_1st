"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Listing } from "@/types";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import { formatKRW } from "@/lib/format";
import { totalGuestPriceKRW } from "@/lib/policy";
import { formatMainCompactFromKRW } from "@/lib/currency";
import { useCurrency } from "@/components/ui/CurrencyProvider";

export type ViewBounds = { south: number; west: number; north: number; east: number };

function getBounds(map: L.Map): ViewBounds {
  const b = map.getBounds();
  return { south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() };
}

function makePriceIcon(label: string, active: boolean) {
  return L.divIcon({
    className: "kst-price-wrap",
    html: `<div class="kst-price ${active ? "kst-price--active" : ""}">${label}</div>`,
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
  hoveredId,
  onHoverChange,
  onMarkerClick,
  onBoundsChange,
  onUserMoved,
}: {
  items: Listing[];
  hoveredId: string | null;
  onHoverChange?: (id: string | null) => void;
  onMarkerClick?: (id: string) => void;
  onBoundsChange?: (b: ViewBounds) => void;
  onUserMoved?: () => void;
}) {
  const { currency } = useCurrency();
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
        const active = hoveredId === l.id;
        const allIn = totalGuestPriceKRW(l.pricePerNightKRW);
        const label = formatMainCompactFromKRW(allIn, currency);

        return (
          <Marker
            key={l.id}
            position={[l.lat, l.lng]}
            icon={makePriceIcon(label, active)}
            eventHandlers={{
              mouseover: () => onHoverChange?.(l.id),
              mouseout: () => onHoverChange?.(null),
              click: () => onMarkerClick?.(l.id),
            }}
          >
            <Popup>
              <div style={{ fontSize: 12, lineHeight: 1.3 }}>
                <div style={{ fontWeight: 800 }}>{l.location}</div>
                <div>{l.title}</div>
                <div style={{ marginTop: 6, fontWeight: 800 }}>
                  {label} / night{" "}
                  <span style={{ opacity: 0.7 }}> (≈ {formatKRW(allIn)})</span>
                </div>
                <div style={{ marginTop: 4, fontSize: 11, opacity: 0.75 }}>
                  Tax & Service Fee Included
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
