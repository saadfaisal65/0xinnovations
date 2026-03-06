'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWallet } from '../hooks/useWallet';
import { ShieldAlert, Plus, Save, Clock, Trash2, PowerOff, CheckCircle, UserX, UserCheck, ScrollText, ExternalLink, Coins, ChevronDown, X } from 'lucide-react';

const ucs = [
    '101', '102', '103', '104', '105', '106', '107', '108', '109', '110'
];

export default function AdminPanel() {
    const { account, isAdmin, contract } = useWallet();
    const [selectedUC, setSelectedUC] = useState(ucs[0]);
    const [candidates, setCandidates] = useState([{ name: '' }, { name: '' }]);
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState('');
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
    const [registrationOpen, setRegistrationOpen] = useState(true);
    const [regToggleLoading, setRegToggleLoading] = useState(false);
    const [historyLogs, setHistoryLogs] = useState<any[]>([]);
    const [approvedVoters, setApprovedVoters] = useState<any[]>([]);
    const [fundingIndex, setFundingIndex] = useState(-1);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const notify = (type: 'success' | 'error', message: string) => {
        setStatus({ type, message });
        setTimeout(() => setStatus({ type: null, message: '' }), 5000);
    };

    const getAdminSecret = () => {
        let sec = sessionStorage.getItem('admin_secret');
        if (!sec) {
            sec = prompt('Enter Admin Secure API Secret (Required for sensitive Database operations):');
            if (sec) sessionStorage.setItem('admin_secret', sec);
        }
        return sec || '';
    };

    // Fetch current registration status on mount
    useEffect(() => {
        fetchRegistrationStatus();
        fetchRegistrationLogs();
    }, []);

    // Fetch approved voters for UC funding when UC changes
    useEffect(() => {
        const fetchApprovedVoters = async () => {
            try {
                const res = await fetch(`/api/registrations?status=approved&uc_id=${selectedUC}`);
                const data = await res.json();
                if (data && data.data) {
                    setApprovedVoters(data.data);
                } else {
                    setApprovedVoters([]);
                }
            } catch (err) {
                console.error('Error fetching approved voters:', err);
            }
        };
        fetchApprovedVoters();
    }, [selectedUC]);

    const fetchRegistrationLogs = async () => {
        try {
            const res = await fetch('/api/registration-history');
            const data = await res.json();
            if (data && data.data) {
                setHistoryLogs(data.data);
            }
        } catch (err) {
            console.error('Error fetching logs:', err);
        }
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
        }
    };

    const toggleRegistration = async () => {
        if (!isAdmin) return notify('error', 'Unauthorized Action');
        if (!contract) return notify('error', 'Waiting for Blockchain connection');
        setRegToggleLoading(true);
        try {
            const newValue = !registrationOpen;

            // 1. Blockchain Transaction (MetaMask Popup)
            const tx = await contract.setRegistrationOpen(newValue);
            notify('success', 'Transaction signed! Verifying on Blockchain...');
            const receipt = await tx.wait(); // Wait for actual block confirmation

            // 2. Database Sync once confirmed
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-admin-secret': getAdminSecret()
                },
                body: JSON.stringify({ key: 'registration_open', value: String(newValue) })
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Failed to toggle registration in Database');

            // 3. Keep History Log
            await fetch('/api/registration-history', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-admin-secret': getAdminSecret()
                },
                body: JSON.stringify({
                    status: newValue ? 'OPEN' : 'CLOSED',
                    tx_hash: receipt.hash || tx.hash,
                    admin_wallet: account
                })
            });

            setRegistrationOpen(newValue);
            fetchRegistrationLogs();
            notify('success', `Voter registration has been ${newValue ? 'OPENED' : 'CLOSED'} correctly!`);
        } catch (err: any) {
            console.error(err);
            notify('error', err.reason || err.message || 'Failed to toggle registration status');
        } finally {
            setRegToggleLoading(false);
        }
    };

    const fundVoters = async () => {
        // @ts-ignore
        if (typeof window.ethereum === 'undefined') return notify('error', 'MetaMask not found');
        if (approvedVoters.length === 0) return notify('error', 'No approved voters to fund');

        let successCount = 0;
        setLoading(true);
        for (let i = 0; i < approvedVoters.length; i++) {
            setFundingIndex(i);
            try {
                // @ts-ignore
                const txHash = await window.ethereum.request({
                    method: 'eth_sendTransaction',
                    params: [{
                        from: account,
                        to: approvedVoters[i].wallet_address,
                        value: '0x16BCC41E90000', // 0.0004 ETH in hex (400000000000000 wei)
                    }],
                });
                successCount++;
            } catch (err: any) {
                console.error('Funding failed for', approvedVoters[i].wallet_address, err);
                if (err.code === 4001) {
                    notify('error', 'User rejected transaction. Distribution stopped.');
                    break;
                }
            }
        }
        setFundingIndex(-1);
        setLoading(false);
        if (successCount > 0) notify('success', `Funding complete! Successfully funded ${successCount}/${approvedVoters.length} voters.`);
    };

    const handleAddCandidateField = () => {
        setCandidates([...candidates, { name: '' }]);
    };

    const removeCandidateField = (index: number) => {
        if (candidates.length <= 2) return notify('error', 'Minimum 2 candidates are required');
        const updated = candidates.filter((_, i) => i !== index);
        setCandidates(updated);
    };

    const handleCandidateChange = (index: number, value: string) => {
        const updated = [...candidates];
        updated[index].name = value;
        setCandidates(updated);
    };

    const submitCandidates = async () => {
        if (!isAdmin) return notify('error', 'Unauthorized Action');
        if (!contract) return notify('error', 'Wallet not connected');
        const names = candidates.map(c => c.name.trim()).filter(n => n.length > 0);
        if (names.length < 2) return notify('error', 'Minimum 2 valid candidates required');

        setLoading(true);
        try {
            const tx = await contract.addCandidatesBulk(parseInt(selectedUC), names);
            await tx.wait();
            notify('success', `Added ${names.length} candidates to UC ${selectedUC}`);
            setCandidates([{ name: '' }, { name: '' }]);
        } catch (err: any) {
            console.error(err);
            notify('error', err.reason || 'Failed to add candidates');
        } finally {
            setLoading(false);
        }
    };

    const scheduleElection = async () => {
        if (!isAdmin) return notify('error', 'Unauthorized Action');
        if (!contract) return notify('error', 'Wallet not connected');
        if (!date || !time || !duration || Number(duration) <= 0) return notify('error', 'Invalid date, time, or duration');

        setLoading(true);
        try {
            const dateTimeString = `${date}T${time}:00`;
            const startTimestamp = Math.floor(new Date(dateTimeString).getTime() / 1000);
            const durationSeconds = parseInt(duration) * 60;

            const tx = await contract.startElectionForUC(parseInt(selectedUC), startTimestamp, durationSeconds);
            await tx.wait();
            notify('success', `Election scheduled for UC ${selectedUC}`);
            setDate(''); setTime(''); setDuration('');
        } catch (err: any) {
            console.error(err);
            notify('error', err.reason || 'Failed to schedule election');
        } finally {
            setLoading(false);
        }
    };

    const resetElection = async () => {
        if (!isAdmin) return notify('error', 'Unauthorized Action');
        if (!contract) return;
        setLoading(true);
        try {
            const tx = await contract.resetElectionForUC(parseInt(selectedUC));
            await tx.wait();
            notify('success', `Election reset and archived mapped for UC ${selectedUC}`);
        } catch (err: any) {
            console.error(err);
            notify('error', err.reason || 'Failed to reset election (Is the election ended?)');
        } finally {
            setLoading(false);
        }
    };

    const togglePause = async (pauseState: boolean) => {
        if (!isAdmin) return notify('error', 'Unauthorized Action');
        if (!contract) return;
        setLoading(true);
        try {
            const tx = pauseState ? await contract.pause() : await contract.unpause();
            await tx.wait();
            notify('success', `Contract ${pauseState ? 'Paused' : 'Unpaused'} successfully`);
        } catch (err: any) {
            console.error(err);
            notify('error', 'Failed to change contract state');
        } finally {
            setLoading(false);
        }
    };

    // Restrict Access
    if (!account) {
        return (
            <div className="flex flex-col items-center justify-center p-10 text-center" style={{ color: 'var(--text-muted)' }}>
                <ShieldAlert size={48} className="mb-4" style={{ color: '#fb7185' }} />
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Access Denied</h2>
                <p>Please connect your wallet to access the Admin Panel.</p>
            </div>
        );
    }

    return (
        <div className="space-y-12" style={{ animation: 'fadeSlideIn 0.5s ease-out' }}>
            {!isAdmin && (
                <div className="p-4 rounded-xl text-center font-bold" style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#fb7185', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                    <ShieldAlert className="inline-block w-5 h-5 mr-2" />
                    Read-Only Mode: You are viewing the Admin Panel as a standard user. All configuration controls are disabled.
                </div>
            )}



                    {/* Header & Status */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-3xl font-black flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                                <ShieldAlert className="w-8 h-8" style={{ color: '#fb7185' }} />
                                Admin Operations
                            </h2>
                            <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Configure elections and add union council candidates.</p>
                        </div>

                        {/* Fixed Notifier via Portal */}
                        {status.message && typeof document !== 'undefined' && createPortal(
                            <div className="fixed top-24 right-8 z-[100] pointer-events-none" style={{ animation: 'slideInOutRight 5s ease-in-out forwards' }}>
                                <div className={`px-5 py-3 rounded-xl shadow-2xl text-sm font-bold tracking-wide flex items-center gap-3 ${status.type === 'success' ? 'badge-success' : 'badge-error'}`}
                                    style={{ background: 'var(--bg-primary)', border: `2px solid ${status.type === 'success' ? '#6ee7b7' : '#fb7185'}`, color: status.type === 'success' ? '#6ee7b7' : '#fb7185' }}>
                                    {status.type === 'success' ? <CheckCircle size={18} /> : <ShieldAlert size={18} />}
                                    {status.message}
                                </div>
                            </div>,
                            document.body
                        )}
                    </div>

                    {/* Global UC Selector (Moved outside grid) */}
                    <div className="mb-8 relative z-[60]" style={{ animation: 'fadeSlideDown 0.6s ease-out both' }}>
                        <section
                            className="section-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.05)] transform transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
                            style={{ overflow: 'visible' }}
                        >
                            <div className="section-accent" style={{ background: 'var(--accent-1)' }}></div>
                            <div>
                                <h3 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Select Union Council</h3>
                                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Please select a Union Council (UC) to proceed with the election.</p>
                            </div>
                            <div className="relative sm:max-w-xs w-full">
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="theme-input w-full text-left text-lg font-bold flex justify-between items-center shadow-inner"
                                    style={{ color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' }}
                                >
                                    Union Council {selectedUC}
                                    <ChevronDown size={20} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                                        <div className="absolute top-full left-0 w-full mt-2 rounded-xl border z-50 shadow-2xl"
                                            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', animation: 'fadeSlideDown 0.2s ease-out' }}>
                                            <div className="max-h-60 overflow-y-auto" style={{ borderRadius: '0.75rem' }}>
                                                {ucs.map((uc) => (
                                                    <div
                                                        key={uc}
                                                        onClick={() => {
                                                            setSelectedUC(uc);
                                                            setIsDropdownOpen(false);
                                                        }}
                                                        className="px-4 py-3 cursor-pointer transition-colors text-sm font-semibold"
                                                        style={{
                                                            background: selectedUC === uc ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                                                            borderLeft: selectedUC === uc ? '3px solid #c084fc' : '3px solid transparent',
                                                            color: selectedUC === uc ? '#ffffff' : 'var(--text-secondary)'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (selectedUC !== uc) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (selectedUC !== uc) e.currentTarget.style.background = 'transparent';
                                                        }}
                                                    >
                                                        Union Council {uc}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Grid Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* Left Column: UC Specific Operations */}
                        <div className="space-y-8">

                            {/* Add Candidates */}
                            <section className="section-card transform transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:border-purple-500/30" style={{ animation: 'fadeSlideLeft 0.5s ease-out 0.1s both' }}>
                                <div className="section-accent"></div>
                                <h3 className="text-xl font-bold mb-4 tracking-tight" style={{ color: 'var(--text-primary)' }}>Configure Candidates (UC {selectedUC})</h3>

                                <div className="space-y-3 mb-4 max-h-[220px] overflow-y-auto pr-2 overflow-x-hidden">
                                    {candidates.map((candidate, idx) => (
                                        <div key={idx} className="flex items-center gap-3" style={{ animation: `fadeSlideLeft 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${idx * 0.05}s both` }}>
                                            <button
                                                onClick={() => removeCandidateField(idx)}
                                                disabled={candidates.length <= 2 || !isAdmin}
                                                title={!isAdmin ? "Read-Only" : candidates.length <= 2 ? "Minimum 2 candidates required" : "Remove Candidate"}
                                                className="group flex-shrink-0 w-10 h-10 rounded-lg flex justify-center items-center font-mono text-sm relative overflow-hidden transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                                                style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-muted)' }}
                                            >
                                                <div className="absolute inset-0 bg-rose-500/0 group-hover:bg-rose-500/10 transition-colors duration-300"></div>
                                                <span className="absolute inset-0 flex justify-center items-center transition-opacity duration-300 group-hover:opacity-0 group-disabled:group-hover:opacity-100">#{idx + 1}</span>
                                                <X className="absolute inset-0 m-auto w-4 h-4 text-rose-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-disabled:group-hover:opacity-0 scale-110" />
                                            </button>
                                            <input
                                                type="text"
                                                placeholder="Full Legal Name"
                                                value={candidate.name}
                                                onChange={(e) => handleCandidateChange(idx, e.target.value)}
                                                disabled={!isAdmin}
                                                className="flex-1 theme-input transition-all duration-300 focus:-translate-y-0.5 disabled:opacity-60"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-3">
                                    <button onClick={handleAddCandidateField} disabled={!isAdmin} className="flex-1 theme-btn disabled:opacity-50" style={{ borderStyle: 'dashed' }}>
                                        <Plus className="w-4 h-4" /> Add Row
                                    </button>
                                    <button onClick={submitCandidates} disabled={loading || !isAdmin} className="flex-[2] theme-btn theme-btn-accent disabled:opacity-50">
                                        Submit Candidates
                                    </button>
                                </div>
                            </section>

                            {/* Schedule Election */}
                            <section className="section-card transform transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:border-purple-500/30" style={{ animation: 'fadeSlideLeft 0.5s ease-out 0.2s both' }}>
                                <div className="section-accent"></div>
                                <h3 className="text-xl font-bold mb-4 tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                    <Clock className="w-5 h-5" style={{ color: 'var(--text-muted)' }} /> Schedule Election (UC {selectedUC})
                                </h3>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="theme-label">Start Date</label>
                                            <input type="date" value={date} onChange={e => setDate(e.target.value)} disabled={!isAdmin} className="theme-input disabled:opacity-60" />
                                        </div>
                                        <div>
                                            <label className="theme-label">Start Time</label>
                                            <input type="time" value={time} onChange={e => setTime(e.target.value)} disabled={!isAdmin} className="theme-input disabled:opacity-60" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="theme-label">Duration (Minutes)</label>
                                        <input type="number" min="1" placeholder="e.g. 1440 for 24 hours" value={duration} onChange={e => setDuration(e.target.value)} disabled={!isAdmin} className="theme-input disabled:opacity-60" />
                                    </div>
                                    <button
                                        onClick={scheduleElection} disabled={loading || !isAdmin}
                                        className="w-full theme-btn theme-btn-accent disabled:opacity-50"
                                    >
                                        <Save className="w-5 h-5" />
                                        {loading ? 'Processing...' : 'Schedule Election'}
                                    </button>
                                </div>
                            </section>

                            {/* Funding / Gas Distribution */}
                            <section className="section-card transform transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:border-sky-500/30" style={{ animation: 'fadeSlideLeft 0.5s ease-out 0.3s both' }}>
                                <div className="section-accent" style={{ background: 'rgba(56, 189, 248, 0.4)' }}></div>
                                <h3 className="text-xl font-bold mb-4 tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                    <Coins className="w-5 h-5" style={{ color: '#38bdf8' }} /> Fund Voters (UC {selectedUC})
                                </h3>
                                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                                    Distribute 0.0004 Sepolia ETH to {approvedVoters.length} registered voters in UC {selectedUC} so they can pay gas fees.
                                </p>

                                {approvedVoters.length === 0 ? (
                                    <div className="p-4 text-center text-sm italic rounded-xl mb-4" style={{ border: '1px dashed var(--border-color)', color: 'var(--text-muted)' }}>
                                        No approved voters found for this UC.
                                    </div>
                                ) : (
                                    <div className="space-y-2 mb-4 max-h-[150px] overflow-y-auto pr-2">
                                        {approvedVoters.map((voter, idx) => (
                                            <div key={voter.id} className="flex justify-between items-center p-2 rounded-lg text-xs font-mono"
                                                style={{
                                                    background: fundingIndex === idx ? 'rgba(56, 189, 248, 0.2)' : 'var(--input-bg)',
                                                    border: fundingIndex === idx ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid var(--input-border)'
                                                }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>{voter.wallet_address.substring(0, 8)}...{voter.wallet_address.slice(-6)}</span>
                                                {fundingIndex === idx ? (
                                                    <span className="text-sky-400 animate-pulse">Processing...</span>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)' }}>0.0004 ETH</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button
                                    onClick={fundVoters} disabled={loading || approvedVoters.length === 0 || !isAdmin}
                                    className="w-full theme-btn disabled:opacity-50"
                                    style={{ background: 'rgba(56, 189, 248, 0.1)', borderColor: 'rgba(56, 189, 248, 0.3)', color: '#7dd3fc' }}
                                >
                                    {loading && fundingIndex >= 0 ? `Funding Voter ${fundingIndex + 1} of ${approvedVoters.length}...` : `Distribute Gas (${(approvedVoters.length * 0.0004).toFixed(4)} ETH Total)`}
                                </button>
                            </section>

                            {/* Archive Election (UC Specific) */}
                            <section className="section-card overflow-hidden transform transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:border-rose-500/30" style={{ borderColor: 'rgba(244, 63, 94, 0.15)', animation: 'fadeSlideLeft 0.5s ease-out 0.4s both' }}>
                                <div className="section-accent" style={{ background: 'rgba(244, 63, 94, 0.5)' }}></div>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10"></div>
                                <h3 className="text-xl font-bold mb-4 tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                    <Trash2 className="w-5 h-5" style={{ color: '#fb7185' }} /> Archive Election (UC {selectedUC})
                                </h3>
                                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                                    Securely archive current UC election results to the blockchain's historical log and reset candidates for a new polling epoch.
                                </p>
                                <button
                                    onClick={resetElection} disabled={loading || !isAdmin}
                                    className="w-full theme-btn theme-btn-danger disabled:opacity-50"
                                >
                                    Archive & Reset Local UC {selectedUC} Election
                                </button>
                            </section>

                        </div>

                        {/* Right Column: Global Operations */}
                        <div className="space-y-8">

                            {/* Voter Registration Toggle */}
                            <section className="section-card transform transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
                                style={{ animation: 'fadeSlideLeft 0.5s ease-out 0.15s both', borderColor: registrationOpen ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)' }}>
                                <div className="section-accent" style={{ background: registrationOpen ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)' }}></div>
                                <h3 className="text-xl font-bold mb-4 tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                    {registrationOpen ? <UserCheck className="w-5 h-5" style={{ color: '#6ee7b7' }} /> : <UserX className="w-5 h-5" style={{ color: '#fb7185' }} />}
                                    Global Registration Control
                                </h3>
                                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                                    {registrationOpen
                                        ? 'Registration is currently open. New voters can submit their applications.'
                                        : 'Registration is currently closed. No new voter applications are accepted.'
                                    }
                                </p>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${registrationOpen ? 'animate-pulse' : ''}`}
                                            style={{ background: registrationOpen ? '#6ee7b7' : '#fb7185' }}></div>
                                        <span className="text-sm font-semibold"
                                            style={{ color: registrationOpen ? '#6ee7b7' : '#fb7185' }}>
                                            {registrationOpen ? 'OPEN' : 'CLOSED'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={toggleRegistration}
                                        disabled={regToggleLoading || !isAdmin}
                                        className={`flex-1 theme-btn ${registrationOpen ? 'theme-btn-danger' : 'theme-btn-success'} disabled:opacity-50`}
                                    >
                                        {regToggleLoading
                                            ? 'Updating...'
                                            : registrationOpen
                                                ? 'Close Registration'
                                                : 'Open Registration'
                                        }
                                    </button>
                                </div>
                            </section>

                            {/* Contract Overrides */}
                            <section className="section-card overflow-hidden transform transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:border-rose-500/30"
                                style={{ borderColor: 'rgba(244, 63, 94, 0.15)', animation: 'fadeSlideLeft 0.5s ease-out 0.25s both' }}>
                                <div className="section-accent" style={{ background: 'rgba(244, 63, 94, 0.5)' }}></div>
                                <h3 className="text-xl font-bold mb-2 tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                    <PowerOff className="w-5 h-5" style={{ color: '#fb7185' }} /> System Emergency Controls
                                </h3>
                                <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
                                    Globally pause or unpause the entire voting smart contract across all Union Councils. Use during malicious attacks.
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => togglePause(true)} disabled={loading || !isAdmin}
                                        className="theme-btn theme-btn-danger disabled:opacity-50"
                                    >
                                        Pause Contract
                                    </button>
                                    <button
                                        onClick={() => togglePause(false)} disabled={loading || !isAdmin}
                                        className="theme-btn theme-btn-success disabled:opacity-50"
                                    >
                                        Unpause Contract
                                    </button>
                                </div>
                            </section>

                            {/* Registration History Logs */}
                            <section className="section-card transform transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl" style={{ animation: 'fadeSlideLeft 0.5s ease-out 0.35s both' }}>
                                <div className="section-accent"></div>
                                <h3 className="text-xl font-bold mb-4 tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                    <ScrollText className="w-5 h-5" style={{ color: 'var(--text-muted)' }} /> Registration Activity Logs
                                </h3>
                                {historyLogs.length === 0 ? (
                                    <p className="text-sm italic p-4 text-center rounded-xl" style={{ border: '1px dashed var(--border-color)', color: 'var(--text-muted)' }}>
                                        No history found on the database.
                                    </p>
                                ) : (
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                        {historyLogs.map((log: any) => (
                                            <div key={log.id} className="p-3 rounded-lg text-sm" style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className={`font-bold uppercase tracking-wider text-xs px-2 py-0.5 rounded ${log.status === 'OPEN' ? 'badge-success text-emerald-400' : 'badge-error text-rose-400'}`}>
                                                        {log.status}
                                                    </span>
                                                    <span className="text-xs opacity-60" style={{ color: 'var(--text-secondary)' }}>
                                                        {new Date(log.created_at).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="text-xs space-y-1 mb-2">
                                                    <div style={{ color: 'var(--text-muted)' }}>Signer: <span className="font-mono text-xs ml-1" style={{ color: 'var(--text-secondary)' }}>{log.admin_wallet.substring(0, 8)}...{log.admin_wallet.slice(-6)}</span></div>
                                                    <div style={{ color: 'var(--text-muted)' }}>Tx Hash: <span className="font-mono text-xs ml-1" style={{ color: 'var(--text-secondary)' }}>{log.tx_hash.substring(0, 16)}...</span></div>
                                                </div>
                                                <a href={`https://sepolia.etherscan.io/tx/${log.tx_hash}`} target="_blank" rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs hover:underline transition-colors" style={{ color: '#c084fc' }}>
                                                    <ExternalLink size={12} /> View on Explorer
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                        </div>
                    </div>
                </div>
                );
}
