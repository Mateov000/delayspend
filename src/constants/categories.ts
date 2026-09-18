import { Category, CategoryId } from '../store/types';

export const CATEGORIES: readonly Category[] = [
  {
    id: 'food',
    name: 'Comida & Bebidas',
    icon: 'Utensils',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    badgeBg: 'bg-amber-100',
    textColor: 'text-amber-800',
  },
  {
    id: 'supermarket',
    name: 'Supermercado',
    icon: 'ShoppingCart',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    badgeBg: 'bg-blue-100',
    textColor: 'text-blue-800',
  },
  {
    id: 'transport',
    name: 'Transporte',
    icon: 'Bus',
    color: 'bg-sky-100 text-sky-800 border-sky-200',
    badgeBg: 'bg-sky-100',
    textColor: 'text-sky-800',
  },
  {
    id: 'leisure',
    name: 'Salidas & Ocio',
    icon: 'PartyPopper',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    badgeBg: 'bg-purple-100',
    textColor: 'text-purple-800',
  },
  {
    id: 'clothing',
    name: 'Ropa & Calzado',
    icon: 'Shirt',
    color: 'bg-pink-100 text-pink-800 border-pink-200',
    badgeBg: 'bg-pink-100',
    textColor: 'text-pink-800',
  },
  {
    id: 'tech',
    name: 'Tecnología',
    icon: 'Laptop',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    badgeBg: 'bg-indigo-100',
    textColor: 'text-indigo-800',
  },
  {
    id: 'subscriptions',
    name: 'Suscripciones & Servicios',
    icon: 'CreditCard',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    badgeBg: 'bg-cyan-100',
    textColor: 'text-cyan-800',
  },
  {
    id: 'health',
    name: 'Salud & Farmacia',
    icon: 'HeartPulse',
    color: 'bg-rose-100 text-rose-800 border-rose-200',
    badgeBg: 'bg-rose-100',
    textColor: 'text-rose-800',
  },
  {
    id: 'aesthetics',
    name: 'Estética & Cuidado Personal',
    icon: 'Scissors',
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    badgeBg: 'bg-teal-100',
    textColor: 'text-teal-800',
  },
  {
    id: 'education',
    name: 'Cursos & Libros',
    icon: 'GraduationCap',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    badgeBg: 'bg-emerald-100',
    textColor: 'text-emerald-800',
  },
  {
    id: 'vices',
    name: 'Vicios',
    icon: 'Flame',
    color: 'bg-amber-100 text-amber-900 border-amber-300',
    badgeBg: 'bg-amber-100',
    textColor: 'text-amber-900',
  },
  {
    id: 'other',
    name: 'Otros Gastos',
    icon: 'Sparkles',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
    badgeBg: 'bg-slate-100',
    textColor: 'text-slate-800',
  },
] as const;

export function getCategoryById(id: CategoryId): Category {
  const category = CATEGORIES.find(cat => cat.id === id);
  if (!category) {
    return CATEGORIES[CATEGORIES.length - 1] as Category;
  }
  return category;
}

