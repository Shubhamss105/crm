import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { customerService } from '../../services/customerService';
import { CustomersList } from './CustomersList';
import { CustomerForm } from './CustomerForm';
import { CustomerFilters } from './CustomerFilters';
import { ImportModal } from '../Common/ImportModal';
import { ExportModal } from '../Common/ExportModal';
import { AdvancedFilters } from '../Common/AdvancedFilters';
import { Customer } from '../../types';
import { Plus, Upload, Download, Filter, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

const customerFilterConfigs = [
  { key: 'search', label: 'Search', type: 'text' as const, placeholder: 'Search customers...' },
  {
    key: 'language',
    label: 'Language',
    type: 'select' as const,
    options: [ { value: 'English', label: 'English' }, { value: 'Spanish', label: 'Spanish' } ]
  },
  {
    key: 'currency',
    label: 'Currency',
    type: 'select' as const,
    options: [ { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }]
  },
  { key: 'total_value_min', label: 'Min Total Value', type: 'number' as const, placeholder: '0' },
  { key: 'total_value_max', label: 'Max Total Value', type: 'number' as const, placeholder: '1000000' },
  { key: 'created_at_after', label: 'Created After', type: 'date' as const },
  { key: 'created_at_before', label: 'Created Before', type: 'date' as const },
  {
    key: 'tags',
    label: 'Tags',
    type: 'multiselect' as const,
    options: [ { value: 'enterprise', label: 'Enterprise' }, { value: 'vip', label: 'VIP' } ]
  }
];

const sampleCustomerData = {
  name: 'Sample Customer Inc.',
  email: 'contact@samplecustomer.com',
  phone: '+1-555-0101',
  company: 'Sample Customer Inc.',
  language: 'English',
  currency: 'USD',
  total_value: '50000',
  tags: 'vip',
  notes: 'Initial prospect from webinar.'
};

export const CustomersPage: React.FC = () => {
  const { user, permissions, getModulePermissions, canView, can } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [activeFilters, setActiveFilters] = useState({
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

  const customersModulePermissions = getModulePermissions('customers');

  const fetchData = useCallback(async () => {
    if (!user || !customersModulePermissions || !canView('customers')) {
      setError(customersModulePermissions === undefined && user ? 'Permissions not loaded. Please wait or refresh.' : 'You do not have permission to view customers.');
      setLoading(false);
      setCustomers([]);
      setTotalCustomers(0);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { data, total } = await customerService.getCustomers(
        user.user_id,
        currentPage,
        limit,
        customersModulePermissions
      );
      setCustomers(data);
      setTotalCustomers(total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, currentPage, limit, customersModulePermissions, canView, activeFilters]);

  useEffect(() => {
    if (user && permissions) {
        fetchData();
    }
  }, [user, permissions, fetchData]);

  useEffect(() => {
    if (!user || !customersModulePermissions) return;

    const subscription = customerService.subscribeToCustomers(user.user_id, (payload) => {
      fetchData();
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [user, customersModulePermissions, fetchData]);

  const handleCreateCustomer = async (customerData: Partial<Customer>) => {
    if (!user || !can('customers', 'create')) {
      setError("You don't have permission to create customers.");
      return;
    }
    try {
      await customerService.createCustomer(customerData, user.user_id);
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateCustomer = async (customerData: Partial<Customer>) => {
    if (!user || !selectedCustomer || !can('customers', 'edit')) {
      setError("You don't have permission to edit this customer.");
      return;
    }
    try {
      await customerService.updateCustomer(selectedCustomer.id, customerData, user.user_id);
      setSelectedCustomer(null);
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!user || !can('customers', 'delete')) {
      setError("You don't have permission to delete customers.");
      return;
    }
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await customerService.deleteCustomer(customerId, user.user_id);
        fetchData();
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const handleImport = async (importedData: any[]) => {
    if (!user || !can('customers', 'create')) {
      setError("You don't have permission to import (create) customers.");
      return;
    }
    try {
      const customerPromises = importedData.map(item => {
        const newCustomer: Partial<Customer> = {
          name: item.name || 'Imported Customer',
          email: item.email,
          phone: item.phone,
          company: item.company,
          language: item.language || 'English',
          currency: item.currency || 'USD',
          total_value: parseFloat(item.total_value) || 0,
          tags: item.tags ? String(item.tags).split(',').map((tag: string) => tag.trim()) : [],
          notes: item.notes,
        };
        return customerService.createCustomer(newCustomer, user.user_id);
      });
      await Promise.all(customerPromises);
      setShowImport(false);
      fetchData();
    } catch (err: any) {
      setError(`Import failed: ${err.message}`);
    }
  };

  const clientFilteredCustomers = customers.filter(customer => {
    const matchesSearch = !activeFilters.search ||
      customer.name.toLowerCase().includes(activeFilters.search.toLowerCase()) ||
      customer.email.toLowerCase().includes(activeFilters.search.toLowerCase()) ||
      (customer.company && customer.company.toLowerCase().includes(activeFilters.search.toLowerCase()));
    return matchesSearch;
  });

  const totalPages = Math.ceil(totalCustomers / limit);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (!user || !permissions) {
    return <div className="p-6">{loading ? 'Loading authentication details...' : 'Please log in.'}</div>;
  }

  if (!canView('customers')) {
    return (
      <div className="p-6 max-w-7xl mx-auto text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Access Denied</h2>
        <p className="text-gray-500">You do not have permission to view this module.</p>
      </div>
    );
  }

  if (loading && customers.length === 0) {
    return <div className="p-6 text-center">Loading customers...</div>;
  }

  if (error && customers.length === 0) {
     return (
        <div className="p-6 max-w-7xl mx-auto text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-700">Error</h2>
            <p className="text-gray-500">{error}</p>
        </div>
     );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {error && customers.length > 0 && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-400 rounded">{error}</div>}
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
          {can('customers', 'create') && (
            <button
              onClick={() => setShowImport(true)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Import</span>
            </button>
          )}
          <button
            onClick={() => setShowExport(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          {can('customers', 'create') && (
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
          )}
        </div>
      </div>

      <CustomerFilters filters={activeFilters} onFiltersChange={setActiveFilters} />

      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {clientFilteredCustomers.length} of {totalCustomers} customers
          </div>
        </div>
        
        <CustomersList
          customers={clientFilteredCustomers}
          canEdit={can('customers', 'edit')}
          canDelete={can('customers', 'delete')}
          onEditCustomer={(customer) => {
            if (can('customers', 'edit')) {
              setSelectedCustomer(customer);
              setShowForm(true);
            } else {
              alert("You don't have permission to edit customers.");
            }
          }}
          onDeleteCustomer={handleDeleteCustomer}
        />

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

      {showForm && (can('customers', 'create') || (selectedCustomer !== null && can('customers', 'edit'))) && (
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
        isOpen={showImport && can('customers', 'create')}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
        entityType="customers"
        sampleData={sampleCustomerData}
      />

      <ExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        data={clientFilteredCustomers}
        entityType="customers"
      />

      <AdvancedFilters
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={activeFilters}
        onFiltersChange={setActiveFilters}
        filterConfigs={customerFilterConfigs}
        onApply={() => {
          setCurrentPage(1);
          fetchData();
        }}
        onReset={() => {
          setActiveFilters({
            search: '', language: '', currency: '',
            total_value_min: '', total_value_max: '',
            created_at_after: '', created_at_before: '', tags: []
          });
          setCurrentPage(1);
          fetchData();
        }}
      />
    </div>
  );
};