"use client";

import { useEffect, useMemo } from "react";
import type { Listing } from "@/types";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { formatKRW } from "@/lib/format";

function FitBounds({ items }: { items: Listing[] }) {
  const map = useMap();

  const bounds = useMemo(() => {
    const pts = items
      .filter((i) => Number.isFinite(i.lat) && Number.isFinite(i.lng))
      .map((i) => [i.lat, i.lng] as [number, number]);
    if (pts.length === 0) return null;
    const b = L.latLngBounds(pts);
    return b.isValid() ? b : null;
  }, [items]);

  useEffect(() => {
    if (!bounds) return;
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [bounds, map]);

  return null;
}

function makeIcon(active: boolean) {
  return L.divIcon({
    className: "kst-marker-wrap",
    html: `<div class="kst-marker ${active ? "kst-marker--active" : ""}"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

export default function LeafletMap({
  items,
  hoveredId,
  onHoverChange,
}: {
  items: Listing[];
  hoveredId: string | null;
  onHoverChange?: (id: string | null) => void;
}) {
  const center = useMemo<[number, number]>(() => [36.5, 127.8], []);

  return (
    <MapContainer center={center} zoom={7} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
      />

      <FitBounds items={items} />

      {items.map((l) => {
        const active = hoveredId === l.id;
        return (
          <Marker
            key={l.id}
            position={[l.lat, l.lng]}
            icon={makeIcon(active)}
            eventHandlers={{
              mouseover: () => onHoverChange?.(l.id),
              mouseout: () => onHoverChange?.(null),
            }}
          >
            <Popup>
              <div style={{ fontSize: 12, lineHeight: 1.3 }}>
                <div style={{ fontWeight: 700 }}>{l.location}</div>
                <div>{l.title}</div>
                <div style={{ marginTop: 6, fontWeight: 700 }}>
                  {formatKRW(l.pricePerNightKRW)} / night
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
