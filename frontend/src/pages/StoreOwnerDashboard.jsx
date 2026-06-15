import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import Navbar from '../components/Navbar';
import SortableTable from '../components/SortableTable';
import PasswordForm from '../components/PasswordForm';

export default function StoreOwnerDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [raters, setRaters] = useState([]);
  const [sort, setSort] = useState({ sortBy: 'name', sortOrder: 'asc' });
  const [tab, setTab] = useState('dashboard');

  const fetchDashboard = useCallback(() => {
    api.get('/store-owner/dashboard').then((res) => setDashboard(res.data));
  }, []);

  const fetchRaters = useCallback(() => {
    api.get('/store-owner/raters', { params: sort }).then((res) => setRaters(res.data));
  }, [sort]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);
  useEffect(() => { if (tab === 'raters') fetchRaters(); }, [tab, fetchRaters]);

  const columns = [
    { key: 'name', label: 'Name', sortField: 'name' },
    { key: 'email', label: 'Email', sortField: 'email' },
    { key: 'address', label: 'Address', sortField: 'address' },
    {
      key: 'rating',
      label: 'Rating Given',
      sortField: 'rating',
      render: (row) => `${row.rating} / 5`,
    },
  ];

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Store Owner Dashboard</h1>
        </div>

        <div className="tabs">
          <button className={`tab ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>
            Dashboard
          </button>
          <button className={`tab ${tab === 'raters' ? 'active' : ''}`} onClick={() => setTab('raters')}>
            User Ratings
          </button>
          <button className={`tab ${tab === 'password' ? 'active' : ''}`} onClick={() => setTab('password')}>
            Update Password
          </button>
        </div>

        {tab === 'dashboard' && dashboard && (
          <>
            {dashboard.store ? (
              <>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value">{dashboard.averageRating}</div>
                    <div className="stat-label">Average Rating for {dashboard.store.name}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{dashboard.raters.length}</div>
                    <div className="stat-label">Total Ratings Received</div>
                  </div>
                </div>
                <div className="card">
                  <h2 className="card-title">Recent Raters</h2>
                  {dashboard.raters.length === 0 ? (
                    <p className="empty-state">No ratings yet</p>
                  ) : (
                    <SortableTable
                      columns={columns}
                      data={dashboard.raters}
                      sortBy={sort.sortBy}
                      sortOrder={sort.sortOrder}
                      onSort={(sortBy, sortOrder) => setSort({ sortBy, sortOrder })}
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="card">
                <p className="empty-state">{dashboard.message || 'No store assigned to your account'}</p>
              </div>
            )}
          </>
        )}

        {tab === 'raters' && (
          <div className="card">
            <h2 className="card-title">Users Who Rated Your Store</h2>
            <SortableTable
              columns={columns}
              data={raters}
              sortBy={sort.sortBy}
              sortOrder={sort.sortOrder}
              onSort={(sortBy, sortOrder) => setSort({ sortBy, sortOrder })}
            />
          </div>
        )}

        {tab === 'password' && <PasswordForm />}
      </div>
    </>
  );
}
