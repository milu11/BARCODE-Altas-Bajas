export interface Product {
  id: string;
  codArt: string;
  descripcion: string;
  pub: string;
  estak: string;
  stockUds: number;
  uxcTamano: string;
  stockCajas: number;
  pvpPrecio: number;
  stockValor: number;
  stockReal: number;
  diffUnits: number;
  diffEuros: number;
}

export interface UMItem {
  id: string;
  code: string;
  description: string;
}

export interface AppState {
  products: Product[];
  searchTerm: string;
  activeTab: 'barcode' | 'umManagement';
  umSections: {
    [key: string]: UMItem[];
  };
}