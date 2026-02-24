'use client';

import * as React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { ResidentMarker } from '@/types/residents-map';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

// Prato Rinaldo center coordinates
const PRATO_RINALDO_CENTER: [number, number] = [41.835, 12.805];
const DEFAULT_ZOOM = 14;

const MEMBERSHIP_LABELS: Record<string, string> = {
  resident: 'Residente',
  domiciled: 'Domiciliato',
  landowner: 'Proprietario',
};

const MUNICIPALITY_LABELS: Record<string, string> = {
  san_cesareo: 'San Cesareo',
  zagarolo: 'Zagarolo',
};

function createMarkerIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 24px; height: 24px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
}

const greenIcon = createMarkerIcon('#22c55e');
const blueIcon = createMarkerIcon('#3b82f6');
const grayIcon = createMarkerIcon('#9ca3af');

function getMarkerIcon(municipality: string | null): L.DivIcon {
  if (municipality === 'san_cesareo') return greenIcon;
  if (municipality === 'zagarolo') return blueIcon;
  return grayIcon;
}

function getInitials(name: string | null, email: string | null): string {
  if (name) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
  return email?.charAt(0).toUpperCase() || 'U';
}

function FitBounds({ markers }: { markers: ResidentMarker[] }) {
  const map = useMap();

  React.useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => m.position));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [markers, map]);

  return null;
}

interface ResidentsLeafletMapProps {
  markers: ResidentMarker[];
}

export default function ResidentsLeafletMap({ markers }: ResidentsLeafletMapProps) {
  return (
    <MapContainer
      center={PRATO_RINALDO_CENTER}
      zoom={DEFAULT_ZOOM}
      className="h-[350px] w-full rounded-lg md:h-[500px]"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds markers={markers} />
      {markers.map((marker) => {
        const { resident } = marker;
        const address = [
          resident.street,
          resident.street_number,
        ].filter(Boolean).join(' ');
        const location = [
          resident.zip_code,
          MUNICIPALITY_LABELS[resident.municipality || ''] || resident.municipality,
        ].filter(Boolean).join(' - ');

        return (
          <Marker
            key={resident.id}
            position={marker.position}
            icon={getMarkerIcon(resident.municipality)}
          >
            <Popup minWidth={220} maxWidth={280}>
              <div className="flex flex-col gap-2 p-1">
                <div className="flex items-center gap-2">
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarImage src={resident.avatar || undefined} alt={resident.name || ''} />
                    <AvatarFallback className="text-xs">
                      {getInitials(resident.name, resident.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {resident.name || 'Senza nome'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {resident.email}
                    </p>
                  </div>
                </div>

                {address && (
                  <p className="text-xs">
                    {address}
                    {location && <span className="text-muted-foreground"><br />{location}</span>}
                  </p>
                )}

                <div className="flex flex-wrap gap-1">
                  {resident.membership_type && (
                    <Badge variant="secondary" className="text-[10px]">
                      {MEMBERSHIP_LABELS[resident.membership_type] || resident.membership_type}
                    </Badge>
                  )}
                  {resident.household_size && (
                    <Badge variant="outline" className="text-[10px]">
                      Nucleo: {resident.household_size}
                    </Badge>
                  )}
                </div>

                {(resident.has_minors || resident.has_seniors) && (
                  <div className="flex flex-wrap gap-1">
                    {resident.has_minors && resident.minors_count && (
                      <Badge variant="outline" className="text-[10px]">
                        Minori: {resident.minors_count}
                      </Badge>
                    )}
                    {resident.has_seniors && resident.seniors_count && (
                      <Badge variant="outline" className="text-[10px]">
                        Anziani: {resident.seniors_count}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
