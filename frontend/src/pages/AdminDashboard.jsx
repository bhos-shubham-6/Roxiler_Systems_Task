import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import Navbar from '../components/Navbar';
import SortableTable from '../components/SortableTable';
import { validateForm } from '../utils/validation';

function UserFormModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    address: '',
    password: '',
    role: 'user',
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const validationErrors = validateForm(form);
    if (!form.role) validationErrors.role = 'Role is required';
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin/users', form);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="card-title">Add New User</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input name="name" value={form.name} onChange={handleChange} />
            {errors.name && <div className="error">{errors.name}</div>}
          </div>
          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} />
            {errors.email && <div className="error">{errors.email}</div>}
          </div>
          <div className="form-group">
            <label>Address</label>
            <textarea name="address" value={form.address} onChange={handleChange} rows={2} />
            {errors.address && <div className="error">{errors.address}</div>}
          </div>
          <div className="form-group">
            <label>Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} />
            {errors.password && <div className="error">{errors.password}</div>}
          </div>
          <div className="form-group">
            <label>Role</label>
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="user">Normal User</option>
              <option value="admin">System Administrator</option>
              <option value="store_owner">Store Owner</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StoreFormModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', email: '', address: '', ownerId: '' });
  const [storeOwners, setStoreOwners] = useState([]);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/admin/users', { params: { role: 'store_owner' } })
      .then((res) => setStoreOwners(res.data));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin/stores', {
        ...form,
        ownerId: form.ownerId ? parseInt(form.ownerId, 10) : null,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create store');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="card-title">Add New Store</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Store Name</label>
            <input name="name" value={form.name} onChange={handleChange} />
            {errors.name && <div className="error">{errors.name}</div>}
          </div>
          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} />
            {errors.email && <div className="error">{errors.email}</div>}
          </div>
          <div className="form-group">
            <label>Address</label>
            <textarea name="address" value={form.address} onChange={handleChange} rows={2} />
            {errors.address && <div className="error">{errors.address}</div>}
          </div>
          <div className="form-group">
            <label>Store Owner (optional)</label>
            <select name="ownerId" value={form.ownerId} onChange={handleChange}>
              <option value="">-- Select Owner --</option>
              {storeOwners.map((o) => (
                <option key={o.id} value={o.id}>{o.name} ({o.email})</option>
              ))}
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserDetailModal({ userId, onClose }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/admin/users/${userId}`)
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="card-title">User Details</h2>
        {loading ? (
          <p>Loading...</p>
        ) : user ? (
          <div>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Address:</strong> {user.address}</p>
            <p>
              <strong>Role:</strong>{' '}
              <span className={`badge badge-${user.role}`}>{user.role.replace('_', ' ')}</span>
            </p>
            {user.role === 'store_owner' && user.stores && (
              <div style={{ marginTop: '1rem' }}>
                <strong>Store Rating(s):</strong>
                {user.stores.length === 0 ? (
                  <p>No stores assigned</p>
                ) : (
                  <ul>
                    {user.stores.map((s) => (
                      <li key={s.id}>{s.name}: {s.average_rating} / 5</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        ) : (
          <p>User not found</p>
        )}
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [userFilters, setUserFilters] = useState({ name: '', email: '', address: '', role: '' });
  const [storeFilters, setStoreFilters] = useState({ name: '', email: '', address: '' });
  const [userSort, setUserSort] = useState({ sortBy: 'name', sortOrder: 'asc' });
  const [storeSort, setStoreSort] = useState({ sortBy: 'name', sortOrder: 'asc' });
  const [showUserForm, setShowUserForm] = useState(false);
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const fetchStats = useCallback(() => {
    api.get('/admin/dashboard').then((res) => setStats(res.data));
  }, []);

  const fetchUsers = useCallback(() => {
    const params = { ...userFilters, ...userSort };
    api.get('/admin/users', { params }).then((res) => setUsers(res.data));
  }, [userFilters, userSort]);

  const fetchStores = useCallback(() => {
    const params = { ...storeFilters, ...storeSort };
    api.get('/admin/stores', { params }).then((res) => setStores(res.data));
  }, [storeFilters, storeSort]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { if (tab === 'users') fetchUsers(); }, [tab, fetchUsers]);
  useEffect(() => { if (tab === 'stores') fetchStores(); }, [tab, fetchStores]);

  const userColumns = [
    { key: 'name', label: 'Name', sortField: 'name' },
    { key: 'email', label: 'Email', sortField: 'email' },
    { key: 'address', label: 'Address', sortField: 'address' },
    {
      key: 'role',
      label: 'Role',
      sortField: 'role',
      render: (row) => (
        <span className={`badge badge-${row.role}`}>{row.role.replace('_', ' ')}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button className="btn btn-secondary btn-sm" onClick={() => setSelectedUserId(row.id)}>
          View Details
        </button>
      ),
    },
  ];

  const storeColumns = [
    { key: 'name', label: 'Name', sortField: 'name' },
    { key: 'email', label: 'Email', sortField: 'email' },
    { key: 'address', label: 'Address', sortField: 'address' },
    {
      key: 'rating',
      label: 'Rating',
      sortField: 'rating',
      render: (row) => `${row.rating} / 5`,
    },
  ];

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Admin Dashboard</h1>
        </div>

        <div className="tabs">
          <button className={`tab ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>
            Dashboard
          </button>
          <button className={`tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
            Users
          </button>
          <button className={`tab ${tab === 'stores' ? 'active' : ''}`} onClick={() => setTab('stores')}>
            Stores
          </button>
        </div>

        {tab === 'dashboard' && stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.totalUsers}</div>
              <div className="stat-label">Total Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.totalStores}</div>
              <div className="stat-label">Total Stores</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.totalRatings}</div>
              <div className="stat-label">Total Ratings</div>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="card">
            <div className="page-header">
              <h2 className="card-title" style={{ margin: 0 }}>Users</h2>
              <button className="btn btn-primary" onClick={() => setShowUserForm(true)}>
                Add User
              </button>
            </div>
            <div className="filters">
              <input placeholder="Filter by Name" value={userFilters.name}
                onChange={(e) => setUserFilters((p) => ({ ...p, name: e.target.value }))} />
              <input placeholder="Filter by Email" value={userFilters.email}
                onChange={(e) => setUserFilters((p) => ({ ...p, email: e.target.value }))} />
              <input placeholder="Filter by Address" value={userFilters.address}
                onChange={(e) => setUserFilters((p) => ({ ...p, address: e.target.value }))} />
              <select value={userFilters.role}
                onChange={(e) => setUserFilters((p) => ({ ...p, role: e.target.value }))}>
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">Normal User</option>
                <option value="store_owner">Store Owner</option>
              </select>
            </div>
            <SortableTable
              columns={userColumns}
              data={users}
              sortBy={userSort.sortBy}
              sortOrder={userSort.sortOrder}
              onSort={(sortBy, sortOrder) => setUserSort({ sortBy, sortOrder })}
            />
          </div>
        )}

        {tab === 'stores' && (
          <div className="card">
            <div className="page-header">
              <h2 className="card-title" style={{ margin: 0 }}>Stores</h2>
              <button className="btn btn-primary" onClick={() => setShowStoreForm(true)}>
                Add Store
              </button>
            </div>
            <div className="filters">
              <input placeholder="Filter by Name" value={storeFilters.name}
                onChange={(e) => setStoreFilters((p) => ({ ...p, name: e.target.value }))} />
              <input placeholder="Filter by Email" value={storeFilters.email}
                onChange={(e) => setStoreFilters((p) => ({ ...p, email: e.target.value }))} />
              <input placeholder="Filter by Address" value={storeFilters.address}
                onChange={(e) => setStoreFilters((p) => ({ ...p, address: e.target.value }))} />
            </div>
            <SortableTable
              columns={storeColumns}
              data={stores}
              sortBy={storeSort.sortBy}
              sortOrder={storeSort.sortOrder}
              onSort={(sortBy, sortOrder) => setStoreSort({ sortBy, sortOrder })}
            />
          </div>
        )}
      </div>

      {showUserForm && (
        <UserFormModal
          onClose={() => setShowUserForm(false)}
          onSuccess={fetchUsers}
        />
      )}
      {showStoreForm && (
        <StoreFormModal
          onClose={() => setShowStoreForm(false)}
          onSuccess={fetchStores}
        />
      )}
      {selectedUserId && (
        <UserDetailModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}
    </>
  );
}
