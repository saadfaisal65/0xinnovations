'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { Fingerprint, Timer, CheckCircle, Search, Info, ShieldAlert } from 'lucide-react';

type Candidate = {
  id: number;
  name: string;
  voteCount: number;
};

export default function VoterPanel() {
  const { account, contract, isAdmin } = useWallet();
  const [loading, setLoading] = useState(true);
  
  // Registration Data
  const [isRegistered, setIsRegistered] = useState(false);
  const [ucId, setUcId] = useState<number | null>(null);
  
  // UC Data
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [epoch, setEpoch] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);

  // Timers
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');
  const [electionActive, setElectionActive] = useState(false);

  useEffect(() => {
    if (account && contract) {
      loadVoterData();
    }
  }, [account, contract]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (startTime > 0 && endTime > 0) {
      interval = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        if (now < startTime) {
          setElectionActive(false);
          const diff = startTime - now;
          setTimeLeft(formatTime(diff));
        } else if (now >= startTime && now <= endTime) {
          setElectionActive(true);
          const diff = endTime - now;
          setTimeLeft(formatTime(diff));
        } else {
          setElectionActive(false);
          setTimeLeft('ELECTION ENDED');
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [startTime, endTime]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}h ${m}m ${s}s`;
  };

  const loadVoterData = async () => {
    if (!contract || !account) return;
    setLoading(true);
    try {
      const regStatus = await contract.isRegistered(account);
      setIsRegistered(regStatus);

      if (regStatus || isAdmin) {
        let ucNum = 101; // Default for admin preview testing
        
        if (regStatus) {
            const voterUC = await contract.registeredUC(account);
            ucNum = Number(voterUC);
        }
        
        setUcId(ucNum);

        const info = await contract.ucs(ucNum);
        const stTime = Number(info.startTime);
        const eTime = Number(info.endTime);
        const curEpoch = Number(info.epoch);
        
        setStartTime(stTime);
        setEndTime(eTime);
        setEpoch(curEpoch);

        const cands = await contract.getAllCandidatesForUC(ucNum);
        const formattedCandidates = cands.map((c: any) => ({
          id: Number(c.id),
          name: c.name,
          voteCount: Number(c.voteCount)
        }));
        setCandidates(formattedCandidates);

        const votedStatus = await contract.hasVotedInUCEpoch(ucNum, curEpoch, account);
        setHasVoted(votedStatus);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const castVote = async () => {
    if (!contract || !selectedCandidate || !ucId) return;
    try {
      const tx = await contract.vote(ucId, selectedCandidate);
      await tx.wait();
      alert('Vote Successfully Casted!');
      loadVoterData();
    } catch (err: any) {
      console.error(err);
      alert('Failed to cast vote: ' + (err.reason || err.message));
    }
  };

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center" style={{ color: 'var(--text-muted)' }}>
        <Fingerprint size={48} className="mb-4 opacity-50" style={{ color: 'var(--text-muted)' }} />
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Connect Wallet</h2>
        <p>Please connect your MetaMask wallet to access the Voting Panel.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-10 text-center animate-pulse flex flex-col items-center gap-4" style={{ color: 'var(--text-muted)' }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#c084fc', borderTopColor: 'transparent' }}></div>
      Verifying Identity Constraints...
    </div>;
  }

  if (!isRegistered && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center section-card">
        <ShieldAlert size={48} className="mb-4" style={{ color: '#fb7185' }} />
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Unregistered Identity</h2>
        <p style={{ color: 'var(--text-muted)' }}>You must register your CNIC and be approved before voting.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8" style={{ animation: 'fadeSlideIn 0.5s ease-out' }}>
      
      {isAdmin && !isRegistered && (
        <div className="col-span-1 md:col-span-2 p-4 rounded-xl mb-2 text-sm text-center font-bold" style={{ background: 'rgba(192, 132, 252, 0.1)', color: '#c084fc', border: '1px solid rgba(192, 132, 252, 0.3)' }}>
          Admin Test Mode Active: Viewing Voter Panel layout for UC 101. Voting is disabled.
        </div>
      )}
      
      {/* LEFT COLUMN: ELECTION INFO */}
      <div className="space-y-6">
        <div className="section-card">
          <div className="section-accent"></div>
          
          <h2 className="text-2xl font-black flex items-center gap-3 tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
            <Info className="w-6 h-6" style={{ color: 'var(--text-muted)' }} /> UC {ucId} Terminal
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Your identity bounds strictly to Union Council {ucId} for Epoch #{epoch}.</p>

          <div className="p-6 rounded-xl flex flex-col items-center justify-center min-h-[160px]" style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}>
            {startTime === 0 ? (
              <div className="text-center uppercase tracking-widest font-bold text-sm" style={{ color: 'var(--text-muted)' }}>
                No Election Scheduled
              </div>
            ) : (
              <div className="text-center">
                <div className={`text-4xl font-mono font-black mb-2`} style={{ color: electionActive ? '#6ee7b7' : '#fbbf24' }}>
                  {timeLeft}
                </div>
                <div className="text-xs font-semibold uppercase tracking-widest flex items-center justify-center gap-2" style={{ color: 'var(--text-muted)' }}>
                  <Timer size={14} style={{ color: electionActive ? '#6ee7b7' : 'var(--text-muted)' }} />
                  {electionActive ? 'Election Active' : (Math.floor(Date.now()/1000) > endTime ? 'Election Concluded' : 'Starts In')}
                </div>
              </div>
            )}
          </div>
        </div>

        {hasVoted && (
          <div className="section-card flex flex-col items-center justify-center text-center p-6" style={{ borderColor: 'rgba(16, 185, 129, 0.15)' }}>
             <CheckCircle className="w-12 h-12 mb-4" style={{ color: '#6ee7b7' }} />
             <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Vote Recorded</h3>
             <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Your cryptographic receipt has been secured on the blockchain ledger for Epoch #{epoch}.</p>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: CANDIDATE SELECTION */}
      <div className="section-card h-full flex flex-col">
        <div className="section-accent"></div>
        <h3 className="text-xl font-bold mb-1 tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Search className="w-5 h-5" style={{ color: 'var(--text-muted)' }} /> Authorized Candidates
        </h3>
        <p className="text-sm mb-6 pb-4" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Select exactly one representative.</p>

        {candidates.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm rounded-xl" style={{ color: 'var(--text-muted)', border: '2px dashed var(--border-color)' }}>
            No candidates registered for this UC.
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 mb-6">
            {candidates.map(candidate => (
              <label 
                key={candidate.id} 
                onClick={() => !hasVoted && electionActive && setSelectedCandidate(candidate.id)}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                  hasVoted || !electionActive ? 'opacity-50 pointer-events-none' : ''
                }`}
                style={{
                  background: selectedCandidate === candidate.id ? 'rgba(168, 85, 247, 0.08)' : 'var(--input-bg)',
                  borderColor: selectedCandidate === candidate.id ? 'rgba(168, 85, 247, 0.3)' : 'var(--input-border)',
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: selectedCandidate === candidate.id ? '#c084fc' : 'var(--text-muted)' }}>
                    {selectedCandidate === candidate.id && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#c084fc' }}></div>}
                  </div>
                  <div className="font-bold text-lg tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    {candidate.name}
                  </div>
                </div>
                
                <span className="font-mono text-xs px-2 py-1 rounded" style={{ color: 'var(--text-muted)', background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}>ID: #{candidate.id}</span>
              </label>
            ))}
          </div>
        )}

        <button 
          onClick={castVote}
          disabled={!electionActive || hasVoted || selectedCandidate === null || isAdmin}
          className={`w-full theme-btn py-4 text-lg mt-auto ${isAdmin ? 'opacity-50 cursor-not-allowed theme-btn-secondary' : 'theme-btn-accent disabled:opacity-40'}`}
        >
          {isAdmin ? 'Admin View Only' : hasVoted ? 'Already Voted' : !electionActive ? 'Election Offline' : selectedCandidate === null ? 'Select Candidate' : 'Finalize & Cast Vote'}
        </button>
      </div>

    </div>
  );
}
