import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as api from '../../api';
import CaseDetailModal from './CaseDetailModal'; // Import the modal

function AdminCaseAudit({ setView }) {
    const [cases, setCases] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCase, setSelectedCase] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [casesRes, usersRes] = await Promise.all([
                api.getAllAdminCases(),
                api.getAllUsers(),
            ]);
            setCases(casesRes.data);
            setUsers(usersRes.data);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleReassign = async (caseId, newAssessorId) => {
        if (!newAssessorId) return;
        try {
            await api.reassignCase(caseId, newAssessorId);
            alert('Case reassigned successfully!');
            fetchData(); // Refresh list
        } catch (error) {
            alert('Failed to reassign case.');
        }
    };
    
    const assessors = useMemo(() => users.filter(u => u.role === 'Assessor' && u.status === 'Active'), [users]);
    
    const filteredCases = useMemo(() => 
        cases.filter(c => 
            c.drawing?.childId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.assessor?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.status.toLowerCase().includes(searchTerm.toLowerCase())
        ), [cases, searchTerm]);

    return (
        <div className="dashboard-main">
            <CaseDetailModal caseData={selectedCase} onClose={() => setSelectedCase(null)} />

            <div className="dashboard-header-section">
                <h2 className="dashboard-title">Case Audit & Reassignment</h2>
                <p className="dashboard-subtitle">Review, audit, and manage all assessment cases</p>
            </div>

            <div className="dashboard-section">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                    <h3 className="section-title" style={{margin: 0}}>All Cases ({filteredCases.length})</h3>
                    <input 
                        type="text" 
                        placeholder="Search by Child ID, Assessor, or Status..." 
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner-large"></div>
                        <p>Loading cases...</p>
                    </div>
                ) : (
                    <div className="modern-table-container">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>CHILD ID</th>
                                    <th>UPLOAD DATE</th>
                                    <th>ASSIGNED TO</th>
                                    <th>STATUS</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCases.map(c => (
                                    <tr key={c._id} onClick={() => setSelectedCase(c)} style={{ cursor: 'pointer' }}>
                                        <td>
                                            <span style={{fontWeight: '600', color: '#1e293b'}}>{c.drawing?.childId}</span>
                                        </td>
                                        <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            {c.assessor?.username ? (
                                                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                                    <div style={{width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: '600'}}>
                                                        {c.assessor.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    {c.assessor.username}
                                                </div>
                                            ) : (
                                                <span style={{color: '#94a3b8'}}>Unassigned</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${c.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td onClick={e => e.stopPropagation()}>
                                            <select 
                                                className="reassign-select" 
                                                defaultValue="" 
                                                onChange={(e) => handleReassign(c._id, e.target.value)}
                                            >
                                                <option value="" disabled>Reassign to...</option>
                                                {assessors.map(a => <option key={a._id} value={a._id}>{a.username}</option>)}
                                            </select>
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

export default AdminCaseAudit;