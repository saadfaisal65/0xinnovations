'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { History, LayoutList, Trophy } from 'lucide-react';

type HistoricalElection = {
    ucId: number;
    startTime: string;
    endTime: string;
    winnerName: string;
    winningVotes: number;
};

export default function ElectionHistory() {
    const { contract } = useWallet();
    const [history, setHistory] = useState<HistoricalElection[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (contract) loadHistory();
    }, [contract]);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const data = await contract!.getElectionHistory();

            const formattedData = data.map((item: any) => {
                return {
                    ucId: Number(item.ucId),
                    startTime: new Date(Number(item.startTime) * 1000).toLocaleString(),
                    endTime: new Date(Number(item.endTime) * 1000).toLocaleString(),
                    winnerName: item.winnerName,
                    winningVotes: Number(item.winningVotes)
                };
            });

            setHistory(formattedData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!contract) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center section-card animate-pulse">
                <LayoutList size={48} className="mb-4" style={{ color: 'var(--text-muted)' }} />
                <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>Blockchain Connection Required</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Please connect your MetaMask wallet to query the Immutable Ledger.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6" style={{ animation: 'fadeSlideIn 0.5s ease-out' }}>

            <div className="flex justify-between items-center mb-6 pb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div>
                    <h2 className="text-2xl font-black flex items-center gap-3 tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        <History className="w-7 h-7" style={{ color: 'var(--text-muted)' }} />
                        Immutable Ledger History
                    </h2>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Archived Union Council election results verified on-chain.</p>
                </div>
                <div className="hidden sm:flex badge-success text-xs font-mono font-bold">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#6ee7b7' }}></div>
                    Sync Status Active
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-10 font-mono tracking-widest text-sm animate-pulse" style={{ color: 'var(--text-muted)' }}>
                    Querying Blockchain RPC...
                </div>
            ) : history.length === 0 ? (
                <div className="p-12 text-center section-card flex flex-col items-center" style={{ borderStyle: 'dashed', color: 'var(--text-muted)' }}>
                    <Trophy className="w-12 h-12 mb-4 opacity-50" style={{ color: 'var(--text-muted)' }} />
                    No historical election data found on the ledger.
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border-color)' }}>
                    <table className="theme-table">
                        <thead>
                            <tr>
                                <th>Union Council</th>
                                <th>Timeline Bound</th>
                                <th>Winning Identity</th>
                                <th className="text-right">Votes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((record, index) => (
                                <tr key={index}>
                                    <td className="whitespace-nowrap">
                                        <div className="font-black px-3 py-1.5 rounded inline-block text-sm" style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: '#c084fc' }}>
                                            UC {record.ucId}
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap text-xs">
                                        <div className="mb-1"><span style={{ color: 'var(--text-muted)' }} className="mr-2">START:</span><span style={{ color: 'var(--text-secondary)' }}>{record.startTime}</span></div>
                                        <div><span style={{ color: 'var(--text-muted)' }} className="mr-2">END:</span><span style={{ color: 'var(--text-secondary)' }}>{record.endTime}</span></div>
                                    </td>
                                    <td className="whitespace-nowrap">
                                        <div className="font-bold text-base tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                            {record.winnerName}
                                            <Trophy className="w-4 h-4" style={{ color: '#fbbf24' }} />
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap text-right">
                                        <div className="badge-success font-mono font-bold text-base inline-flex">
                                            {record.winningVotes} Count
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
