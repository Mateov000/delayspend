import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Category } from './types';
import { CATEGORIES as BUILTIN_CATEGORIES } from '../constants/categories';
import { generateId } from '../utils/id';

export interface CategoryPalette {
  color: string;
  badgeBg: string;
  textColor: string;
}

export const CATEGORY_PALETTES: CategoryPalette[] = [
  { color: 'bg-teal-100 text-teal-800 border-teal-200', badgeBg: 'bg-teal-100', textColor: 'text-teal-800' },
  { color: 'bg-indigo-100 text-indigo-800 border-indigo-200', badgeBg: 'bg-indigo-100', textColor: 'text-indigo-800' },
  { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', badgeBg: 'bg-emerald-100', textColor: 'text-emerald-800' },
  { color: 'bg-amber-100 text-amber-800 border-amber-200', badgeBg: 'bg-amber-100', textColor: 'text-amber-800' },
  { color: 'bg-rose-100 text-rose-800 border-rose-200', badgeBg: 'bg-rose-100', textColor: 'text-rose-800' },
  { color: 'bg-purple-100 text-purple-800 border-purple-200', badgeBg: 'bg-purple-100', textColor: 'text-purple-800' },
  { color: 'bg-cyan-100 text-cyan-800 border-cyan-200', badgeBg: 'bg-cyan-100', textColor: 'text-cyan-800' },
  { color: 'bg-orange-100 text-orange-800 border-orange-200', badgeBg: 'bg-orange-100', textColor: 'text-orange-800' },
];

export const AVAILABLE_CATEGORY_ICONS = [
  'Scissors',
  'Dumbbell',
  'Home',
  'PawPrint',
  'Car',
  'Gift',
  'Coffee',
  'Smile',
  'Sparkles',
  'Utensils',
  'ShoppingCart',
  'Bus',
  'PartyPopper',
  'Shirt',
  'Laptop',
  'CreditCard',
  'HeartPulse',
  'GraduationCap',
];

export interface CategoryState {
  customCategories: Category[];
  /** IDs de categorías que al exportar la rendición para padres se agrupan bajo "Otros Gastos" */
  parentMaskedCategoryIds: string[];
  /** Subcategorías indexadas por categoryId (ej: { vices: ['Puchos'], food: ['Delivery', 'Almuerzo'] }) */
  subcategoriesByCategory: Record<string, string[]>;
  /** Subcategorías disponibles para la categoría Vicios (compatibilidad retroactiva) */
  viceSubcategories: string[];
  addCustomCategory: (name: string, icon?: string, paletteIndex?: number) => Category;
  removeCustomCategory: (id: string) => void;
  toggleParentMaskedCategory: (categoryId: string) => void;
  isParentMasked: (categoryId: string) => boolean;
  addSubcategory: (categoryId: string, name: string) => void;
  removeSubcategory: (categoryId: string, name: string) => void;
  getSubcategoriesForCategory: (categoryId: string) => string[];
  addViceSubcategory: (name: string) => void;
}

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set, get) => ({
      customCategories: [],
      // 'aesthetics' queda enmascarada automáticamente por defecto
      parentMaskedCategoryIds: ['aesthetics'],
      // Subcategorías iniciales universales y de vicios
      subcategoriesByCategory: {
        vices: ['Puchos'],
      },
      viceSubcategories: ['Puchos'],

      getSubcategoriesForCategory: (categoryId: string) => {
        const state = get();
        const map = state.subcategoriesByCategory || {};
        if (map[categoryId] && Array.isArray(map[categoryId])) {
          return map[categoryId];
        }
        if (categoryId === 'vices') {
          return state.viceSubcategories && state.viceSubcategories.length > 0
            ? state.viceSubcategories
            : ['Puchos'];
        }
        return [];
      },

      addSubcategory: (categoryId: string, name: string) => {
        const cleanName = name.trim();
        if (!cleanName) return;
        set((state) => {
          const map = { ...(state.subcategoriesByCategory || {}) };
          const current = map[categoryId]
            ? [...map[categoryId]]
            : categoryId === 'vices'
            ? [...(state.viceSubcategories || ['Puchos'])]
            : [];

          if (current.some((s) => s.toLowerCase() === cleanName.toLowerCase())) {
            return state;
          }

          const updated = [...current, cleanName];
          map[categoryId] = updated;

          return {
            subcategoriesByCategory: map,
            viceSubcategories: categoryId === 'vices' ? updated : state.viceSubcategories,
          };
        });
      },

      removeSubcategory: (categoryId: string, name: string) => {
        const cleanName = name.trim().toLowerCase();
        set((state) => {
          const map = { ...(state.subcategoriesByCategory || {}) };
          const current = map[categoryId]
            ? [...map[categoryId]]
            : categoryId === 'vices'
            ? [...(state.viceSubcategories || ['Puchos'])]
            : [];

          const updated = current.filter((s) => s.trim().toLowerCase() !== cleanName);
          map[categoryId] = updated;

          return {
            subcategoriesByCategory: map,
            viceSubcategories: categoryId === 'vices' ? updated : state.viceSubcategories,
          };
        });
      },

      addViceSubcategory: (name: string) => {
        get().addSubcategory('vices', name);
      },

      addCustomCategory: (name: string, icon = 'Sparkles', paletteIndex = 0) => {
        const cleanName = name.trim();
        const palette = CATEGORY_PALETTES[paletteIndex % CATEGORY_PALETTES.length]!;
        const newCat: Category = {
          id: 'custom_' + generateId().slice(0, 8),
          name: cleanName,
          icon,
          color: palette.color,
          badgeBg: palette.badgeBg,
          textColor: palette.textColor,
          isCustom: true,
        };

        set((state) => ({
          customCategories: [...state.customCategories, newCat],
        }));

        return newCat;
      },

      removeCustomCategory: (id: string) => {
        set((state) => ({
          customCategories: state.customCategories.filter((c) => c.id !== id),
          parentMaskedCategoryIds: state.parentMaskedCategoryIds.filter((cid) => cid !== id),
        }));
      },

      toggleParentMaskedCategory: (categoryId: string) => {
        set((state) => {
          const exists = state.parentMaskedCategoryIds.includes(categoryId);
          return {
            parentMaskedCategoryIds: exists
              ? state.parentMaskedCategoryIds.filter((id) => id !== categoryId)
              : [...state.parentMaskedCategoryIds, categoryId],
          };
        });
      },

      isParentMasked: (categoryId: string) => {
        return get().parentMaskedCategoryIds.includes(categoryId);
      },
    }),
    {
      name: 'delayspend_categories_v1',
      storage: createJSONStorage(() => localStorage),
      // Migración para poblar subcategoriesByCategory a partir de viceSubcategories si es necesario
      migrate: (persistedState: any) => {
        if (!persistedState) return persistedState;
        if (!persistedState.subcategoriesByCategory) {
          persistedState.subcategoriesByCategory = {
            vices: persistedState.viceSubcategories || ['Puchos'],
          };
        }
        return persistedState;
      },
    }
  )
);

/**
 * Devuelve todas las categorías (nativas + customizadas), con 'other' siempre al final.
 */
export function getAllCategories(customCategories: Category[] = []): Category[] {
  const otherCat = BUILTIN_CATEGORIES.find((c) => c.id === 'other') as Category;
  const builtInWithoutOther = BUILTIN_CATEGORIES.filter((c) => c.id !== 'other') as Category[];

  return [...builtInWithoutOther, ...customCategories, otherCat];
}

/**
 * Busca una categoría por ID en nativas y custom; si no existe, devuelve 'other'.
 */
export function findCategoryById(
  id: string,
  customCategories: Category[] = []
): Category {
  const all = getAllCategories(customCategories);
  const found = all.find((c) => c.id === id);
  if (found) return found;
  return BUILTIN_CATEGORIES[BUILTIN_CATEGORIES.length - 1] as Category;
}
