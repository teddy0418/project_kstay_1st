"use client";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";

/**
 * 위치 선택용 단일 마커 아이콘.
 * 커스텀 이미지(캐릭터/로고)로 바꾸려면:
 * 1) public 폴더에 이미지 추가 (예: public/icons/map-marker.png)
 * 2) 아래를 L.icon({ iconUrl: '/icons/map-marker.png', iconSize: [40, 40], iconAnchor: [20, 40] }) 로 교체
 */
const LOCATION_MARKER_ICON = L.divIcon({
  className: "kst-location-marker-wrap",
  html: `<div class="kst-location-marker" aria-hidden="true"><span class="kst-location-marker-pin">📍</span></div>`,
  iconSize: [32, 40],
  iconAnchor: [16, 40],
});

function SetViewOnChange({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export default function LocationMap({
  lat,
  lng,
  disabled,
  onSelect,
}: {
  lat: number;
  lng: number;
  disabled?: boolean;
  onSelect: (lat: number, lng: number) => void;
}) {
  const position: [number, number] = [lat, lng];

  return (
    <MapContainer
      center={position}
      zoom={14}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
      />
      <Marker position={position} icon={LOCATION_MARKER_ICON} />
      <SetViewOnChange lat={lat} lng={lng} />
      {!disabled && <MapClickHandler onSelect={onSelect} />}
    </MapContainer>
  );
}

function MapClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e: { latlng: { lat: number; lng: number } }) => {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}
