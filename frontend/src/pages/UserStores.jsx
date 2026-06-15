import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import Navbar from '../components/Navbar';
import SortableTable from '../components/SortableTable';
import PasswordForm from '../components/PasswordForm';

function RatingStars({ value, onChange, readonly = false }) {
  return (
    <div className="rating-stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-btn ${star <= value ? 'active' : ''}`}
          onClick={() => !readonly && onChange(star)}
          disabled={readonly}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function RatingModal({ store, onClose, onSuccess }) {
  const [rating, setRating] = useState(store.user_rating || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isUpdate = store.user_rating !== null && store.user_rating !== undefined;

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      setError('Please select a rating between 1 and 5');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (isUpdate) {
        await api.put(`/stores/${store.id}/ratings`, { rating });
      } else {
        await api.post(`/stores/${store.id}/ratings`, { rating });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="card-title">{isUpdate ? 'Update Rating' : 'Submit Rating'}</h2>
        <p><strong>{store.name}</strong></p>
        {error && <div className="alert alert-error">{error}</div>}
        <div style={{ margin: '1rem 0' }}>
          <label>Your Rating:</label>
          <RatingStars value={rating} onChange={setRating} />
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : isUpdate ? 'Update Rating' : 'Submit Rating'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserStores() {
  const [stores, setStores] = useState([]);
  const [filters, setFilters] = useState({ name: '', address: '' });
  const [sort, setSort] = useState({ sortBy: 'name', sortOrder: 'asc' });
  const [selectedStore, setSelectedStore] = useState(null);
  const [tab, setTab] = useState('stores');

  const fetchStores = useCallback(() => {
    const params = { ...filters, ...sort };
    api.get('/stores', { params }).then((res) => setStores(res.data));
  }, [filters, sort]);

  useEffect(() => {
    const timer = setTimeout(fetchStores, 300);
    return () => clearTimeout(timer);
  }, [fetchStores]);

  const columns = [
    { key: 'name', label: 'Store Name', sortField: 'name' },
    { key: 'address', label: 'Address', sortField: 'address' },
    {
      key: 'overall_rating',
      label: 'Overall Rating',
      sortField: 'overall_rating',
      render: (row) => `${row.overall_rating} / 5`,
    },
    {
      key: 'user_rating',
      label: 'Your Rating',
      render: (row) => (row.user_rating != null ? `${row.user_rating} / 5` : 'Not rated'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button className="btn btn-primary btn-sm" onClick={() => setSelectedStore(row)}>
          {row.user_rating != null ? 'Modify Rating' : 'Submit Rating'}
        </button>
      ),
    },
  ];

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Store Ratings</h1>
        </div>

        <div className="tabs">
          <button className={`tab ${tab === 'stores' ? 'active' : ''}`} onClick={() => setTab('stores')}>
            Browse Stores
          </button>
          <button className={`tab ${tab === 'password' ? 'active' : ''}`} onClick={() => setTab('password')}>
            Update Password
          </button>
        </div>

        {tab === 'stores' && (
          <div className="card">
            <div className="filters">
              <input
                placeholder="Search by Name"
                value={filters.name}
                onChange={(e) => setFilters((p) => ({ ...p, name: e.target.value }))}
              />
              <input
                placeholder="Search by Address"
                value={filters.address}
                onChange={(e) => setFilters((p) => ({ ...p, address: e.target.value }))}
              />
            </div>
            <SortableTable
              columns={columns}
              data={stores}
              sortBy={sort.sortBy}
              sortOrder={sort.sortOrder}
              onSort={(sortBy, sortOrder) => setSort({ sortBy, sortOrder })}
            />
          </div>
        )}

        {tab === 'password' && <PasswordForm />}
      </div>

      {selectedStore && (
        <RatingModal
          store={selectedStore}
          onClose={() => setSelectedStore(null)}
          onSuccess={fetchStores}
        />
      )}
    </>
  );
}
