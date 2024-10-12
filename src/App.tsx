import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, ChevronDown, ChevronUp, Trash2, Upload, FileDown } from 'lucide-react';
import { Product, AppState, UMItem } from './types';
import { jsPDF } from "jspdf";
import 'jspdf-autotable';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    products: [],
    searchTerm: '',
    activeTab: 'barcode',
    umSections: {
      'Pasillo 1': [],
      'Pasillo 2': [],
      'Pasillo 3': [],
      'Pasillo 4': [],
      'Pasillo 5': [],
      'Nevera': [],
      'Congelado': [],
    },
  });

  useEffect(() => {
    // Cargar datos del localStorage
    const savedState = localStorage.getItem('appState');
    if (savedState) {
      setState(JSON.parse(savedState));
    }
  }, []);

  useEffect(() => {
    // Guardar datos en localStorage
    localStorage.setItem('appState', JSON.stringify(state));
  }, [state]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prevState => ({ ...prevState, searchTerm: e.target.value }));
  };

  const handleStockRealChange = (id: string, value: number) => {
    setState(prevState => ({
      ...prevState,
      products: prevState.products.map(product => {
        if (product.id === id) {
          const diffUnits = value - product.stockUds;
          const diffEuros = diffUnits * product.pvpPrecio;
          return { ...product, stockReal: Math.max(0, value), diffUnits, diffEuros };
        }
        return product;
      })
    }));
  };

  const handleTabChange = (tab: 'barcode' | 'umManagement') => {
    setState(prevState => ({ ...prevState, activeTab: tab }));
  };

  const toggleSection = (section: string) => {
    setState(prevState => ({
      ...prevState,
      umSections: {
        ...prevState.umSections,
        [section]: prevState.umSections[section].length ? [] : [{ id: Date.now().toString(), code: '', description: '' }],
      },
    }));
  };

  const addUMItem = (section: string) => {
    setState(prevState => ({
      ...prevState,
      umSections: {
        ...prevState.umSections,
        [section]: [...prevState.umSections[section], { id: Date.now().toString(), code: '', description: '' }],
      },
    }));
  };

  const updateUMItem = (section: string, id: string, field: 'code' | 'description', value: string) => {
    setState(prevState => ({
      ...prevState,
      umSections: {
        ...prevState.umSections,
        [section]: prevState.umSections[section].map(item =>
          item.id === id ? { ...item, [field]: value } : item
        ),
      },
    }));
  };

  const removeUMItem = (section: string, id: string) => {
    setState(prevState => ({
      ...prevState,
      umSections: {
        ...prevState.umSections,
        [section]: prevState.umSections[section].filter(item => item.id !== id),
      },
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          const products = parseCSV(text);
          setState(prevState => ({ ...prevState, products }));
        }
      };
      reader.readAsText(file);
    }
  };

  const parseCSV = (text: string): Product[] => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map(value => value.trim());
      const product: Product = {
        id: (index + 1).toString(),
        codArt: values[headers.indexOf('Cód. Art.')] || '',
        descripcion: values[headers.indexOf('Descripción')] || '',
        pub: values[headers.indexOf('Pub.')] || '',
        estak: values[headers.indexOf('Estak #8')] || '',
        stockUds: parseInt(values[headers.indexOf('Stock (Uds)')]) || 0,
        uxcTamano: values[headers.indexOf('UxC Tamaño')] || '',
        stockCajas: parseInt(values[headers.indexOf('Stock (Cajas)')]) || 0,
        pvpPrecio: parseFloat(values[headers.indexOf('PVP Precio')]) || 0,
        stockValor: parseFloat(values[headers.indexOf('Stock Valor (€)')]) || 0,
        stockReal: 0,
        diffUnits: 0,
        diffEuros: 0
      };
      return product;
    });
  };

  const handleNewBarcode = () => {
    if (confirm('¿Estás seguro de que quieres iniciar una nueva barcode? Esto borrará los datos actuales.')) {
      setState(prevState => ({ ...prevState, products: [] }));
    }
  };

  const handleFinishBarcode = () => {
    if (confirm('¿Estás seguro de que quieres finalizar la barcode actual? Esto generará un PDF con los resultados.')) {
      generatePDF();
      setState(prevState => ({ ...prevState, products: [] }));
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text('Resultados de Barcode', 14, 15);
    
    const tableColumn = ["Cód. Art.", "Descripción", "Stock (Uds)", "Stock Real", "Diferencia (Uds)", "Diferencia (€)"];
    const tableRows = state.products.map(product => [
      product.codArt,
      product.descripcion,
      product.stockUds,
      product.stockReal,
      product.diffUnits,
      product.diffEuros.toFixed(2)
    ]);

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20
    });

    doc.save('barcode_results.pdf');
  };

  const filteredProducts = state.products.filter(product =>
    product.codArt.toLowerCase().includes(state.searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-full mx-auto">
        <h1 className="text-3xl font-bold mb-6">Gestión de Barcode</h1>
        <div className="mb-4 flex">
          <button
            onClick={() => handleTabChange('barcode')}
            className={`mr-2 px-4 py-2 rounded-t-lg ${state.activeTab === 'barcode' ? 'bg-white text-blue-600' : 'bg-gray-200'}`}
          >
            Barcode
          </button>
          <button
            onClick={() => handleTabChange('umManagement')}
            className={`px-4 py-2 rounded-t-lg ${state.activeTab === 'umManagement' ? 'bg-white text-blue-600' : 'bg-gray-200'}`}
          >
            Gestión UM Altas/Bajas
          </button>
        </div>
        {state.activeTab === 'barcode' ? (
          <div className="bg-white shadow-md rounded-lg p-4">
            <div className="mb-4 flex justify-between items-center">
              <input
                type="text"
                placeholder="Buscar por código de artículo"
                value={state.searchTerm}
                onChange={handleSearch}
                className="w-1/2 p-2 border rounded"
              />
              <div className="flex">
                <button
                  onClick={handleNewBarcode}
                  className="bg-green-500 text-white px-4 py-2 rounded mr-2 flex items-center"
                >
                  <Plus size={16} className="mr-2" />
                  Nueva Barcode
                </button>
                <button
                  onClick={handleFinishBarcode}
                  className="bg-red-500 text-white px-4 py-2 rounded mr-2 flex items-center"
                >
                  <FileDown size={16} className="mr-2" />
                  Finalizar Barcode
                </button>
                <label htmlFor="csv-upload" className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer flex items-center">
                  <Upload size={16} className="mr-2" />
                  Cargar CSV
                </label>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="px-4 py-2">Cód. Art.</th>
                    <th className="px-4 py-2">Descripción</th>
                    <th className="px-4 py-2">Pub.</th>
                    <th className="px-4 py-2">Estak #8</th>
                    <th className="px-4 py-2">Stock (Uds)</th>
                    <th className="px-4 py-2">UxC Tamaño</th>
                    <th className="px-4 py-2">Stock (Cajas)</th>
                    <th className="px-4 py-2">PVP Precio</th>
                    <th className="px-4 py-2">Stock Valor (€)</th>
                    <th className="px-4 py-2">Stock Real</th>
                    <th className="px-4 py-2">Diferencia (Uds)</th>
                    <th className="px-4 py-2">Diferencia (€)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => (
                    <tr key={product.id}>
                      <td className="border px-4 py-2">{product.codArt}</td>
                      <td className="border px-4 py-2">{product.descripcion}</td>
                      <td className="border px-4 py-2">{product.pub}</td>
                      <td className="border px-4 py-2">{product.estak}</td>
                      <td className="border px-4 py-2">{product.stockUds}</td>
                      <td className="border px-4 py-2">{product.uxcTamano}</td>
                      <td className="border px-4 py-2">{product.stockCajas}</td>
                      <td className="border px-4 py-2">{product.pvpPrecio}</td>
                      <td className="border px-4 py-2">{product.stockValor}</td>
                      <td className="border px-4 py-2">
                        <div className="flex items-center">
                          <button
                            onClick={() => handleStockRealChange(product.id, Math.max(0, product.stockReal - 1))}
                            className="bg-red-500 text-white p-1 rounded mr-2"
                          >
                            <Minus size={16} />
                          </button>
                          <input
                            type="number"
                            value={product.stockReal}
                            onChange={(e) => handleStockRealChange(product.id, parseInt(e.target.value) || 0)}
                            className="w-20 p-1 border rounded text-center"
                          />
                          <button
                            onClick={() => handleStockRealChange(product.id, product.stockReal + 1)}
                            className="bg-green-500 text-white p-1 rounded ml-2"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </td>
                      <td className="border px-4 py-2">{product.diffUnits}</td>
                      <td className="border px-4 py-2">{product.diffEuros.toFixed(2)} €</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-4">
            {Object.entries(state.umSections).map(([section, items]) => (
              <div key={section} className="mb-4">
                <button
                  onClick={() => toggleSection(section)}
                  className="w-full flex justify-between items-center bg-gray-100 p-2 rounded"
                >
                  <span>{section}</span>
                  {items.length > 0 ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {items.length > 0 && (
                  <div className="mt-2">
                    {items.map((item: UMItem) => (
                      <div key={item.id} className="flex items-center mb-2">
                        <input
                          type="text"
                          value={item.code}
                          onChange={(e) => updateUMItem(section, item.id, 'code', e.target.value)}
                          placeholder="Código"
                          className="mr-2 p-1 border rounded"
                        />
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateUMItem(section, item.id, 'description', e.target.value)}
                          placeholder="Descripción"
                          className="mr-2 p-1 border rounded flex-grow"
                        />
                        <button
                          onClick={() => removeUMItem(section, item.id)}
                          className="p-1 bg-red-500 text-white rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addUMItem(section)}
                      className="mt-2 bg-blue-500 text-white px-2 py-1 rounded"
                    >
                      <Plus size={16} className="inline mr-1" /> Nuevo
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;