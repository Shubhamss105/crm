import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { customerService } from '../../services/customerService';
import { CustomersList } from './CustomersList';
import { CustomerForm } from './CustomerForm';
import { CustomerFilters } from './CustomerFilters';
import { ImportModal } from '../Common/ImportModal';
import { ExportModal } from '../Common/ExportModal';
import { AdvancedFilters } from '../Common/AdvancedFilters';
import { Customer } from '../../types';
import { Plus, Upload, Download, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

// Updated to reflect potential backend fields and types
const customerFilterConfigs = [
  { key: 'search', label: 'Search', type: 'text' as const, placeholder: 'Search customers...' },
  {
    key: 'language',
    label: 'Language',
    type: 'select' as const,
    options: [
      { value: 'English', label: 'English' },
      { value: 'Spanish', label: 'Spanish' },
      { value: 'French', label: 'French' },
      { value: 'German', label: 'German' },
      // Add more languages as needed
    ]
  },
  {
    key: 'currency',
    label: 'Currency',
    type: 'select' as const,
    options: [
      { value: 'USD', label: 'USD' },
      { value: 'EUR', label: 'EUR' },
      { value: 'GBP', label: 'GBP' },
      { value: 'CAD', label: 'CAD' },
      // Add more currencies as needed
    ]
  },
  { key: 'total_value_min', label: 'Min Total Value', type: 'number' as const, placeholder: '0' },
  { key: 'total_value_max', label: 'Max Total Value', type: 'number' as const, placeholder: '1000000' },
  { key: 'created_at_after', label: 'Created After', type: 'date' as const },
  { key: 'created_at_before', label: 'Created Before', type: 'date' as const },
  {
    key: 'tags',
    label: 'Tags',
    type: 'multiselect' as const,
    // These should ideally be fetched or dynamically generated
    options: [
      { value: 'enterprise', label: 'Enterprise' },
      { value: 'vip', label: 'VIP' },
      { value: 'loyal', label: 'Loyal Customer' },
      { value: 'new', label: 'New Customer' },
    ]
  }
];

// Updated to reflect Customer type from schema
const sampleCustomerData = {
  name: 'Acme Corp',
  email: 'contact@acme.com',
  phone: '+1-555-0100',
  company: 'Acme Corporation',
  language: 'English',
  currency: 'USD',
  total_value: '75000', // Supabase might store numbers as numbers, not strings
  tags: 'enterprise,vip', // Tags likely an array of strings
  notes: 'Long-term client, high potential for upsell.'
};


export const CustomersPage: React.FC = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    language: '',
    currency: '',
    total_value_min: '',
    total_value_max: '',
    created_at_after: '',
    created_at_before: '',
    tags: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const limit = 10;

  useEffect(() => {
    if (!user) {
      setError('You must be logged in to view customers.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // TODO: Pass filters to customerService.getCustomers for server-side filtering
        const { data, total } = await customerService.getCustomers(user.id, currentPage, limit);
        setCustomers(data);
        setTotalCustomers(total);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const subscription = customerService.subscribeToCustomers(user.id, (payload) => {
      console.log('Customer subscription payload:', payload);
      if (payload.eventType === 'INSERT') {
        // Add to list if on page 1 or refresh to maintain order
        // For simplicity, we can just refetch the current page or update total and let user navigate
        setTotalCustomers((prev) => prev + 1);
        if (currentPage === 1) { // Only add if on the first page to avoid layout shifts on other pages
             // Check if customer already exists to prevent duplicates from rapid events
            setCustomers(prev => prev.find(c => c.id === payload.new.id) ? prev : [payload.new as Customer, ...prev].slice(0, limit));
        }
      } else if (payload.eventType === 'UPDATE') {
        setCustomers((prev) =>
          prev.map((customer) => (customer.id === payload.new.id ? (payload.new as Customer) : customer))
        );
      } else if (payload.eventType === 'DELETE') {
        setCustomers((prev) => prev.filter((customer) => customer.id !== payload.old.id));
        setTotalCustomers((prev) => prev - 1);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user, currentPage]); // Add filters to dependency array when server-side filtering is implemented

  const handleCreateCustomer = async (customerData: Partial<Customer>) => {
    if (!user) return;
    try {
      // customerService.createCustomer will set user_id, created_at, etc.
      await customerService.createCustomer(customerData, user.id);
      setShowForm(false);
      // Optionally, navigate to page 1 or refresh current page
      if (currentPage !== 1) setCurrentPage(1); // Go to first page where new item will appear
      else { // If already on page 1, refetch to see the new customer
        const { data, total } = await customerService.getCustomers(user.id, 1, limit);
        setCustomers(data);
        setTotalCustomers(total);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateCustomer = async (customerData: Partial<Customer>) => {
    if (!user || !selectedCustomer) return;
    try {
      await customerService.updateCustomer(selectedCustomer.id, customerData, user.id);
      setSelectedCustomer(null);
      setShowForm(false);
      // No need to manually update state if subscription is working correctly for updates
      // However, for immediate feedback, you might refetch or update locally:
      // const { data, total } = await customerService.getCustomers(user.id, currentPage, limit);
      // setCustomers(data);
      // setTotalCustomers(total);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!user) return;
    try {
      await customerService.deleteCustomer(customerId, user.id);
      // State will be updated by subscription, or refetch if desired for immediate effect
      // const { data, total } = await customerService.getCustomers(user.id, currentPage, limit);
      // setCustomers(data);
      // setTotalCustomers(total);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleImport = async (importedData: any[]) => {
    if (!user) return;
    try {
      const customerPromises = importedData.map(data => {
        const newCustomer: Partial<Customer> = {
          name: data.name || '',
          email: data.email || '',
          phone: data.phone,
          company: data.company,
          addresses: data.addresses ? JSON.parse(data.addresses) : [], // Assuming addresses is JSON string
          language: data.language || 'English',
          currency: data.currency || 'USD',
          total_value: parseFloat(data.total_value) || 0,
          tags: data.tags ? data.tags.split(',').map((tag: string) => tag.trim()) : [],
          notes: data.notes
        };
        return customerService.createCustomer(newCustomer, user.id);
      });
      await Promise.all(customerPromises);
      setShowImport(false);
      setCurrentPage(1); // Reset to first page on import
      // Refetch data for the current page after import
      const { data, total } = await customerService.getCustomers(user.id, 1, limit);
      setCustomers(data);
      setTotalCustomers(total);
    } catch (err: any) {
      setError(`Import failed: ${err.message}`);
    }
  };

  // Client-side filtering for now. Ideally, this should be server-side.
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = !filters.search ||
      customer.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      customer.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      (customer.company && customer.company.toLowerCase().includes(filters.search.toLowerCase()));
    
    const matchesLanguage = !filters.language || customer.language === filters.language;
    const matchesCurrency = !filters.currency || customer.currency === filters.currency;
    
    const matchesMinValue = !filters.total_value_min || (customer.total_value && customer.total_value >= parseFloat(filters.total_value_min));
    const matchesMaxValue = !filters.total_value_max || (customer.total_value && customer.total_value <= parseFloat(filters.total_value_max));
    
    const matchesCreatedAfter = !filters.created_at_after ||
      new Date(customer.created_at) >= new Date(filters.created_at_after);
    const matchesCreatedBefore = !filters.created_at_before ||
      new Date(customer.created_at) <= new Date(filters.created_at_before);
    
    const matchesTags = filters.tags.length === 0 || 
      (customer.tags && filters.tags.every((tag: string) => customer.tags.includes(tag)));

    return matchesSearch && matchesLanguage && matchesCurrency && 
           matchesMinValue && matchesMaxValue && matchesCreatedAfter && 
           matchesCreatedBefore && matchesTags;
  });

  const totalPages = Math.ceil(totalCustomers / limit);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (!user && !loading) { // Show login prompt only if not loading and no user
    return <div className="p-6 text-red-600">Please log in to access the customers page.</div>;
  }

  if (loading) {
    return <div className="p-6 text-center">Loading customers...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }

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
            Showing {filteredCustomers.length} of {totalCustomers} customers
          </div>
        </div>
        
        <CustomersList
          customers={filteredCustomers} // Use filteredCustomers for display
          onEditCustomer={(customer) => {
            setSelectedCustomer(customer);
            setShowForm(true);
          }}
          onDeleteCustomer={handleDeleteCustomer}
        />

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {/* Simplified pagination: show current, next 2, prev 2, first, last */}
              {/* For a more robust solution, consider a pagination component */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page =>
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage -1 && page <= currentPage + 1)
                )
                .map((page, index, arr) => (
                    <React.Fragment key={page}>
                      {index > 0 && arr[index-1] !== page -1 && <span className="px-2">...</span>}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 rounded-lg ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
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
        sampleData={sampleCustomerData} // Use updated sampleCustomerData
      />

      <ExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        data={filteredCustomers} // Export filtered data
        entityType="customers"
      />

      <AdvancedFilters
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filters}
        onFiltersChange={setFilters}
        filterConfigs={customerFilterConfigs} // Use updated filterConfigs
        onApply={() => {
          // When server-side filtering is done, trigger refetch here
          setCurrentPage(1); // Reset to page 1 when applying new filters
          // fetchData(); // or similar to refetch with new filters
        }}
        onReset={() => {
          setFilters({
            search: '',
            language: '',
            currency: '',
            total_value_min: '',
            total_value_max: '',
            created_at_after: '',
            created_at_before: '',
            tags: []
          });
          setCurrentPage(1);
           // fetchData(); // or similar to refetch with reset filters
        }}
      />
    </div>
  );
};