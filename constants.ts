import { MenuItem, MenuItemCategory, Table, TableStatus } from './types';

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: '1',
    name: 'Trüflü Mantar Çorbası',
    description: 'Siyah trüf yağı ve taze otlarla hazırlanan kremalı yaban mantarı çorbası.',
    price: 180,
    category: MenuItemCategory.STARTER,
    imageUrl: 'https://picsum.photos/200/200?random=1'
  },
  {
    id: '2',
    name: 'Bruschetta Üçlüsü',
    description: 'Domates fesleğen, zeytin ezmesi ve ballı ricotta peynirli ızgara ekşi maya ekmeği.',
    price: 220,
    category: MenuItemCategory.STARTER,
    imageUrl: 'https://picsum.photos/200/200?random=2'
  },
  {
    id: '3',
    name: 'Izgara Dana Antrikot',
    description: '300g dinlendirilmiş antrikot, sarımsaklı tereyağı ve fırınlanmış sebzeler ile.',
    price: 750,
    category: MenuItemCategory.MAIN,
    imageUrl: 'https://picsum.photos/200/200?random=3'
  },
  {
    id: '4',
    name: 'Deniz Mahsüllü Paella',
    description: 'Karides, midye, kalamar ve sucuk ile hazırlanan geleneksel safranlı pilav.',
    price: 680,
    category: MenuItemCategory.MAIN,
    imageUrl: 'https://picsum.photos/200/200?random=4'
  },
  {
    id: '5',
    name: 'Yaban Mantarlı Risotto',
    description: 'Porçini mantarı ve parmesan peyniri ile yavaş pişirilmiş Arborio pirinci.',
    price: 450,
    category: MenuItemCategory.MAIN,
    imageUrl: 'https://picsum.photos/200/200?random=5'
  },
  {
    id: '6',
    name: 'Tiramisu',
    description: 'Espresso ile ıslatılmış kedidili ve mascarpone kreması ile klasik İtalyan tatlısı.',
    price: 180,
    category: MenuItemCategory.DESSERT,
    imageUrl: 'https://picsum.photos/200/200?random=6'
  },
  {
    id: '7',
    name: 'Sufle',
    description: 'Akışkan çikolatalı sıcak kek, yanında vanilyalı dondurma ile.',
    price: 200,
    category: MenuItemCategory.DESSERT,
    imageUrl: 'https://picsum.photos/200/200?random=7'
  },
  {
    id: '8',
    name: 'İmza Mocktail',
    description: 'Çarkıfelek meyvesi, nane ve misket limonu sodasının ferahlatıcı karışımı.',
    price: 120,
    category: MenuItemCategory.DRINK,
    imageUrl: 'https://picsum.photos/200/200?random=8'
  },
  {
    id: '9',
    name: 'Ev Yapımı Limonata',
    description: 'Taze nane yaprakları ile servis edilen, az şekerli doğal limonata.',
    price: 90,
    category: MenuItemCategory.DRINK,
    imageUrl: 'https://picsum.photos/200/200?random=9'
  }
];

export const INITIAL_TABLES: Table[] = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1,
  name: `Masa ${i + 1}`,
  status: TableStatus.EMPTY
}));