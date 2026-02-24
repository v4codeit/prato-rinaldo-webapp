'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Euro, Info, Tag } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
  MERCATINO_CONDITION,
  MERCATINO_CONDITION_LABELS,
} from '@/lib/utils/constants';
import { getCategories, type Category } from '@/app/actions/categories';

// Extended category type for UI
interface MercatinoCategory extends Category {}

// Base data interface (shared fields)
interface WizardStep2BaseData {
  title: string;
  description: string;
  categoryId?: string;          // Categoria principale
  subcategoryId?: string;       // Sottocategoria (questo va nel DB)
  customCategoryText?: string;  // Input custom se "Altro" selezionato
  isPrivate: boolean;
}

// Object-specific data
export interface WizardStep2ObjectData extends WizardStep2BaseData {
  price: number;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
}

// Real estate-specific data
export interface WizardStep2RealEstateData extends WizardStep2BaseData {
  price: number;
  squareMeters: number;
  rooms: number;
  floor?: number;
  hasElevator?: boolean;
  hasGarage?: boolean;
  constructionYear?: number;
  addressZone?: string;
}

// Props interfaces
interface WizardStep2ObjectProps {
  data?: Partial<WizardStep2ObjectData>;
  objectType?: 'sale' | 'gift' | null;
  onChange: (data: Partial<WizardStep2ObjectData>) => void;
}

interface WizardStep2RealEstateProps {
  data?: Partial<WizardStep2RealEstateData>;
  realEstateType?: 'rent' | 'sale' | null;
  onChange: (data: Partial<WizardStep2RealEstateData>) => void;
}

/**
 * Step 2 for Objects (Vendita/Regalo)
 */
export function WizardStep2Object({
  data,
  objectType,
  onChange,
}: WizardStep2ObjectProps) {
  const isGift = objectType === 'gift';
  const [mainCategories, setMainCategories] = React.useState<MercatinoCategory[]>([]);
  const [subcategories, setSubcategories] = React.useState<MercatinoCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = React.useState(true);
  const [loadingSubcategories, setLoadingSubcategories] = React.useState(false);

  // Track if hierarchical categories are available
  const [isHierarchical, setIsHierarchical] = React.useState(true);

  // Fetch main categories on mount
  // Try hierarchical first, fall back to flat if not available
  React.useEffect(() => {
    async function fetchMainCategories() {
      try {
        // First try hierarchical query
        const { categories: cats } = await getCategories('marketplace_item', {
          macroType: 'objects',
          parentId: null,
        });

        // If we got categories with macro_type set, hierarchical is available
        if (cats && cats.length > 0 && cats[0].macro_type) {
          setMainCategories(cats);
          setIsHierarchical(true);
        } else {
          // Fall back to flat categories (old behavior)
          const { categories: flatCats } = await getCategories('marketplace_item');
          setMainCategories(flatCats || []);
          setIsHierarchical(false);
        }
      } catch (error) {
        console.error('Error fetching main categories:', error);
        // Try flat categories as fallback
        try {
          const { categories: flatCats } = await getCategories('marketplace_item');
          setMainCategories(flatCats || []);
          setIsHierarchical(false);
        } catch {
          setMainCategories([]);
        }
      } finally {
        setLoadingCategories(false);
      }
    }
    fetchMainCategories();
  }, []);

  // Fetch subcategories when main category changes (only if hierarchical)
  React.useEffect(() => {
    async function fetchSubcategories() {
      // Skip if not hierarchical mode or no category selected
      if (!isHierarchical || !data?.categoryId) {
        setSubcategories([]);
        return;
      }

      setLoadingSubcategories(true);
      try {
        const { categories: subs } = await getCategories('marketplace_item', {
          macroType: 'objects',
          parentId: data.categoryId,
        });
        setSubcategories(subs || []);

        // Reset subcategoryId if not in new list
        if (data.subcategoryId && !subs.find((s) => s.id === data.subcategoryId)) {
          onChange({ subcategoryId: undefined });
        }
      } catch (error) {
        console.error('Error fetching subcategories:', error);
        setSubcategories([]);
      } finally {
        setLoadingSubcategories(false);
      }
    }
    fetchSubcategories();
  }, [data?.categoryId, isHierarchical]);

  // Check if current main category allows custom input
  const selectedMainCategory = mainCategories.find((c) => c.id === data?.categoryId);
  const allowsCustomInput = selectedMainCategory?.custom_input_allowed ?? false;

  return (
    <div className="space-y-6">
      {/* Main Category Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Categoria <span className="text-red-500">*</span>
        </Label>
        {loadingCategories ? (
          <div className="flex gap-2 flex-wrap">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-24 rounded-full" />
            ))}
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {mainCategories.map((category) => (
              <Badge
                key={category.id}
                className={cn(
                  'rounded-full px-4 py-2 text-sm cursor-pointer transition-all',
                  data?.categoryId === category.id
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                )}
                onClick={() => {
                  onChange({ categoryId: category.id, subcategoryId: undefined, customCategoryText: undefined });
                }}
              >
                {category.icon && <span className="mr-1">{category.icon}</span>}
                {category.name}
              </Badge>
            ))}
          </div>
        )}
        {!loadingCategories && !data?.categoryId && (
          <p className="text-xs text-destructive">
            Seleziona una categoria per continuare
          </p>
        )}
      </div>

      {/* Subcategory Selection (only if hierarchical mode, category selected, and not custom input) */}
      {isHierarchical && data?.categoryId && !allowsCustomInput && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Sottocategoria <span className="text-red-500">*</span>
          </Label>
          {loadingSubcategories ? (
            <Skeleton className="h-12 w-full rounded-xl" />
          ) : subcategories.length > 0 ? (
            <Select
              value={data?.subcategoryId || ''}
              onValueChange={(value) => onChange({ subcategoryId: value })}
            >
              <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white">
                <SelectValue placeholder="Seleziona una sottocategoria" />
              </SelectTrigger>
              <SelectContent>
                {subcategories.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-xs text-slate-500 italic">
              Nessuna sottocategoria disponibile per questa categoria
            </p>
          )}
          {!loadingSubcategories && subcategories.length > 0 && !data?.subcategoryId && (
            <p className="text-xs text-destructive">
              Seleziona una sottocategoria per continuare
            </p>
          )}
        </div>
      )}

      {/* Custom Input (only if "Altro" category selected) */}
      {allowsCustomInput && (
        <div className="space-y-2">
          <Label htmlFor="custom-category" className="text-sm font-medium">
            Specifica la categoria <span className="text-red-500">*</span>
          </Label>
          <Input
            id="custom-category"
            value={data?.customCategoryText || ''}
            onChange={(e) => onChange({ customCategoryText: e.target.value })}
            placeholder="Es: Giochi da tavolo, Strumenti musicali..."
            className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all"
            maxLength={100}
          />
          {data?.customCategoryText && data.customCategoryText.length < 3 && (
            <p className="text-xs text-destructive">
              Minimo 3 caratteri richiesti
            </p>
          )}
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium">
          Titolo dell'annuncio <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          value={data?.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Es: iPhone 13 Pro Max 256GB"
          className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all"
          maxLength={100}
        />
        <p className="text-xs text-slate-500">
          {(data?.title?.length || 0)}/100 caratteri
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Descrizione <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          value={data?.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Descrivi il tuo oggetto in dettaglio: marca, modello, condizioni, eventuali difetti..."
          className="min-h-[120px] rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all p-4 resize-none"
          maxLength={2000}
        />
        <p className="text-xs text-slate-500">
          {(data?.description?.length || 0)}/2000 caratteri
        </p>
      </div>

      {/* Price (only for sale) */}
      {!isGift && (
        <div className="space-y-2">
          <Label htmlFor="price" className="text-sm font-medium">
            Prezzo <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              id="price"
              type="number"
              min={0}
              step={0.01}
              value={data?.price || ''}
              onChange={(e) => onChange({ price: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              className="rounded-xl pl-10"
            />
          </div>
          <p className="text-xs text-slate-500">
            Inserisci 0 per "Prezzo trattabile"
          </p>
        </div>
      )}

      {/* Condition */}
      <div className="space-y-2">
        <Label htmlFor="condition" className="text-sm font-medium">
          Condizione <span className="text-red-500">*</span>
        </Label>
        <Select
          value={data?.condition || ''}
          onValueChange={(value) =>
            onChange({ condition: value as WizardStep2ObjectData['condition'] })
          }
        >
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Seleziona la condizione" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(MERCATINO_CONDITION_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Private Toggle */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is-private" className="text-sm font-medium cursor-pointer">
                Annuncio privato
              </Label>
              <p className="text-xs text-slate-500">
                Visibile solo ai residenti verificati di Prato Rinaldo
              </p>
            </div>
            <Switch
              id="is-private"
              checked={data?.isPrivate || false}
              onCheckedChange={(checked) => onChange({ isPrivate: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Gift Info */}
      {isGift && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 flex gap-3">
            <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-800">
                <strong>Regalo alla comunità</strong>
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Questo oggetto sarà offerto gratuitamente. Chi lo richiederà potrà
                contattarti direttamente tramite i metodi che selezionerai.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Step 2 for Real Estate (Affitto/Vendita)
 */
export function WizardStep2RealEstate({
  data,
  realEstateType,
  onChange,
}: WizardStep2RealEstateProps) {
  const isRent = realEstateType === 'rent';
  const [mainCategories, setMainCategories] = React.useState<MercatinoCategory[]>([]);
  const [subcategories, setSubcategories] = React.useState<MercatinoCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = React.useState(true);
  const [loadingSubcategories, setLoadingSubcategories] = React.useState(false);

  // Track if hierarchical categories are available
  const [isHierarchical, setIsHierarchical] = React.useState(true);

  // Fetch main categories on mount
  // Try hierarchical first, fall back to flat if not available
  React.useEffect(() => {
    async function fetchMainCategories() {
      try {
        // First try hierarchical query
        const { categories: cats } = await getCategories('marketplace_item', {
          macroType: 'real_estate',
          parentId: null,
        });

        // If we got categories with macro_type set, hierarchical is available
        if (cats && cats.length > 0 && cats[0].macro_type) {
          setMainCategories(cats);
          setIsHierarchical(true);
        } else {
          // Fall back to flat categories (old behavior)
          const { categories: flatCats } = await getCategories('marketplace_item');
          setMainCategories(flatCats || []);
          setIsHierarchical(false);
        }
      } catch (error) {
        console.error('Error fetching main categories:', error);
        // Try flat categories as fallback
        try {
          const { categories: flatCats } = await getCategories('marketplace_item');
          setMainCategories(flatCats || []);
          setIsHierarchical(false);
        } catch {
          setMainCategories([]);
        }
      } finally {
        setLoadingCategories(false);
      }
    }
    fetchMainCategories();
  }, []);

  // Fetch subcategories when main category changes (only if hierarchical)
  React.useEffect(() => {
    async function fetchSubcategories() {
      // Skip if not hierarchical mode or no category selected
      if (!isHierarchical || !data?.categoryId) {
        setSubcategories([]);
        return;
      }

      setLoadingSubcategories(true);
      try {
        const { categories: subs } = await getCategories('marketplace_item', {
          macroType: 'real_estate',
          parentId: data.categoryId,
        });
        setSubcategories(subs || []);

        // Reset subcategoryId if not in new list
        if (data.subcategoryId && !subs.find((s) => s.id === data.subcategoryId)) {
          onChange({ subcategoryId: undefined });
        }
      } catch (error) {
        console.error('Error fetching subcategories:', error);
        setSubcategories([]);
      } finally {
        setLoadingSubcategories(false);
      }
    }
    fetchSubcategories();
  }, [data?.categoryId, isHierarchical]);

  // Check if current main category allows custom input
  const selectedMainCategory = mainCategories.find((c) => c.id === data?.categoryId);
  const allowsCustomInput = selectedMainCategory?.custom_input_allowed ?? false;

  return (
    <div className="space-y-6">
      {/* Main Category Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Categoria <span className="text-red-500">*</span>
        </Label>
        {loadingCategories ? (
          <div className="flex gap-2 flex-wrap">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-24 rounded-full" />
            ))}
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {mainCategories.map((category) => (
              <Badge
                key={category.id}
                className={cn(
                  'rounded-full px-4 py-2 text-sm cursor-pointer transition-all',
                  data?.categoryId === category.id
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                )}
                onClick={() => {
                  onChange({ categoryId: category.id, subcategoryId: undefined, customCategoryText: undefined });
                }}
              >
                {category.icon && <span className="mr-1">{category.icon}</span>}
                {category.name}
              </Badge>
            ))}
          </div>
        )}
        {!loadingCategories && !data?.categoryId && (
          <p className="text-xs text-destructive">
            Seleziona una categoria per continuare
          </p>
        )}
      </div>

      {/* Subcategory Selection (only if hierarchical mode, category selected, and not custom input) */}
      {isHierarchical && data?.categoryId && !allowsCustomInput && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Tipologia <span className="text-red-500">*</span>
          </Label>
          {loadingSubcategories ? (
            <Skeleton className="h-12 w-full rounded-xl" />
          ) : subcategories.length > 0 ? (
            <Select
              value={data?.subcategoryId || ''}
              onValueChange={(value) => onChange({ subcategoryId: value })}
            >
              <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white">
                <SelectValue placeholder="Seleziona la tipologia" />
              </SelectTrigger>
              <SelectContent>
                {subcategories.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-xs text-slate-500 italic">
              Nessuna tipologia disponibile per questa categoria
            </p>
          )}
          {!loadingSubcategories && subcategories.length > 0 && !data?.subcategoryId && (
            <p className="text-xs text-destructive">
              Seleziona una tipologia per continuare
            </p>
          )}
        </div>
      )}

      {/* Custom Input (only if "Altro" category selected) */}
      {allowsCustomInput && (
        <div className="space-y-2">
          <Label htmlFor="custom-category-re" className="text-sm font-medium">
            Specifica la tipologia <span className="text-red-500">*</span>
          </Label>
          <Input
            id="custom-category-re"
            value={data?.customCategoryText || ''}
            onChange={(e) => onChange({ customCategoryText: e.target.value })}
            placeholder="Es: Locale commerciale, Capannone..."
            className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all"
            maxLength={100}
          />
          {data?.customCategoryText && data.customCategoryText.length < 3 && (
            <p className="text-xs text-destructive">
              Minimo 3 caratteri richiesti
            </p>
          )}
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium">
          Titolo dell'annuncio <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          value={data?.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={isRent
            ? "Es: Trilocale luminoso con terrazzo"
            : "Es: Villa bifamiliare con giardino"
          }
          className="rounded-xl"
          maxLength={100}
        />
        <p className="text-xs text-slate-500">
          {(data?.title?.length || 0)}/100 caratteri
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Descrizione <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          value={data?.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Descrivi l'immobile in dettaglio: caratteristiche, servizi, vicinanze..."
          className="rounded-xl min-h-[120px]"
          maxLength={2000}
        />
        <p className="text-xs text-slate-500">
          {(data?.description?.length || 0)}/2000 caratteri
        </p>
      </div>

      {/* Price */}
      <div className="space-y-2">
        <Label htmlFor="price" className="text-sm font-medium">
          {isRent ? 'Canone mensile' : 'Prezzo di vendita'} <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            id="price"
            type="number"
            min={0}
            step={isRent ? 50 : 1000}
            value={data?.price || ''}
            onChange={(e) => onChange({ price: parseFloat(e.target.value) || 0 })}
            placeholder={isRent ? "800" : "250000"}
            className="rounded-xl pl-10"
          />
        </div>
        {isRent && (
          <p className="text-xs text-slate-500">
            Inserisci il canone mensile escluse spese condominiali
          </p>
        )}
      </div>

      {/* Square Meters & Rooms */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sqm" className="text-sm font-medium">
            Superficie (m²) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="sqm"
            type="number"
            min={1}
            value={data?.squareMeters || ''}
            onChange={(e) => onChange({ squareMeters: parseInt(e.target.value) || 0 })}
            placeholder="80"
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rooms" className="text-sm font-medium">
            Locali <span className="text-red-500">*</span>
          </Label>
          <Input
            id="rooms"
            type="number"
            min={1}
            max={20}
            value={data?.rooms || ''}
            onChange={(e) => onChange({ rooms: parseInt(e.target.value) || 0 })}
            placeholder="3"
            className="rounded-xl"
          />
        </div>
      </div>

      {/* Floor & Construction Year */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="floor" className="text-sm font-medium">
            Piano
          </Label>
          <Input
            id="floor"
            type="number"
            min={-2}
            max={50}
            value={data?.floor ?? ''}
            onChange={(e) => onChange({ floor: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="2"
            className="rounded-xl"
          />
          <p className="text-xs text-slate-500">
            -1 per seminterrato, 0 per piano terra
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="year" className="text-sm font-medium">
            Anno costruzione
          </Label>
          <Input
            id="year"
            type="number"
            min={1800}
            max={new Date().getFullYear()}
            value={data?.constructionYear || ''}
            onChange={(e) =>
              onChange({ constructionYear: e.target.value ? parseInt(e.target.value) : undefined })
            }
            placeholder="2010"
            className="rounded-xl"
          />
        </div>
      </div>

      {/* Address Zone */}
      <div className="space-y-2">
        <Label htmlFor="zone" className="text-sm font-medium">
          Zona / Indirizzo indicativo
        </Label>
        <Input
          id="zone"
          value={data?.addressZone || ''}
          onChange={(e) => onChange({ addressZone: e.target.value })}
          placeholder="Es: Via Roma, zona centro"
          className="rounded-xl"
          maxLength={255}
        />
        <p className="text-xs text-slate-500">
          Indica la zona senza l'indirizzo esatto per privacy
        </p>
      </div>

      {/* Amenities */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Caratteristiche</Label>

        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="elevator" className="text-sm cursor-pointer">
                  Ascensore
                </Label>
                <Switch
                  id="elevator"
                  checked={data?.hasElevator || false}
                  onCheckedChange={(checked) => onChange({ hasElevator: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="garage" className="text-sm cursor-pointer">
                  Garage / Posto auto
                </Label>
                <Switch
                  id="garage"
                  checked={data?.hasGarage || false}
                  onCheckedChange={(checked) => onChange({ hasGarage: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Private Toggle */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is-private" className="text-sm font-medium cursor-pointer">
                Annuncio privato
              </Label>
              <p className="text-xs text-slate-500">
                Visibile solo ai residenti verificati di Prato Rinaldo
              </p>
            </div>
            <Switch
              id="is-private"
              checked={data?.isPrivate || false}
              onCheckedChange={(checked) => onChange({ isPrivate: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
