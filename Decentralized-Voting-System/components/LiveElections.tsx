'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { ChevronDown, Users, Clock, Award, CheckCircle, ShieldAlert, Zap } from 'lucide-react';

const ucs = ['101', '102', '103', '104', '105', '106', '107', '108', '109', '110'];

type Candidate = {
    id: number;
    name: string;
    voteCount: number;
};

export default function LiveElections() {
    const { account, contract, isAdmin } = useWallet();
    const [selectedUC, setSelectedUC] = useState(ucs[0]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(0);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [epoch, setEpoch] = useState(0);
    const [voterCount, setVoterCount] = useState(0);
    const [officialWinner, setOfficialWinner] = useState('');

    const [timeLeft, setTimeLeft] = useState('00:00:00');
    const [electionState, setElectionState] = useState<'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'NONE'>('NONE');

    useEffect(() => {
        if (contract) {
            fetchUCData(selectedUC);
        }
    }, [contract, selectedUC]);

    useEffect(() => {
        // Interval for fetching live votes every 5 seconds if election is active or ended
        const interval = setInterval(() => {
            if (contract && (electionState === 'ACTIVE' || electionState === 'ENDED')) {
                updateVotes(selectedUC);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [contract, selectedUC, electionState]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (startTime > 0 && endTime > 0) {
            interval = setInterval(() => {
                const now = Math.floor(Date.now() / 1000);
                if (now < startTime) {
                    setElectionState('SCHEDULED');
                    setTimeLeft(formatTime(startTime - now));
                } else if (now >= startTime && now <= endTime) {
                    setElectionState('ACTIVE');
                    setTimeLeft(formatTime(endTime - now));
                } else {
                    setElectionState('ENDED');
                    setTimeLeft('ELECTION ENDED');
                }
            }, 1000);
        } else {
            setElectionState('NONE');
        }
        return () => clearInterval(interval);
    }, [startTime, endTime]);

    const formatTime = (seconds: number) => {
        if (seconds <= 0) return '00:00:00';
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${h}h ${m}m ${s}s`;
    };

    const fetchUCData = async (uc: string) => {
        setLoading(true);
        try {
            // 1. Fetch from contract
            const info = await contract.ucs(Number(uc));
            const fetchedEpoch = Number(info.epoch);
            setStartTime(Number(info.startTime));
            setEndTime(Number(info.endTime));
            setEpoch(fetchedEpoch);

            const cands = await contract.getAllCandidatesForUC(Number(uc));
            const formattedCandidates = cands.map((c: any) => ({
                id: Number(c.id),
                name: c.name,
                voteCount: Number(c.voteCount)
            }));
            setCandidates(formattedCandidates.sort((a: any, b: any) => b.voteCount - a.voteCount));

            // 2. Fetch voter count
            const res = await fetch(`/api/registrations?status=approved&uc_id=${uc}`);
            const data = await res.json();
            if (data && data.data) {
                setVoterCount(data.data.length);
            }

            // 3. Fetch official winner from settings
            const settingsRes = await fetch('/api/settings');
            const settingsData = await settingsRes.json();
            setOfficialWinner(settingsData[`official_winner_${uc}_epoch_${fetchedEpoch}`] || '');

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updateVotes = async (uc: string) => {
        try {
            const cands = await contract.getAllCandidatesForUC(Number(uc));
            const formattedCandidates = cands.map((c: any) => ({
                id: Number(c.id),
                name: c.name,
                voteCount: Number(c.voteCount)
            }));
            setCandidates(formattedCandidates.sort((a: any, b: any) => b.voteCount - a.voteCount));
        } catch (err) { }
    };

    const approveWinner = async () => {
        if (!isAdmin || candidates.length === 0) return;
        const getAdminSecret = () => {
            let sec = sessionStorage.getItem('admin_secret');
            if (!sec) {
                sec = prompt('Enter Admin Secure API Secret (Required for sensitive Database operations):');
                if (sec) sessionStorage.setItem('admin_secret', sec);
            }
            return sec || '';
        };

        const winner = candidates[0].name;

        setActionLoading(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-admin-secret': getAdminSecret()
                },
                body: JSON.stringify({ key: `official_winner_${selectedUC}_epoch_${epoch}`, value: winner })
            });
            if (res.ok) {
                setOfficialWinner(winner);
                alert('Winner Approved Officially!');
            } else {
                alert('Failed to approve winner');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to approve winner');
        } finally {
            setActionLoading(false);
        }
    };

    if (!account) {
        return (
            <div className="flex flex-col items-center justify-center p-10 text-center" style={{ color: 'var(--text-muted)' }}>
                <ShieldAlert size={48} className="mb-4 text-purple-400 opacity-50" />
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Connect Wallet</h2>
                <p>Please connect your MetaMask wallet to view Live Elections.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8" style={{ animation: 'fadeSlideIn 0.5s ease-out' }}>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                        <Zap className="w-8 h-8 text-yellow-400" />
                        Live Elections & Results
                    </h2>
                    <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Monitor ongoing elections, check scheduled times, and verify results.</p>
                </div>
            </div>

            {/* Global UC Selector */}
            <div className="relative z-[60]" style={{ animation: 'fadeSlideDown 0.6s ease-out both' }}>
                <section
                    className="section-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl"
                    style={{ overflow: 'visible' }}
                >
                    <div className="section-accent" style={{ background: 'var(--accent-1)' }}></div>
                    <div>
                        <h3 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Select Union Council</h3>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Choose a UC to view its live election status and statistics.</p>
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

            {loading ? (
                <div className="p-10 text-center animate-pulse flex flex-col items-center gap-4" style={{ color: 'var(--text-muted)' }}>
                    <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#c084fc', borderTopColor: 'transparent' }}></div>
                    Loading UC Data...
                </div>
            ) : electionState === 'NONE' ? (
                <div className="section-card p-12 text-center flex flex-col items-center animate-fade-in">
                    <Clock size={48} className="mb-4 opacity-50" style={{ color: 'var(--text-muted)' }} />
                    <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No Election Configured</h2>
                    <p style={{ color: 'var(--text-muted)' }}>There is no active or scheduled election for Union Council {selectedUC}.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Stats & Info Panel */}
                    <div className="space-y-6">
                        <section className="section-card p-6 h-full flex flex-col justify-center text-center relative overflow-hidden">
                            <div className="section-accent" style={{ background: electionState === 'ACTIVE' ? '#6ee7b7' : electionState === 'ENDED' ? '#c084fc' : '#fbbf24' }}></div>

                            <div className="mb-6">
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase ${electionState === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                        electionState === 'ENDED' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                            'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                    }`}>
                                    {electionState === 'ACTIVE' ? '🔴 Live Voting' : electionState === 'ENDED' ? 'Voting Concluded' : 'Scheduled'}
                                </span>
                            </div>

                            <div className={`text-5xl md:text-6xl font-black mb-4 font-mono tracking-tighter ${electionState === 'ACTIVE' ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]' :
                                    electionState === 'ENDED' ? 'text-purple-400' :
                                        'text-yellow-400'
                                }`}>
                                {timeLeft}
                            </div>

                            <p className="text-sm font-semibold mb-6 flex items-center justify-center gap-2" style={{ color: 'var(--text-muted)' }}>
                                <Clock size={16} />
                                {electionState === 'ACTIVE' ? 'Time Remaining' : electionState === 'ENDED' ? 'Election has ended' : 'Starts In'}
                            </p>

                            <div className="grid grid-cols-2 gap-4 mt-auto pt-6 border-t border-purple-500/10">
                                <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 flex flex-col items-center">
                                    <Users size={24} className="mb-2 text-purple-400" />
                                    <span className="text-2xl font-bold text-white">{voterCount}</span>
                                    <span className="text-xs text-purple-300/60 uppercase tracking-wider font-semibold">Registered Voters</span>
                                </div>
                                <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 flex flex-col items-center">
                                    <Award size={24} className="mb-2 text-purple-400" />
                                    <span className="text-2xl font-bold text-white">{candidates.length}</span>
                                    <span className="text-xs text-purple-300/60 uppercase tracking-wider font-semibold">Total Candidates</span>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Candidates & Live Counter */}
                    <div className="section-card flex flex-col max-h-[600px]">
                        <div className="section-accent"></div>
                        <h3 className="text-xl font-bold mb-4 tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Award className="w-5 h-5 text-purple-400" /> Live Vote Tracking
                        </h3>

                        <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                            {candidates.map((candidate, idx) => (
                                <div key={candidate.id} className="p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 border transition-all"
                                    style={{
                                        background: idx === 0 && electionState !== 'SCHEDULED' ? 'rgba(168, 85, 247, 0.1)' : 'var(--input-bg)',
                                        borderColor: idx === 0 && electionState !== 'SCHEDULED' ? 'rgba(168, 85, 247, 0.3)' : 'var(--input-border)',
                                    }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 && electionState !== 'SCHEDULED' ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <div className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{candidate.name}</div>
                                            {idx === 0 && electionState === 'ENDED' && !officialWinner && (
                                                <div className="text-xs text-yellow-500 font-bold uppercase tracking-wider mt-1">⭐ Unofficial Winner</div>
                                            )}
                                            {idx === 0 && electionState === 'ENDED' && officialWinner === candidate.name && (
                                                <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-1">
                                                    <CheckCircle size={12} /> Official Winner
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <div className={`text-2xl font-mono font-black ${idx === 0 && electionState !== 'SCHEDULED' ? 'text-purple-400' : 'text-gray-400'}`}>
                                                {candidate.voteCount}
                                            </div>
                                            <div className="text-xs uppercase tracking-wider font-bold opacity-60">Votes</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Admin Controls */}
                        {electionState === 'ENDED' && candidates.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-purple-500/20">
                                {officialWinner ? (
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-center gap-3 text-emerald-400">
                                        <CheckCircle size={20} />
                                        <span className="font-bold uppercase tracking-wider text-sm">Results Officially Approved</span>
                                    </div>
                                ) : (
                                    isAdmin ? (
                                        <button
                                            onClick={approveWinner}
                                            disabled={actionLoading}
                                            className="w-full theme-btn theme-btn-accent py-4"
                                        >
                                            {actionLoading ? 'Approving...' : 'Sign & Approve Official Winner'}
                                        </button>
                                    ) : (
                                        <div className="text-center text-sm font-semibold text-purple-400/60 p-4 border border-dashed border-purple-500/20 rounded-xl">
                                            Waiting for Admin to approve official results...
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </div>

                </div>
            )}
        </div>
    );
}
