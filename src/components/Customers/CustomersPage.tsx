import React, { useState } from 'react';
import { CustomersList } from './CustomersList';
import { CustomerForm } from './CustomerForm';
import { CustomerFilters } from './CustomerFilters';
import { ImportModal } from '../Common/ImportModal';
import { ExportModal } from '../Common/ExportModal';
import { AdvancedFilters } from '../Common/AdvancedFilters';
import { mockCustomers } from '../../data/mockData';
import { Customer } from '../../types';
import { Plus, Upload, Download, Filter } from 'lucide-react';

const customerFilterConfigs = [
  { key: 'search', label: 'Search', type: 'text' as const, placeholder: 'Search customers...' },
  { key: 'language', label: 'Language', type: 'select' as const, options: [
    { value: 'English', label: 'English' },
    { value: 'Spanish', label: 'Spanish' },
    { value: 'French', label: 'French' },
    { value: 'German', label: 'German' }
  ]},
  { key: 'currency', label: 'Currency', type: 'select' as const, options: [
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' },
    { value: 'GBP', label: 'GBP' },
    { value: 'CAD', label: 'CAD' }
  ]},
  { key: 'totalValueMin', label: 'Min Total Value', type: 'number' as const, placeholder: '0' },
  { key: 'totalValueMax', label: 'Max Total Value', type: 'number' as const, placeholder: '1000000' },
  { key: 'createdAfter', label: 'Created After', type: 'date' as const },
  { key: 'createdBefore', label: 'Created Before', type: 'date' as const },
  { key: 'tags', label: 'Tags', type: 'multiselect' as const, options: [
    { value: 'enterprise', label: 'Enterprise' },
    { value: 'vip', label: 'VIP' },
    { value: 'creative', label: 'Creative' },
    { value: 'agency', label: 'Agency' },
    { value: 'startup', label: 'Startup' }
  ]}
];

const sampleCustomerData = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1-555-0123',
  company: 'Example Corp',
  language: 'English',
  currency: 'USD',
  totalValue: '50000',
  tags: 'enterprise,vip'
};

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    language: '',
    currency: '',
    totalValueMin: '',
    totalValueMax: '',
    createdAfter: '',
    createdBefore: '',
    tags: []
  });

  const handleCreateCustomer = (customerData: Partial<Customer>) => {
    const newCustomer: Customer = {
      id: Date.now().toString(),
      name: customerData.name || '',
      email: customerData.email || '',
      phone: customerData.phone,
      company: customerData.company,
      addresses: customerData.addresses || [],
      language: customerData.language || 'English',
      currency: customerData.currency || 'USD',
      totalValue: customerData.totalValue || 0,
      createdAt: new Date(),
      lastActivity: new Date(),
      tags: customerData.tags || [],
      notes: customerData.notes
    };
    setCustomers([newCustomer, ...customers]);
    setShowForm(false);
  };

  const handleUpdateCustomer = (customerData: Partial<Customer>) => {
    if (selectedCustomer) {
      setCustomers(customers.map(customer => 
        customer.id === selectedCustomer.id 
          ? { ...customer, ...customerData, lastActivity: new Date() }
          : customer
      ));
      setSelectedCustomer(null);
      setShowForm(false);
    }
  };

  const handleDeleteCustomer = (customerId: string) => {
    setCustomers(customers.filter(customer => customer.id !== customerId));
  };

  const handleImport = (importedData: any[]) => {
    const newCustomers: Customer[] = importedData.map((data, index) => ({
      id: `imported-${Date.now()}-${index}`,
      name: data.name || '',
      email: data.email || '',
      phone: data.phone,
      company: data.company,
      addresses: [],
      language: data.language || 'English',
      currency: data.currency || 'USD',
      totalValue: parseFloat(data.totalValue) || 0,
      createdAt: new Date(),
      lastActivity: new Date(),
      tags: data.tags ? data.tags.split(',').map((tag: string) => tag.trim()) : [],
      notes: data.notes
    }));
    setCustomers([...newCustomers, ...customers]);
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = !filters.search || 
      customer.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      customer.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      customer.company?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesLanguage = !filters.language || customer.language === filters.language;
    const matchesCurrency = !filters.currency || customer.currency === filters.currency;
    
    const matchesMinValue = !filters.totalValueMin || customer.totalValue >= parseFloat(filters.totalValueMin);
    const matchesMaxValue = !filters.totalValueMax || customer.totalValue <= parseFloat(filters.totalValueMax);
    
    const matchesCreatedAfter = !filters.createdAfter || 
      new Date(customer.createdAt) >= new Date(filters.createdAfter);
    const matchesCreatedBefore = !filters.createdBefore || 
      new Date(customer.createdAt) <= new Date(filters.createdBefore);
    
    const matchesTags = filters.tags.length === 0 || 
      filters.tags.some((tag: string) => customer.tags.includes(tag));

    return matchesSearch && matchesLanguage && matchesCurrency && 
           matchesMinValue && matchesMaxValue && matchesCreatedAfter && 
           matchesCreatedBefore && matchesTags;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-2">Manage your customer database and relationships</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAdvancedFilters(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Advanced Filters</span>
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => {
              setSelectedCustomer(null);
              setShowForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Customer</span>
          </button>
        </div>
      </div>

      <CustomerFilters filters={filters} onFiltersChange={setFilters} />

      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {filteredCustomers.length} of {customers.length} customers
          </div>
        </div>
        
        <CustomersList
          customers={filteredCustomers}
          onEditCustomer={(customer) => {
            setSelectedCustomer(customer);
            setShowForm(true);
          }}
          onDeleteCustomer={handleDeleteCustomer}
        />
      </div>

      {showForm && (
        <CustomerForm
          customer={selectedCustomer}
          onSubmit={selectedCustomer ? handleUpdateCustomer : handleCreateCustomer}
          onCancel={() => {
            setShowForm(false);
            setSelectedCustomer(null);
          }}
        />
      )}

      <ImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
        entityType="customers"
        sampleData={sampleCustomerData}
      />

      <ExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        data={filteredCustomers}
        entityType="customers"
      />

      <AdvancedFilters
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filters}
        onFiltersChange={setFilters}
        filterConfigs={customerFilterConfigs}
        onApply={() => {}}
        onReset={() => setFilters({
          search: '',
          language: '',
          currency: '',
          totalValueMin: '',
          totalValueMax: '',
          createdAfter: '',
          createdBefore: '',
          tags: []
        })}
      />
    </div>
  );
};