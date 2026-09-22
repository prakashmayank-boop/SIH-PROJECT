import React from 'react';
import {
  AlertOctagon,
  Waves,
  Car,
  AlertTriangle,
  Layers,
  Trash2,
  Home,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Check
} from 'lucide-react';
import type { IssueCategoryId, SupportedLanguage } from '../../types';
import { TRANSLATIONS } from '../../i18n/translations';

interface IssueCategoryScreenProps {
  lang: SupportedLanguage;
  selectedCategory: IssueCategoryId | null;
  onSelectCategory: (cat: IssueCategoryId) => void;
  onNext: () => void;
  onBack: () => void;
}

interface CategoryOption {
  id: IssueCategoryId;
  icon: React.ReactNode;
  critical?: boolean;
}

const STEPS = ['Category', 'Evidence', 'Location', 'Severity', 'Review'];

export const IssueCategoryScreen: React.FC<IssueCategoryScreenProps> = ({
  lang,
  selectedCategory,
  onSelectCategory,
  onNext,
  onBack
}) => {
  const t = TRANSLATIONS[lang];

  const categories: CategoryOption[] = [
    {
      id: 'BLOCKED_MANHOLE',
      icon: <Layers size={20} color="#D97706" />
    },
    {
      id: 'OVERFLOWING_DRAIN',
      icon: <Waves size={20} color="#2563EB" />
    },
    {
      id: 'FLOODED_ROAD',
      icon: <Car size={20} color="#4F46E5" />
    },
    {
      id: 'OPEN_MANHOLE',
      icon: <AlertOctagon size={20} color="#DC2626" />,
      critical: true
    },
    {
      id: 'DAMAGED_DRAIN_COVER',
      icon: <AlertTriangle size={20} color="#EA580C" />
    },
    {
      id: 'DEBRIS_OBSTRUCTION',
      icon: <Trash2 size={20} color="#16A34A" />
    },
    {
      id: 'WATER_ENTERING_PROPERTY',
      icon: <Home size={20} color="#E11D48" />
    },
    {
      id: 'OTHER_HAZARD',
      icon: <HelpCircle size={20} color="#64748B" />
    }
  ];

  return (
    <div className="cp-space-y-4">

      {/* Step Progress Bar */}
      <div className="cp-step-bar">
        {STEPS.map((label, idx) => {
          const stepNum = idx + 1;
          const isDone = stepNum < 1;
          const isActive = stepNum === 1;
          return (
            <div
              key={label}
              className={`cp-step ${isDone ? 'cp-step--done' : ''} ${isActive ? 'cp-step--active' : ''}`}
            >
              <div className="cp-step__circle">
                {isDone ? <Check size={13} /> : stepNum}
              </div>
              <span className="cp-step__label">{label}</span>
            </div>
          );
        })}
      </div>

      {/* Section header */}
      <div>
        <p className="cp-eyebrow" style={{ marginBottom: '6px' }}>Step 1 of 5 — Hazard Classification</p>
        <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--cp-text)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          {t.categoryTitle}
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--cp-text-muted)', lineHeight: '1.6' }}>
          {t.categorySubtitle}
        </p>
      </div>

      {/* Category Grid */}
      <div className="cp-cat-grid" role="radiogroup" aria-label="Issue category">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const nameKey = `cat_${cat.id}` as keyof typeof t;
          const descKey = `catDesc_${cat.id}` as keyof typeof t;

          return (
            <button
              key={cat.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelectCategory(cat.id)}
              className={`cp-cat-card ${isSelected ? 'cp-cat-card--selected' : ''}`}
            >
              <div className="cp-cat-card__top">
                <div className="cp-cat-card__icon">{cat.icon}</div>
                <div className={`cp-cat-card__radio`}>
                  {isSelected && <div className="cp-cat-card__radio-dot" />}
                </div>
              </div>
              <div>
                <p className="cp-cat-card__title">{t[nameKey]}</p>
                <p className="cp-cat-card__desc">{t[descKey]}</p>
                {cat.critical && (
                  <span className="cp-cat-card__critical-badge">⚠ Critical Hazard</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="cp-step-footer">
        <button type="button" onClick={onBack} className="cp-back-btn">
          <ArrowLeft size={15} />
          <span>{t.btnBack}</span>
        </button>

        <button
          type="button"
          disabled={!selectedCategory}
          onClick={onNext}
          className="cp-btn-primary"
        >
          <span>Upload Evidence</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Auto-save note */}
      {selectedCategory && (
        <p style={{ fontSize: '11px', color: 'var(--cp-text-muted)', textAlign: 'center' }}>
          ✓ Draft auto-saved · Reports are geotagged & cross-referenced with radar nowcasting
        </p>
      )}
    </div>
  );
};
