// ===== EDIT THIS FILE TO ADAPT THE SYSTEM TO ANOTHER COMPANY =====
export const COMPANY = {
  name: 'Secured Manpower Services',
  short: 'KitSync',
  tagline: 'Keep every uniform and pair of shoes accounted for.',
};

export interface CategoryDef { name: string; items: string[]; sizes: string[]; }

const CLOTHING = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
// US shoe sizes, 5 to 14 with half sizes
const SHOES = [
  '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5',
  '10', '10.5', '11', '11.5', '12', '12.5', '13', '13.5', '14',
];
const ONE = ['One size'];
const NA = ['N/A'];

export const CATEGORIES: CategoryDef[] = [
  { name: 'Uniform', sizes: CLOTHING,
    items: ['Polo shirt', 'Long sleeve shirt', 'Pants', 'Skirt', 'Jacket', 'Vest', 'Necktie'] },
  { name: 'Shoes', sizes: SHOES,
    items: ['Black shoes', 'Safety shoes', 'Boots', 'Sandals'] },
  { name: 'Protective gear', sizes: ['S', 'M', 'L', 'XL', 'One size'],
    items: ['Safety helmet', 'Gloves', 'Raincoat', 'Reflective vest', 'Face mask'] },
  { name: 'Accessories', sizes: ONE,
    items: ['Cap', 'Belt', 'ID lace', 'Name plate', 'Whistle', 'Flashlight'] },
  { name: 'Office supplies', sizes: NA,
    items: ['Bond paper', 'Ballpen', 'Folder', 'Notebook', 'Stapler'] },
  { name: 'Other', sizes: NA, items: ['Other supply'] },
];

export const COLORS = ['Black', 'White', 'Navy', 'Blue', 'Gray', 'Green', 'Khaki', 'Brown',
  'Maroon', 'Red', 'Yellow', 'Orange', 'Beige', 'N/A'];

export const QUANTITIES = [...Array(51).keys(), 60, 70, 80, 90, 100, 150, 200, 250, 300, 400, 500, 1000];
export const MIN_STOCKS = [0, 1, 2, 3, 5, 10, 15, 20, 25, 30, 40, 50, 100];