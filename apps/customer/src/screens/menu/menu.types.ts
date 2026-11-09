/**
 * Menu data shapes (mirror the API response; the menu schema lives in the API
 * package, not in shared-types). Lived in MenuScreen.tsx, which the item sheet
 * imported back from, a circular import.
 */

export interface Category {
  _id: string;
  name: string;
  icon?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface MenuItemOption {
  label: string;
  price: number;
}

export interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  categoryId: string;
  basePrice: number;
  image?: string;   // API field name (not imageUrl)
  emoji?: string;
  isAvailable: boolean;
  sizes: MenuItemOption[];
  addOns: MenuItemOption[];
}
