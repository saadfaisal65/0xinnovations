'use client';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { ChevronRight, ShieldCheck, UserPlus, Fingerprint, History, Lock, CheckCircle } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';

// Placeholders for tabs
import AdminPanel from '../components/AdminPanel';
import VoterRegistration from '../components/VoterRegistration';
import VoterPanel from '../components/VoterPanel';
import LiveElections from '../components/LiveElections';
import ElectionHistory from '../components/ElectionHistory';

export default function Dashboard() {
  const { isAdmin } = useWallet();
  const [activeTab, setActiveTab] = useState<'home' | 'admin' | 'register' | 'vote' | 'live' | 'history'>('home');

  useEffect(() => {
    // We no longer lock the admin tab, but we will lock its interactive elements inside
  }, [isAdmin, activeTab]);

  const tabs = [
    { id: 'admin', label: 'Admin Panel', icon: <ShieldCheck size={18} />, locked: false },
    { id: 'register', label: 'Voter Registration', icon: <UserPlus size={18} />, locked: false },
    { id: 'vote', label: 'Voter Panel', icon: <Fingerprint size={18} />, locked: false },
    { id: 'live', label: 'Live Elections', icon: <CheckCircle size={18} />, locked: false },
    { id: 'history', label: 'Election History', icon: <History size={18} />, locked: false },
  ] as const;

  return (
    <div className="min-h-screen" style={{ color: 'var(--text-primary)' }}>
      <Navbar />

      {activeTab === 'home' ? (
        <main className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4">
          <div className="text-center max-w-4xl relative z-10" style={{ animation: 'fadeSlideIn 0.7s ease-out' }}>
            {/* Background glow */}
            <div className="hero-glow"></div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-6">
              <span style={{
                background: 'var(--hero-gradient)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Decentralized
              </span>{' '}
              <span style={{
                background: 'var(--hero-gradient)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Voting System
              </span>
            </h1>

            <p className="text-lg md:text-xl font-medium mb-10 leading-relaxed"
               style={{ color: 'var(--text-secondary)' }}>
              Secure • Transparent • Blockchain Powered Union Council Elections
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button
                onClick={() => setActiveTab('vote')}
                className="btn-primary group"
              >
                Enter Dashboard
                <ChevronRight className="group-hover:translate-x-1.5 transition-transform duration-300" />
              </button>

              <button
                onClick={() => setActiveTab('live')}
                className="btn-secondary"
              >
                Live Results
              </button>
            </div>
          </div>
        </main>
      ) : (
        <main className="max-w-7xl mx-auto px-4 py-8" style={{ animation: 'fadeSlideIn 0.5s ease-out' }}>
          <div className="flex flex-wrap gap-2 pb-4 mb-8" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setActiveTab('home')}
              className="home-btn"
            >
              ← Home
            </button>
            <div className="w-px h-6 my-auto mx-2 hidden sm:block" style={{ background: 'var(--border-color)' }}></div>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (!tab.locked) setActiveTab(tab.id as any);
                }}
                disabled={tab.locked}
                className={`tab-btn ${activeTab === tab.id ? 'tab-btn-active' : ''}`}
              >
                {tab.locked ? <Lock size={16} style={{ color: '#f43f5e', opacity: 0.7 }} /> : tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="card-panel" key={activeTab}>
            {activeTab === 'admin' && <AdminPanel />}
            {activeTab === 'register' && <VoterRegistration />}
            {activeTab === 'vote' && <VoterPanel />}
            {activeTab === 'live' && <LiveElections />}
            {activeTab === 'history' && <ElectionHistory />}
          </div>
        </main>
      )}
    </div>
  );
}
