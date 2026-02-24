'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import {
  Users,
  MapPin,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  Database,
  Pencil,
  Check,
  X,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  ResidentMapData,
  ResidentMarker,
  MapFilters,
  MapStats,
  GeocodeCache,
  GeocodeResult,
} from '@/types/residents-map';

const ResidentsLeafletMap = dynamic(
  () => import('@/components/organisms/admin/residents-leaflet-map'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[350px] w-full items-center justify-center rounded-lg bg-muted md:h-[500px]">
        <div className="text-center text-muted-foreground">
          <MapPin className="mx-auto mb-2 h-8 w-8" />
          <p className="text-sm">Caricamento mappa...</p>
        </div>
      </div>
    ),
  }
);

const CACHE_KEY_PREFIX = 'geocode_v3_';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const GEOCODE_DELAY = 1100; // 1.1 seconds between Nominatim requests

// Bounding box covering Prato Rinaldo / San Cesareo / Zagarolo area
// Format: lon_min,lat_max,lon_max,lat_min
const PRATO_RINALDO_VIEWBOX = '12.70,41.88,12.85,41.80';

const MUNICIPALITY_LABELS: Record<string, string> = {
  san_cesareo: 'San Cesareo',
  zagarolo: 'Zagarolo',
};

// --- Utility functions ---

function getAddressKey(resident: ResidentMapData): string {
  return [
    resident.street?.trim().toLowerCase(),
    resident.street_number?.trim(),
    resident.zip_code?.trim(),
    resident.municipality?.trim().toLowerCase(),
  ].filter(Boolean).join('|');
}

/** Clean "snc" (senza numero civico) and similar from street numbers */
function cleanStreetNumber(streetNumber: string | null): string | null {
  if (!streetNumber) return null;
  const cleaned = streetNumber.trim().toLowerCase();
  if (['snc', 's.n.c.', 's.n.c', 'sn', '-'].includes(cleaned)) return null;
  return streetNumber.trim();
}

interface GeoStrategy {
  params: URLSearchParams;
  label: string;
  provider?: 'nominatim' | 'photon';
}

// Prato Rinaldo center for Photon location bias
const PRATO_RINALDO_CENTER = { lat: '41.854', lon: '12.749' };

/**
 * Build multiple geocoding strategies with fallbacks.
 * 1: Nominatim structured (street+number, city, country) with viewbox bounded
 * 2: Nominatim structured without house number with viewbox bounded
 * 3: Photon API with location bias (different search engine, same OSM data)
 * 4: Nominatim free-form with viewbox preference
 */
function buildGeocodeStrategies(resident: ResidentMapData): GeoStrategy[] {
  const strategies: GeoStrategy[] = [];
  const streetNumber = cleanStreetNumber(resident.street_number);
  const street = resident.street?.trim() || '';
  const city = MUNICIPALITY_LABELS[resident.municipality || ''] || '';

  if (!street) return strategies;

  const baseStructured = {
    format: 'json', limit: '1', countrycodes: 'it',
    viewbox: PRATO_RINALDO_VIEWBOX, bounded: '1',
  };

  // Strategy 1: Nominatim structured with house number + city (NO postalcode)
  {
    const streetValue = streetNumber ? `${streetNumber} ${street}` : street;
    const params = new URLSearchParams(baseStructured);
    params.set('street', streetValue);
    if (city) params.set('city', city);
    params.set('country', 'Italy');
    strategies.push({ params, label: 'Strutturata' });
  }

  // Strategy 2: Nominatim structured without house number (wider match)
  if (streetNumber) {
    const params = new URLSearchParams(baseStructured);
    params.set('street', street);
    if (city) params.set('city', city);
    params.set('country', 'Italy');
    strategies.push({ params, label: 'Senza civico' });
  }

  // Strategy 3: Photon API with Prato Rinaldo location bias
  {
    const queryParts = [street, streetNumber, city, 'Italia'].filter(Boolean);
    strategies.push({
      params: new URLSearchParams({
        q: queryParts.join(', '),
        lang: 'it',
        lat: PRATO_RINALDO_CENTER.lat,
        lon: PRATO_RINALDO_CENTER.lon,
        limit: '1',
      }),
      label: 'Photon',
      provider: 'photon',
    });
  }

  // Strategy 4: Nominatim free-form with viewbox preference (not bounded)
  {
    const queryParts = [street, streetNumber, city, 'Roma', 'Lazio'].filter(Boolean);
    const params = new URLSearchParams({
      format: 'json', limit: '1', countrycodes: 'it',
      viewbox: PRATO_RINALDO_VIEWBOX,
    });
    params.set('q', queryParts.join(', '));
    strategies.push({ params, label: 'Libera' });
  }

  return strategies;
}

function formatParamsForDisplay(params: URLSearchParams): string {
  const parts: string[] = [];
  if (params.get('street')) parts.push(`street=${params.get('street')}`);
  if (params.get('city')) parts.push(`city=${params.get('city')}`);
  if (params.get('postalcode')) parts.push(`postalcode=${params.get('postalcode')}`);
  if (params.get('q')) parts.push(`q=${params.get('q')}`);
  if (params.get('bounded')) parts.push('bounded');
  return parts.join(' | ');
}

function getCachedGeocode(key: string): GeocodeCache | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY_PREFIX + key);
    if (!raw) return null;
    const cached = JSON.parse(raw) as GeocodeCache;
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_KEY_PREFIX + key);
      return null;
    }
    return cached;
  } catch {
    return null;
  }
}

function setCachedGeocode(key: string, lat: number, lon: number): void {
  try {
    const data: GeocodeCache = { lat, lon, timestamp: Date.now() };
    sessionStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(data));
  } catch {
    // sessionStorage full or unavailable
  }
}

function removeCachedGeocode(key: string): void {
  try {
    sessionStorage.removeItem(CACHE_KEY_PREFIX + key);
  } catch {
    // ignore
  }
}

async function geocodeAddress(params: URLSearchParams): Promise<{
  coords: { lat: number; lon: number } | null;
  error?: string;
  queryString: string;
}> {
  const queryString = params.toString();
  try {
    const url = `https://nominatim.openstreetmap.org/search?${queryString}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'PratoRinaldoCommunity/1.0' },
    });
    if (!res.ok) {
      return { coords: null, error: `HTTP ${res.status} ${res.statusText}`, queryString };
    }
    const data = await res.json();
    if (data.length === 0) {
      return { coords: null, error: 'Nessun risultato trovato', queryString };
    }
    return {
      coords: { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) },
      queryString,
    };
  } catch (err) {
    return {
      coords: null,
      error: err instanceof Error ? err.message : 'Errore di rete',
      queryString,
    };
  }
}

async function geocodePhoton(params: URLSearchParams): Promise<{
  coords: { lat: number; lon: number } | null;
  error?: string;
  queryString: string;
}> {
  const queryString = params.toString();
  try {
    const url = `https://photon.komoot.io/api?${queryString}`;
    const res = await fetch(url);
    if (!res.ok) {
      return { coords: null, error: `HTTP ${res.status} ${res.statusText}`, queryString };
    }
    const data = await res.json();
    if (!data.features?.length) {
      return { coords: null, error: 'Nessun risultato trovato', queryString };
    }
    // Photon returns GeoJSON: coordinates are [lon, lat]
    const [lon, lat] = data.features[0].geometry.coordinates;
    return { coords: { lat, lon }, queryString };
  } catch (err) {
    return {
      coords: null,
      error: err instanceof Error ? err.message : 'Errore di rete',
      queryString,
    };
  }
}

function delayMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Try multiple geocoding strategies in order, return first success */
async function geocodeWithFallbacks(
  strategies: GeoStrategy[]
): Promise<{
  coords: { lat: number; lon: number } | null;
  error?: string;
  queryDisplay: string;
}> {
  const errors: string[] = [];

  for (let i = 0; i < strategies.length; i++) {
    const { params, label } = strategies[i];
    const result = await geocodeAddress(params);

    if (result.coords) {
      return {
        coords: result.coords,
        queryDisplay: `[${i + 1}/${strategies.length} ${label}] ${formatParamsForDisplay(params)}`,
      };
    }

    errors.push(`${label}: ${result.error || 'Nessun risultato'}`);

    // Rate limit between strategy attempts
    if (i < strategies.length - 1) {
      await delayMs(GEOCODE_DELAY);
    }
  }

  // All strategies failed
  const lastParams = strategies[strategies.length - 1].params;
  return {
    coords: null,
    error: errors.join(' \u2192 '),
    queryDisplay: `[${strategies.length}/${strategies.length}] ${formatParamsForDisplay(lastParams)}`,
  };
}

// --- Component ---

interface ResidentsMapClientProps {
  residents: ResidentMapData[];
  error?: string;
}

export function ResidentsMapClient({ residents, error }: ResidentsMapClientProps) {
  const [markers, setMarkers] = React.useState<ResidentMarker[]>([]);
  const [geocodeResults, setGeocodeResults] = React.useState<GeocodeResult[]>([]);
  const [isGeocoding, setIsGeocoding] = React.useState(false);
  const [isRetrying, setIsRetrying] = React.useState<string | null>(null);
  const [geocodeProgress, setGeocodeProgress] = React.useState({ current: 0, total: 0 });
  const [stats, setStats] = React.useState<MapStats>({
    totalResidents: residents.length,
    geocoded: 0,
    failed: 0,
    sanCesareo: residents.filter(r => r.municipality === 'san_cesareo').length,
    zagarolo: residents.filter(r => r.municipality === 'zagarolo').length,
  });
  const [filters, setFilters] = React.useState<MapFilters>({
    municipality: 'all',
    membershipType: 'all',
    verificationStatus: 'all',
  });
  const [debugOpen, setDebugOpen] = React.useState(false);
  const geocodingRef = React.useRef(false);

  // Filter residents based on current filters
  const filteredResidents = React.useMemo(() => {
    return residents.filter((r) => {
      if (filters.municipality !== 'all' && r.municipality !== filters.municipality) return false;
      if (filters.membershipType !== 'all' && r.membership_type !== filters.membershipType) return false;
      if (filters.verificationStatus !== 'all' && r.verification_status !== filters.verificationStatus) return false;
      return true;
    });
  }, [residents, filters]);

  // Filter markers to match current filters
  const filteredMarkers = React.useMemo(() => {
    const filteredIds = new Set(filteredResidents.map(r => r.id));
    return markers.filter(m => filteredIds.has(m.resident.id));
  }, [markers, filteredResidents]);

  // Build markers from geocode results
  const rebuildMarkers = React.useCallback((results: GeocodeResult[]) => {
    const newMarkers: ResidentMarker[] = [];
    for (const result of results) {
      if (result.coords) {
        for (let j = 0; j < result.residents.length; j++) {
          const offset = j * 0.00005;
          newMarkers.push({
            resident: result.residents[j],
            position: [result.coords.lat + offset, result.coords.lon + offset],
          });
        }
      }
    }
    setMarkers(newMarkers);

    const geocoded = results
      .filter(r => r.status === 'success' || r.status === 'cached')
      .reduce((sum, r) => sum + r.residents.length, 0);
    const failed = results
      .filter(r => r.status === 'error')
      .reduce((sum, r) => sum + r.residents.length, 0);
    setStats(prev => ({ ...prev, geocoded, failed }));
  }, []);

  // Geocode all unique addresses on mount
  React.useEffect(() => {
    if (residents.length === 0 || geocodingRef.current) return;
    geocodingRef.current = true;

    async function geocodeAll() {
      setIsGeocoding(true);

      // Group residents by unique address
      const addressGroups = new Map<string, ResidentMapData[]>();
      for (const resident of residents) {
        const key = getAddressKey(resident);
        if (!key) continue;
        const group = addressGroups.get(key) || [];
        group.push(resident);
        addressGroups.set(key, group);
      }

      const uniqueAddresses = Array.from(addressGroups.entries());
      setGeocodeProgress({ current: 0, total: uniqueAddresses.length });

      const results: GeocodeResult[] = uniqueAddresses.map(([key, resAtAddr]) => ({
        addressKey: key,
        residents: resAtAddr,
        query: '',
        status: 'pending' as const,
        coords: null,
      }));
      setGeocodeResults([...results]);

      for (let i = 0; i < uniqueAddresses.length; i++) {
        const [addressKey, residentsAtAddress] = uniqueAddresses[i];
        const strategies = buildGeocodeStrategies(residentsAtAddress[0]);

        // Check cache first
        const cached = getCachedGeocode(addressKey);
        if (cached) {
          const display = strategies.length > 0
            ? formatParamsForDisplay(strategies[0].params)
            : '—';
          results[i] = {
            ...results[i],
            query: display,
            status: 'cached',
            coords: { lat: cached.lat, lon: cached.lon },
          };
        } else if (strategies.length > 0) {
          const result = await geocodeWithFallbacks(strategies);
          if (result.coords) {
            setCachedGeocode(addressKey, result.coords.lat, result.coords.lon);
            results[i] = {
              ...results[i],
              query: result.queryDisplay,
              status: 'success',
              coords: result.coords,
            };
          } else {
            results[i] = {
              ...results[i],
              query: result.queryDisplay,
              status: 'error',
              coords: null,
              errorDetail: result.error,
            };
          }

          // Rate limit before next address
          if (i < uniqueAddresses.length - 1) {
            await delayMs(GEOCODE_DELAY);
          }
        }

        setGeocodeProgress({ current: i + 1, total: uniqueAddresses.length });
        setGeocodeResults([...results]);
        rebuildMarkers(results);
      }

      setIsGeocoding(false);
    }

    geocodeAll();
  }, [residents, rebuildMarkers]);

  // Retry a single address
  const retryGeocode = React.useCallback(async (addressKey: string) => {
    setIsRetrying(addressKey);

    const resultIndex = geocodeResults.findIndex(r => r.addressKey === addressKey);
    if (resultIndex === -1) {
      setIsRetrying(null);
      return;
    }

    const entry = geocodeResults[resultIndex];
    removeCachedGeocode(addressKey);

    const strategies = buildGeocodeStrategies(entry.residents[0]);
    if (strategies.length === 0) {
      setIsRetrying(null);
      return;
    }

    const result = await geocodeWithFallbacks(strategies);

    const updatedResults = [...geocodeResults];
    if (result.coords) {
      setCachedGeocode(addressKey, result.coords.lat, result.coords.lon);
      updatedResults[resultIndex] = {
        ...entry,
        query: result.queryDisplay,
        status: 'success',
        coords: result.coords,
        errorDetail: undefined,
      };
    } else {
      updatedResults[resultIndex] = {
        ...entry,
        query: result.queryDisplay,
        status: 'error',
        coords: null,
        errorDetail: result.error,
      };
    }

    setGeocodeResults(updatedResults);
    rebuildMarkers(updatedResults);
    setIsRetrying(null);
  }, [geocodeResults, rebuildMarkers]);

  // Retry all failed
  const retryAllFailed = React.useCallback(async () => {
    const failedIndices = geocodeResults
      .map((r, i) => r.status === 'error' ? i : -1)
      .filter(i => i !== -1);

    if (failedIndices.length === 0) return;

    setIsGeocoding(true);
    setGeocodeProgress({ current: 0, total: failedIndices.length });

    const updatedResults = [...geocodeResults];

    for (let i = 0; i < failedIndices.length; i++) {
      const idx = failedIndices[i];
      const entry = updatedResults[idx];
      removeCachedGeocode(entry.addressKey);

      const strategies = buildGeocodeStrategies(entry.residents[0]);
      if (strategies.length === 0) continue;

      const result = await geocodeWithFallbacks(strategies);

      if (result.coords) {
        setCachedGeocode(entry.addressKey, result.coords.lat, result.coords.lon);
        updatedResults[idx] = {
          ...entry,
          query: result.queryDisplay,
          status: 'success',
          coords: result.coords,
          errorDetail: undefined,
        };
      } else {
        updatedResults[idx] = {
          ...entry,
          query: result.queryDisplay,
          status: 'error',
          coords: null,
          errorDetail: result.error,
        };
      }

      setGeocodeProgress({ current: i + 1, total: failedIndices.length });
      setGeocodeResults([...updatedResults]);
      rebuildMarkers(updatedResults);

      if (i < failedIndices.length - 1) {
        await delayMs(GEOCODE_DELAY);
      }
    }

    setIsGeocoding(false);
  }, [geocodeResults, rebuildMarkers]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (residents.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nessun residente con indirizzo trovato. Gli utenti devono completare l&apos;onboarding con i dati di residenza.
        </AlertDescription>
      </Alert>
    );
  }

  const progressPercent = geocodeProgress.total > 0
    ? Math.round((geocodeProgress.current / geocodeProgress.total) * 100)
    : 0;

  const failedCount = geocodeResults.filter(r => r.status === 'error').length;
  const successCount = geocodeResults.filter(r => r.status === 'success' || r.status === 'cached').length;

  return (
    <div className="space-y-4">
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Totale Residenti"
          value={stats.totalResidents}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          label="Geocodificati"
          value={stats.geocoded}
          icon={<CheckCircle className="h-4 w-4 text-green-500" />}
        />
        <StatCard
          label="San Cesareo"
          value={stats.sanCesareo}
          icon={<MapPin className="h-4 w-4 text-green-500" />}
        />
        <StatCard
          label="Zagarolo"
          value={stats.zagarolo}
          icon={<MapPin className="h-4 w-4 text-blue-500" />}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap gap-3 p-4">
          <Select
            value={filters.municipality}
            onValueChange={(v) => setFilters(prev => ({ ...prev, municipality: v as MapFilters['municipality'] }))}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Comune" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i comuni</SelectItem>
              <SelectItem value="san_cesareo">San Cesareo</SelectItem>
              <SelectItem value="zagarolo">Zagarolo</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.membershipType}
            onValueChange={(v) => setFilters(prev => ({ ...prev, membershipType: v as MapFilters['membershipType'] }))}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i tipi</SelectItem>
              <SelectItem value="resident">Residente</SelectItem>
              <SelectItem value="domiciled">Domiciliato</SelectItem>
              <SelectItem value="landowner">Proprietario</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.verificationStatus}
            onValueChange={(v) => setFilters(prev => ({ ...prev, verificationStatus: v as MapFilters['verificationStatus'] }))}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Stato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli stati</SelectItem>
              <SelectItem value="approved">Verificato</SelectItem>
              <SelectItem value="pending">In Attesa</SelectItem>
              <SelectItem value="rejected">Rifiutato</SelectItem>
            </SelectContent>
          </Select>

          {filteredResidents.length !== residents.length && (
            <span className="flex items-center text-sm text-muted-foreground">
              {filteredMarkers.length} di {markers.length} sulla mappa
            </span>
          )}
        </CardContent>
      </Card>

      {/* Geocoding progress */}
      {isGeocoding && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Geocodifica in corso...
              </span>
              <span className="text-sm font-medium">
                {geocodeProgress.current}/{geocodeProgress.total} ({progressPercent}%)
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
          San Cesareo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-blue-500" />
          Zagarolo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-gray-400" />
          Altro
        </span>
        {stats.failed > 0 && (
          <span className="text-destructive">
            {stats.failed} indirizzi non trovati
          </span>
        )}
      </div>

      {/* Map */}
      <Card>
        <CardContent className="p-0 overflow-hidden rounded-lg">
          <ResidentsLeafletMap markers={filteredMarkers} />
        </CardContent>
      </Card>

      {/* Debug geocoding table */}
      {geocodeResults.length > 0 && (
        <Collapsible open={debugOpen} onOpenChange={setDebugOpen}>
          <Card>
            <CardHeader className="pb-3">
              <CollapsibleTrigger asChild>
                <button className="flex w-full items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Database className="h-4 w-4" />
                    Dettaglio Geocodifica
                    <Badge variant="outline" className="ml-1 font-normal">
                      {successCount} ok / {failedCount} errori
                    </Badge>
                  </CardTitle>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${debugOpen ? 'rotate-180' : ''}`} />
                </button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-0">
                {failedCount > 0 && (
                  <div className="mb-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={retryAllFailed}
                      disabled={isGeocoding}
                    >
                      <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isGeocoding ? 'animate-spin' : ''}`} />
                      Riprova tutti i falliti ({failedCount})
                    </Button>
                  </div>
                )}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Residenti</TableHead>
                        <TableHead>Indirizzo</TableHead>
                        <TableHead className="hidden lg:table-cell">Query Nominatim</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead className="hidden md:table-cell">Coordinate</TableHead>
                        <TableHead className="w-[80px]">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {geocodeResults.map((result) => {
                        const firstResident = result.residents[0];
                        const address = [
                          firstResident.street,
                          firstResident.street_number,
                        ].filter(Boolean).join(' ');
                        const location = [
                          firstResident.zip_code,
                          MUNICIPALITY_LABELS[firstResident.municipality || ''],
                        ].filter(Boolean).join(' - ');

                        return (
                          <TableRow key={result.addressKey}>
                            <TableCell>
                              <div className="text-sm font-medium">
                                {result.residents.map(r => r.name || r.email || 'N/A').join(', ')}
                              </div>
                              {result.residents.length > 1 && (
                                <div className="text-xs text-muted-foreground">
                                  {result.residents.length} residenti
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{address}</div>
                              <div className="text-xs text-muted-foreground">{location}</div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <code className="text-xs text-muted-foreground break-all">
                                {result.query || '—'}
                              </code>
                            </TableCell>
                            <TableCell>
                              <GeocodeStatusBadge status={result.status} errorDetail={result.errorDetail} />
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {result.coords ? (
                                <code className="text-xs">
                                  {result.coords.lat.toFixed(5)}, {result.coords.lon.toFixed(5)}
                                </code>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => retryGeocode(result.addressKey)}
                                disabled={isGeocoding || isRetrying === result.addressKey}
                              >
                                <RefreshCw className={`h-3.5 w-3.5 ${isRetrying === result.addressKey ? 'animate-spin' : ''}`} />
                                <span className="sr-only">Riprova</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
}

// --- Sub-components ---

function GeocodeStatusBadge({ status, errorDetail }: { status: GeocodeResult['status']; errorDetail?: string }) {
  switch (status) {
    case 'success':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">OK</Badge>;
    case 'cached':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Cache</Badge>;
    case 'error':
      return (
        <div>
          <Badge variant="destructive">Errore</Badge>
          {errorDetail && (
            <p className="mt-0.5 text-[10px] text-destructive">{errorDetail}</p>
          )}
        </div>
      );
    case 'pending':
      return <Badge variant="secondary">In attesa</Badge>;
    default:
      return null;
  }
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {icon}
          {label}
        </div>
        <p className="mt-1 text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
