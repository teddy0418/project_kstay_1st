"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
const DEFAULT_CENTER: [number, number] = [37.5665, 126.978];

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
      <Marker position={position} />
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
