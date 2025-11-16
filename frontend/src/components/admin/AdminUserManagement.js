import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../../api';

// Simple Modal Component (can be extracted to its own file later)
const CreateUserModal = ({ show, onClose, onUserCreated }) => {
    const [userData, setUserData] = useState({ username: '', password: '', role: 'Uploader' });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.createUser(userData);
            alert('User created successfully!');
            onUserCreated();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create user. Username may already exist.');
        }
    };

    if (!show) return null;

    return (
        <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Create New User</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            {error && <div className="alert alert-danger">{error}</div>}
                            <div className="mb-3">
                                <label className="form-label">Username</label>
                                <input type="text" className="form-control" value={userData.username} onChange={e => setUserData({ ...userData, username: e.target.value })} required />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Password</label>
                                <input type="password" placeholder="Password" className="form-control" value={userData.password} onChange={e => setUserData({ ...userData, password: e.target.value })} required />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Role</label>
                                <select className="form-select" value={userData.role} onChange={e => setUserData({ ...userData, role: e.target.value })}>
                                    <option value="Uploader">Uploader</option>
                                    <option value="Assessor">Assessor (Psychologist)</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
                            <button type="submit" className="btn btn-primary">Create User</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};


function AdminUserManagement({ setView }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.getAllUsers();
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleToggleStatus = async (user) => {
        const action = user.status === 'Active' ? 'deactivate' : 'activate';
        const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';

        if (window.confirm(`Are you sure you want to ${action} user '${user.username}'?`)) {
            try {
                // For deactivation, we use the DELETE endpoint which sets status to Inactive
                // For activation, we use the PUT endpoint
                if (action === 'deactivate') {
                    await api.deleteUser(user._id);
                } else {
                    await api.updateUser(user._id, { status: newStatus });
                }
                alert(`User ${action}d successfully.`);
                fetchUsers(); // Refresh the list
            } catch (error) {
                alert(`Failed to ${action} user.`);
            }
        }
    };
    
    return (
        <div className="dashboard-main">
            <CreateUserModal 
                show={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onUserCreated={fetchUsers}
            />
            
            <div className="dashboard-header-section">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                        <h2 className="dashboard-title">User Management</h2>
                        <p className="dashboard-subtitle">Manage system users, roles, and permissions</p>
                    </div>
                    <button className="action-btn action-primary" style={{width: 'auto', padding: '0.75rem 2rem'}} onClick={() => setShowCreateModal(true)}>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width: '20px', height: '20px'}}>
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
                        </svg>
                        <span>Create New User</span>
                    </button>
                </div>
            </div>

            <div className="dashboard-section">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                    <h3 className="section-title" style={{margin: 0}}>System Users ({users.length})</h3>
                </div>
                
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner-large"></div>
                        <p>Loading users...</p>
                    </div>
                ) : (
                    <div className="modern-table-container">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>USERNAME</th>
                                    <th>ROLE</th>
                                    <th>STATUS</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user._id}>
                                        <td>
                                            <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                                                <div style={{width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '600'}}>
                                                    {user.username.charAt(0).toUpperCase()}
                                                </div>
                                                <span style={{fontWeight: '600', color: '#1e293b'}}>{user.username}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`role-badge role-${user.role.toLowerCase()}`}>{user.role}</span>
                                        </td>
                                        <td>
                                            <span className={user.status === 'Active' ? 'status-badge status-active' : 'status-badge status-inactive'}>
                                                {user.status === 'Active' ? '● Active' : '● Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{display: 'flex', gap: '0.5rem'}}>
                                                {user.status === 'Active' ? 
                                                    <button className="table-btn btn-danger" onClick={() => handleToggleStatus(user)}>Deactivate</button> : 
                                                    <button className="table-btn btn-success" onClick={() => handleToggleStatus(user)}>Activate</button>
                                                }
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminUserManagement;