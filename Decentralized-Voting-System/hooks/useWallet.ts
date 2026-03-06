import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../lib/contract';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const useWallet = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [network, setNetwork] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    checkIfWalletIsConnected();
    
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }

    return () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      await initializeContract(accounts[0]);
    } else {
      setAccount(null);
      setSigner(null);
      setContract(null);
      setIsAdmin(false);
    }
  };

  const initializeContract = async (currentAccount: string) => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    
    try {
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(newProvider);
      
      const net = await newProvider.getNetwork();
      setNetwork(net.name);

      const newSigner = await newProvider.getSigner();
      setSigner(newSigner);

      const newContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, newSigner);
      setContract(newContract);

      const adminAddress = await newContract.admin();
      setIsAdmin(adminAddress.toLowerCase() === currentAccount.toLowerCase());
    } catch (err) {
      console.error("Error setting up contract:", err);
    }
  };

  const checkIfWalletIsConnected = async () => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        await initializeContract(accounts[0]);
      }
    } catch (error) {
      console.error("Error checking wallet connection", error);
    }
  };

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert("Please install MetaMask or a compatible Web3 wallet.");
      return;
    }

    try {
      setIsConnecting(true);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      setAccount(accounts[0]);
      await initializeContract(accounts[0]);
    } catch (error) {
      console.error("Error connecting wallet", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
    setIsAdmin(false);
    setNetwork('');
  };

  return {
    account,
    provider,
    signer,
    contract,
    isAdmin,
    network,
    isConnecting,
    connectWallet,
    disconnectWallet,
    formatAddress
  };
};
