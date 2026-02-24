export interface ResidentMapData {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  phone: string | null;
  membership_type: string | null;
  street: string | null;
  street_number: string | null;
  zip_code: string | null;
  municipality: string | null;
  household_size: number | null;
  has_minors: boolean | null;
  minors_count: number | null;
  has_seniors: boolean | null;
  seniors_count: number | null;
  verification_status: string;
}

export interface GeocodedAddress {
  lat: number;
  lon: number;
  displayName: string;
}

export interface ResidentMarker {
  resident: ResidentMapData;
  position: [number, number];
}

export interface MapStats {
  totalResidents: number;
  geocoded: number;
  failed: number;
  sanCesareo: number;
  zagarolo: number;
}

export interface MapFilters {
  municipality: 'all' | 'san_cesareo' | 'zagarolo';
  membershipType: 'all' | 'resident' | 'domiciled' | 'landowner';
  verificationStatus: 'all' | 'approved' | 'pending' | 'rejected';
}

export interface GeocodeCache {
  lat: number;
  lon: number;
  timestamp: number;
}

export interface GeocodeResult {
  addressKey: string;
  residents: ResidentMapData[];
  query: string;
  status: 'pending' | 'success' | 'error' | 'cached' | 'manual';
  coords: { lat: number; lon: number } | null;
  errorDetail?: string;
}
