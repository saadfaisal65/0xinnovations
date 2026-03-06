# Secure Decentralized Voting System

A robust, transparent, and secure decentralized election application (DApp) built for managing transparent Union Council (UC) level elections on the Ethereum Blockchain (Sepolia Testnet), with advanced off-chain identity verification powered by Supabase.

**🌍 Live Demo:** [0xinnovation-decentralize-voting-system.vercel.app](https://0xinnovation-decentralize-voting-system.vercel.app/)

## ✨ Features

- **Blockchain Powered Voting:** All the votes are cast securely on the Sepolia Ethereum network through Smart Contracts.
- **Identity Verification & Anti-Sybil Checks:** Users register via CNIC, and their data is hashed (SHA-256) inside a secure Supabase backend to prevent duplicate registrations and protect privacy.
- **Live Elections & Real-Time Tracking:** A dedicated public terminal for monitoring live election timers, registered voter statistics, candidate standing, and unofficial/official result declaration.
- **Robust Admin Capabilities:**
  - Complete control and configuration over elections across multiple Union Councils.
  - Granular control over candidate lists.
  - Approve & track blockchain-based registration of citizens.
  - Distribute standard Gas (ETH) securely to newly registered voters directly through MetaMask.
  - Emergency smart-contract pausing protocols.
- **Top-Tier Security:** Secured API endpoints with `x-admin-secret` authentication, preventing off-chain database manipulation or bot-driven requests.
- **Sleek UX/UI:** Breathtaking dark-theme interfaces bundled with subtle animations, gradient glows, and state-of-the-art responsiveness.

## 🚀 Technologies Used

- **Frontend:** Next.js (React), Tailwind CSS, Lucide Icons, Ethers.js
- **Backend APIs:** Next.js Route Handlers (Serverless functions)
- **Database:** Supabase (PostgreSQL) with Row-Level Security integration expectations
- **Smart Contracts:** Solidity (deployed on Sepolia Testnet)
- **Wallet Provider:** MetaMask integration

## 📂 Project Structure

- `/app/` - Next.js App Router core, UI layout, and `/api/` backend secure routes.
- `/components/` - Highly modularized React chunks for Admin Panel, Live Tracking, Voting Panels, Registration, and layout.
- `/hooks/` - Contains the `useWallet` hook responsible for unifying Web3 context propagation across everything.
- `/lib/` - Holds utility functions, ABIs, and initializing clients like `supabase.ts` or `contract.ts`.

## 🛠 Setup & Installation

**Prerequisites:** Node.js (v18+ recommended), a registered Supabase project, and a MetaMask wallet containing Sepolia ETH.

1. **Clone the Repo:**
   ```bash
   git clone <your-repo-link>
   cd voting-system
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env.local` file at the root directory of your project with the following items (ensure to replace placeholders with your actual keys):
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS="0xYourDeployedContractAddress..."
   ADMIN_API_SECRET="your-secure-secret-passphrase"
   ```

4. **Start Development Server:**
   ```bash
   npm run dev
   ```
   *The application will boot up at `http://localhost:3000`.*

---
*Developed for unparalleled election integrity and robust UI design.*
