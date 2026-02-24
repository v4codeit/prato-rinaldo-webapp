'use client';

import * as React from 'react';
import { ProposalTagSelector } from './proposal-tag-selector';
import type { ProposalTag } from '@/types/proposals';

/**
 * Example usage of ProposalTagSelector component
 * This file demonstrates common patterns and usage scenarios
 */

// Mock data for demonstration
const MOCK_TAGS: ProposalTag[] = [
  {
    id: '1',
    tenant_id: 'tenant-1',
    name: 'Online',
    slug: 'online',
    description: 'Proposte discusse online',
    color: '#3b82f6',
    icon: '🌐',
    order_index: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    tenant_id: 'tenant-1',
    name: 'Offline',
    slug: 'offline',
    description: 'Proposte discusse in presenza',
    color: '#10b981',
    icon: '🏘️',
    order_index: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    tenant_id: 'tenant-1',
    name: 'Urgente',
    slug: 'urgente',
    description: 'Richiede attenzione immediata',
    color: '#ef4444',
    icon: '⚡',
    order_index: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    tenant_id: 'tenant-1',
    name: 'Idea',
    slug: 'idea',
    description: 'Proposta di nuova idea',
    color: '#f59e0b',
    icon: '💡',
    order_index: 3,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    tenant_id: 'tenant-1',
    name: 'Problema',
    slug: 'problema',
    description: 'Segnalazione di un problema',
    color: '#8b5cf6',
    icon: '🐛',
    order_index: 4,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    tenant_id: 'tenant-1',
    name: 'Ambiente',
    slug: 'ambiente',
    description: 'Tematiche ambientali',
    color: '#059669',
    icon: '🌱',
    order_index: 5,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '7',
    tenant_id: 'tenant-1',
    name: 'Sicurezza',
    slug: 'sicurezza',
    description: 'Sicurezza e sorveglianza',
    color: '#dc2626',
    icon: '🔒',
    order_index: 6,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/**
 * Example 1: Basic usage in a form
 */
export function BasicExample() {
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Basic Usage</h3>
      <ProposalTagSelector
        availableTags={MOCK_TAGS}
        selectedTagIds={selectedTags}
        onChange={setSelectedTags}
      />
    </div>
  );
}

/**
 * Example 2: With custom max tags limit
 */
export function CustomMaxTagsExample() {
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Custom Max Tags (3)</h3>
      <ProposalTagSelector
        availableTags={MOCK_TAGS}
        selectedTagIds={selectedTags}
        onChange={setSelectedTags}
        maxTags={3}
      />
    </div>
  );
}

/**
 * Example 3: Pre-selected tags
 */
export function PreSelectedExample() {
  const [selectedTags, setSelectedTags] = React.useState<string[]>([
    '1', // Online
    '3', // Urgente
  ]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Pre-selected Tags</h3>
      <ProposalTagSelector
        availableTags={MOCK_TAGS}
        selectedTagIds={selectedTags}
        onChange={setSelectedTags}
      />
    </div>
  );
}

/**
 * Example 4: Disabled state
 */
export function DisabledExample() {
  const [selectedTags] = React.useState<string[]>(['1', '3']);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Disabled State</h3>
      <ProposalTagSelector
        availableTags={MOCK_TAGS}
        selectedTagIds={selectedTags}
        onChange={() => {}}
        disabled
      />
    </div>
  );
}

/**
 * Example 5: In a full form context
 */
export function FormExample() {
  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    tagIds: [] as string[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert(`Proposta con ${formData.tagIds.length} tag(s) selezionati`);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Form Integration</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="title"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Titolo proposta
          </label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-600/20"
            placeholder="Es. Installazione pannelli solari"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Descrizione
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-600/20"
            placeholder="Descrivi la tua proposta..."
            rows={4}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Tag
          </label>
          <ProposalTagSelector
            availableTags={MOCK_TAGS}
            selectedTagIds={formData.tagIds}
            onChange={(tagIds) => setFormData({ ...formData, tagIds })}
            placeholder="Seleziona tag pertinenti..."
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-violet-600 px-4 py-2 font-medium text-white transition-colors hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-600/20"
        >
          Crea proposta
        </button>
      </form>
    </div>
  );
}

/**
 * Example 6: With validation
 */
export function ValidationExample() {
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string>('');

  const handleChange = (tagIds: string[]) => {
    setSelectedTags(tagIds);
    // Clear error when user selects at least one tag
    if (tagIds.length > 0) {
      setError('');
    }
  };

  const handleValidate = () => {
    if (selectedTags.length === 0) {
      setError('Seleziona almeno un tag per la proposta');
    } else {
      setError('');
      alert('Validazione superata!');
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">With Validation</h3>
      <ProposalTagSelector
        availableTags={MOCK_TAGS}
        selectedTagIds={selectedTags}
        onChange={handleChange}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={handleValidate}
        className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
      >
        Valida
      </button>
    </div>
  );
}

/**
 * Complete demo page showing all examples
 */
export default function ProposalTagSelectorDemo() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4 md:p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">ProposalTagSelector Demo</h1>
        <p className="text-slate-600">
          Componente per la selezione multipla di tag nelle proposte Agorà
        </p>
      </div>

      <div className="space-y-8 divide-y divide-slate-200">
        <BasicExample />
        <div className="pt-8">
          <CustomMaxTagsExample />
        </div>
        <div className="pt-8">
          <PreSelectedExample />
        </div>
        <div className="pt-8">
          <DisabledExample />
        </div>
        <div className="pt-8">
          <FormExample />
        </div>
        <div className="pt-8">
          <ValidationExample />
        </div>
      </div>
    </div>
  );
}
