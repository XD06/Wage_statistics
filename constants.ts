import { Category } from './types';
import { Coffee, Sun, Moon, ShoppingBag, AlertCircle } from 'lucide-react';

export const CATEGORY_CONFIG = {
  [Category.Breakfast]: { color: 'text-orange-500', bg: 'bg-orange-100', icon: Coffee },
  [Category.Lunch]: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Sun },
  [Category.Dinner]: { color: 'text-indigo-600', bg: 'bg-indigo-100', icon: Moon },
  [Category.Other]: { color: 'text-gray-600', bg: 'bg-gray-100', icon: ShoppingBag },
};

export const WEEK_DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
