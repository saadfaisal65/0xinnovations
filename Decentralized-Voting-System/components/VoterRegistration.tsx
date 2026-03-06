'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { supabase } from '../lib/supabase';
import { CheckCircle, Clock3, UserCheck, ShieldAlert, Fingerprint, XCircle, CheckSquare, XSquare } from 'lucide-react';
import CryptoJS from 'crypto-js';

const ucs = ['101', '102', '103', '104', '105', '106', '107', '108', '109', '110'];

type Registration = {
    id: string;
    full_name: string;
    email: string;
    cnic_number: string;
    hashed_cnic: string;
    wallet_address: string;
    uc_id: string;
    status: string;
    created_at: string;
};

export default function VoterRegistration() {
    const { account, isAdmin, contract } = useWallet();
    const [formData, setFormData] = useState({ fullName: '', email: '', cnic: '', ucId: ucs[0] });
    const [loading, setLoading] = useState(false);
    const [hasApplied, setHasApplied] = useState<{ applied: boolean, status: string }>({ applied: false, status: '' });
    const [pendingUsers, setPendingUsers] = useState<Registration[]>([]);
    const [registrationOpen, setRegistrationOpen] = useState(true);
    const [checkingStatus, setCheckingStatus] = useState(true);
    const [isCheckingUser, setIsCheckingUser] = useState(true);

    useEffect(() => {
        const loadAll = async () => {
            setIsCheckingUser(true);
            await fetchRegistrationStatus();
            if (account && !isAdmin) await checkUserStatus();
            if (isAdmin) await fetchPendingUsers();
            setIsCheckingUser(false);
        };
        loadAll();
    }, [account, isAdmin]);

    const getAdminSecret = () => {
        let sec = sessionStorage.getItem('admin_secret');
        if (!sec) {
            sec = prompt('Enter Admin Secure API Secret (Required for sensitive Database operations):');
            if (sec) sessionStorage.setItem('admin_secret', sec);
        }
        return sec || '';
    };

    const fetchRegistrationStatus = async () => {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            
            if (data && data.registration_open !== undefined) {
                setRegistrationOpen(data.registration_open === 'true' || data.registration_open === true);
            }
        } catch (err) {
            console.error('Error fetching registration status:', err);
        } finally {
            setCheckingStatus(false);
        }
    };

    const checkUserStatus = async () => {
        if (!account) return;
        try {
            const res = await fetch(`/api/registrations?wallet=${account.toLowerCase()}`);
            const { data, error } = await res.json();

            if (data) {
                setHasApplied({ applied: true, status: data.status });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchPendingUsers = async () => {
        if (!isAdmin) return;
        try {
            const res = await fetch('/api/registrations?status=pending');
            const { data, error } = await res.json();

            if (data) setPendingUsers(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!account) return alert('Wallet connection required.');

        setLoading(true);
        try {
            // Hash the CNIC for privacy and security
            const hashedCnicValue = CryptoJS.SHA256(formData.cnic).toString();

            const res = await fetch('/api/registrations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: formData.fullName,
                    cnic_number: formData.cnic,
                    hashed_cnic: hashedCnicValue,
                    uc_id: formData.ucId,
                    wallet_address: account.toLowerCase()
                })
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Failed to submit registration');

            setHasApplied({ applied: true, status: 'pending' });
        } catch (err: any) {
            alert(err.message || 'Error occurred');
        } finally {
            setLoading(false);
        }
    };

    const approveUser = async (user: Registration) => {
        if (!isAdmin) return alert('Unauthorized Action');
        if (!contract) return;
        setLoading(true);
        try {
            const tx = await contract.registerVoter(user.wallet_address, parseInt(user.uc_id));
            await tx.wait();

            const res = await fetch('/api/registrations', {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-admin-secret': getAdminSecret()
                },
                body: JSON.stringify({ id: user.id, status: 'approved' })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Database update failed');

            alert(`User ${user.full_name} approved successfully`);
            fetchPendingUsers();
        } catch (err: any) {
            console.error(err);
            alert('Approval failed on blockchain or database.');
        } finally {
            setLoading(false);
        }
    };

    const rejectUser = async (user: Registration) => {
        if (!isAdmin) return alert('Unauthorized Action');
        setLoading(true);
        try {
            const res = await fetch('/api/registrations', {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-admin-secret': getAdminSecret()
                },
                body: JSON.stringify({ id: user.id, status: 'rejected' })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Database update failed');

            alert(`User ${user.full_name} rejected successfully`);
            fetchPendingUsers();
        } catch (err: any) {
            console.error(err);
            alert('Rejection failed on database.');
        } finally {
            setLoading(false);
        }
    };

    const approveAll = async () => {
        if (!isAdmin || pendingUsers.length === 0) return alert('No pending users');
        if (!contract) return;
        setLoading(true);
        try {
            const voters = pendingUsers.map(u => u.wallet_address);
            const ucIds = pendingUsers.map(u => parseInt(u.uc_id));

            const tx = await contract.registerVotersBulk(voters, ucIds);
            await tx.wait();

            const promises = pendingUsers.map(u => fetch('/api/registrations', {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-admin-secret': getAdminSecret()
                },
                body: JSON.stringify({ id: u.id, status: 'approved' })
            }));
            await Promise.all(promises);

            alert(`${pendingUsers.length} users approved in bulk!`);
            fetchPendingUsers();
        } catch (err: any) {
            console.error(err);
            alert('Bulk approval failed on blockchain or database.');
        } finally {
            setLoading(false);
        }
    };

    const rejectAll = async () => {
        if (!isAdmin || pendingUsers.length === 0) return alert('No pending users');
        setLoading(true);
        try {
            const promises = pendingUsers.map(u => fetch('/api/registrations', {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-admin-secret': getAdminSecret()
                },
                body: JSON.stringify({ id: u.id, status: 'rejected' })
            }));
            await Promise.all(promises);

            alert(`${pendingUsers.length} users rejected in bulk!`);
            fetchPendingUsers();
        } catch (err: any) {
            console.error(err);
            alert('Bulk rejection failed on database.');
        } finally {
            setLoading(false);
        }
    };

    if (!account) {
        return (
            <div className="flex flex-col items-center justify-center p-10 text-center" style={{ color: 'var(--text-muted)' }}>
                <Fingerprint size={48} className="mb-4 opacity-50" style={{ color: 'var(--text-muted)' }} />
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Connect Wallet</h2>
                <p>Please connect your MetaMask wallet to apply for registration.</p>
            </div>
        );
    }

    if (isCheckingUser) {
        return <div className="p-10 text-center animate-pulse flex flex-col items-center gap-4" style={{ color: 'var(--text-muted)' }}>
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#c084fc', borderTopColor: 'transparent' }}></div>
            Verifying Identity State...
        </div>;
    }

    // --- ADMIN VIEW ---
    if (isAdmin) {
        return (
            <div className="space-y-6" style={{ animation: 'fadeSlideIn 0.5s ease-out' }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-black flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                            <UserCheck className="w-8 h-8" style={{ color: '#c084fc' }} />
                            Pending Approvals
                        </h2>
                        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Verify CNIC information and execute Blockchain registration.</p>
                    </div>

                    {pendingUsers.length > 0 && (
                        <div className="flex gap-3">
                            <button onClick={rejectAll} disabled={loading} className="theme-btn theme-btn-danger text-sm py-2 px-4 shadow-xl">
                                <XSquare size={16} /> Reject All
                            </button>
                            <button onClick={approveAll} disabled={loading} className="theme-btn theme-btn-success text-sm py-2 px-4 shadow-xl">
                                <CheckSquare size={16} /> Approve All (Tx)
                            </button>
                        </div>
                    )}
                </div>

                {pendingUsers.length === 0 ? (
                    <div className="p-8 text-center section-card" style={{ color: 'var(--text-muted)' }}>
                        No pending registration requests found.
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border-color)' }}>
                        <table className="theme-table">
                            <thead>
                                <tr>
                                    <th>Name / Email</th>
                                    <th>CNIC</th>
                                    <th>UC & Wallet</th>
                                    <th className="text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingUsers.map(user => (
                                    <tr key={user.id}>
                                        <td className="whitespace-nowrap">
                                            <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{user.full_name}</div>
                                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.email}</div>
                                        </td>
                                        <td className="whitespace-nowrap font-mono tracking-widest" style={{ color: '#c084fc' }}>
                                            {user.cnic_number}
                                        </td>
                                        <td className="whitespace-nowrap">
                                            <div className="inline-block mb-1 text-xs px-2 py-1 rounded" style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-secondary)' }}>UC {user.uc_id}</div>
                                            <div className="font-mono text-xs opacity-70">{user.wallet_address.substring(0, 6)}...{user.wallet_address.slice(-4)}</div>
                                        </td>
                                        <td className="whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => rejectUser(user)} disabled={loading}
                                                    className="theme-btn theme-btn-danger text-xs px-3 py-1.5"
                                                    title="Reject manually"
                                                >
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => approveUser(user)} disabled={loading}
                                                    className="theme-btn theme-btn-accent text-xs px-3 py-1.5"
                                                    title="Approve & Hash on Blockchain"
                                                >
                                                    {loading ? 'Tx...' : 'Approve'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    }

    // --- REGISTRATION CLOSED VIEW ---
    if (!checkingStatus && !registrationOpen && !hasApplied.applied) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center section-card" style={{ animation: 'fadeSlideIn 0.5s ease-out' }}>
                <XCircle size={64} className="mb-6" style={{ color: '#fb7185' }} />
                <h2 className="text-3xl font-black mb-3" style={{ color: 'var(--text-primary)' }}>
                    Registration is Currently Closed
                </h2>
                <p className="max-w-md mx-auto text-sm" style={{ color: 'var(--text-muted)' }}>
                    The election administrator has temporarily closed voter registration. Please check back later or contact the administrator for more information.
                </p>
                <div className="mt-8 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide"
                    style={{
                        background: 'rgba(244, 63, 94, 0.10)',
                        color: '#fb7185',
                        border: '1px solid rgba(244, 63, 94, 0.20)',
                    }}>
                    <XCircle size={14} />
                    Registration Unavailable
                </div>
            </div>
        );
    }

    // --- VOTER VIEW ---
    if (hasApplied.applied) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center section-card" style={{ animation: 'fadeSlideIn 0.5s ease-out' }}>
                {hasApplied.status === 'pending' ? (
                    <Clock3 size={64} className="mb-6 animate-pulse" style={{ color: '#fbbf24' }} />
                ) : hasApplied.status === 'rejected' ? (
                    <XCircle size={64} className="mb-6" style={{ color: '#fb7185' }} />
                ) : (
                    <CheckCircle size={64} className="mb-6" style={{ color: '#6ee7b7' }} />
                )}
                <h2 className="text-3xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>
                    {hasApplied.status === 'pending' ? 'Application Pending Review' 
                    : hasApplied.status === 'rejected' ? 'Application Rejected' 
                    : 'Wallet Registered Successfully'}
                </h2>
                <p className="max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
                    {hasApplied.status === 'pending'
                        ? 'Application submitted successfully! Our team will process your request and respond within 24 hours.'
                        : hasApplied.status === 'rejected' 
                        ? 'Your registration was rejected by the election administrator. Please double check your details and try applying again.'
                        : 'Your identity and wallet have been fully verified on-chain. You can now participate in your Union Council election.'
                    }
                </p>

                {hasApplied.status === 'approved' && (
                    <div className="mt-8 badge-success text-sm py-2 px-4 shadow-xl">
                        <CheckCircle size={16} /> Fully Authorized on Blockchain
                    </div>
                )}

                {hasApplied.status === 'rejected' && (
                    <button 
                        onClick={() => setHasApplied({ applied: false, status: '' })}
                        className="mt-8 theme-btn theme-btn-danger px-8 py-3 shadow-xl"
                    >
                        Re-Apply for Registration
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto section-card p-8" style={{ animation: 'fadeSlideIn 0.5s ease-out' }}>
            <div className="section-accent"></div>
            <h2 className="text-2xl font-black mb-6" style={{ color: 'var(--text-primary)' }}>National Identity Registration</h2>
            <form onSubmit={handleSubmit} className="space-y-5">

                <div>
                    <label className="theme-label">Full Legal Name</label>
                    <input type="text" required value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="theme-input" placeholder="As per Identity Card" />
                </div>

                <div>
                    <label className="theme-label">Email Address</label>
                    <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="theme-input" />
                </div>

                <div>
                    <label className="theme-label">CNIC Number</label>
                    <input type="text" required pattern="\d{5}-\d{7}-\d{1}" value={formData.cnic} onChange={e => setFormData({ ...formData, cnic: e.target.value })} className="theme-input font-mono" placeholder="XXXXX-XXXXXXX-X" />
                </div>

                <div>
                    <label className="theme-label">Union Council Identity</label>
                    <select required value={formData.ucId} onChange={e => setFormData({ ...formData, ucId: e.target.value })} className="theme-input appearance-none">
                        {ucs.map(uc => <option key={uc} value={uc}>Union Council {uc}</option>)}
                    </select>
                </div>

                <button disabled={loading} type="submit" className="w-full theme-btn theme-btn-accent mt-4 py-4">
                    {loading ? 'Submitting Application...' : 'Submit Verification Request'}
                </button>

            </form>
        </div>
    );
}
