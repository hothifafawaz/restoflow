export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  PAID = 'PAID'
}

export enum TableStatus {
  EMPTY = 'EMPTY',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED'
}

export enum MenuItemCategory {
  STARTER = 'Başlangıç',
  MAIN = 'Ana Yemek',
  DESSERT = 'Tatlı',
  DRINK = 'İçecek'
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuItemCategory;
  imageUrl: string;
}

export interface OrderItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
}

export interface Order {
  id: string;
  tableId: number;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: Date;
  total: number;
  aiRecommendation?: string; // Stored recommendation from Gemini
}

export interface Table {
  id: number;
  name: string;
  status: TableStatus;
  currentOrderId?: string; // Link to active order
}