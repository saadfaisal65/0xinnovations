import { NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase-server';
import { ethers } from 'ethers';

// Contract ABI containing ONLY the functions we need
const FAUCET_ABI = [
    "function sendETH(address payable _to, uint256 _amount) external"
];

const FAUCET_ADDRESSES: Record<string, string> = {
    sepolia: process.env.SEPOLIA_FAUCET_ADDRESS || "",
    polygonAmoy: process.env.AMOY_FAUCET_ADDRESS || "",
};

const RPC_URLS: Record<string, string> = {
    sepolia: process.env.SEPOLIA_RPC_URL || "",
    polygonAmoy: process.env.AMOY_RPC_URL || "",
};

const PAYOUT_AMOUNTS: Record<string, string> = {
    sepolia: "0.5", // 0.5 ETH
    polygonAmoy: "1.0", // 1 MATIC
};

export async function POST(req: Request) {
    try {
        const { wallet_address, network } = await req.json();

        // 1. Initial Validation
        if (!wallet_address || !network || !FAUCET_ADDRESSES[network]) {
            return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
        }

        if (!ethers.isAddress(wallet_address)) {
            return NextResponse.json({ error: 'Invalid wallet address format' }, { status: 400 });
        }

        // 2. Validate Supabase Session
        const supabase = await createClient();
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            return NextResponse.json({ error: 'Unauthorized: Please log in with GitHub' }, { status: 401 });
        }

        // Ensure they logged in with GitHub
        if (session.user.app_metadata.provider !== "github") {
            return NextResponse.json({ error: 'Only GitHub authentication is permitted matching Sybil checks' }, { status: 403 });
        }

        const github_id = session.user.user_metadata.user_name || session.user.id;

        // 3. Query Claims Table (Enforce Cooldown)
        // For secure backend DB actions, we instantiate a service role client to bypass user RLS
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { data: recentClaims, error: claimsError } = await supabaseAdmin
            .from('claims')
            .select('claimed_at')
            .eq('github_id', github_id)
            .eq('network', network)
            .gte('claimed_at', twentyFourHoursAgo);

        if (claimsError) {
            console.error("Supabase Query Error:", claimsError);
            return NextResponse.json({ error: 'Database check failed' }, { status: 500 });
        }

        if (recentClaims && recentClaims.length > 0) {
            return NextResponse.json({
                error: 'Rate limit hit',
                message: 'You have already claimed testnet tokens on this network in the last 24 hours.'
            }, { status: 429 });
        }

        // --- CRITICAL SECURITY BOUNDARY ---
        // If execution reaches here, the user is authenticated, uses GitHub, and passed the cooldown.
        // ----------------------------------

        // 5. Execute Blockchain Transfer
        // Initialize provider and connect the Admin Wallet using PRIVATE_KEY from environment 
        // This key MUST NOT have NEXT_PUBLIC_ prefix
        const provider = new ethers.JsonRpcProvider(RPC_URLS[network]);
        const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);
        const faucetContract = new ethers.Contract(FAUCET_ADDRESSES[network], FAUCET_ABI, wallet);

        const amountToSend = ethers.parseEther(PAYOUT_AMOUNTS[network]);

        try {
            // Send ETH using the smart contract vault
            const tx = await faucetContract.sendETH(wallet_address, amountToSend);

            // Wait for 1 confirmation to ensure it doesn't revert unexpectedly
            const receipt = await tx.wait(1);

            // 6. Log successful claim to Database
            const { error: insertError } = await supabaseAdmin
                .from('claims')
                .insert([{
                    github_id: github_id,
                    wallet_address: wallet_address,
                    network: network
                }]);

            if (insertError) {
                // Edge Case: TX succeeded but DB log failed. 
                // We log locally to prevent data loss. A queue system is safer in actual prod.
                console.error("CRITICAL: Insert claim failed after successful TX:", insertError, receipt.hash);
            }

            return NextResponse.json({
                success: true,
                message: 'Tokens transferred successfully!',
                txHash: receipt.hash
            }, { status: 200 });

        } catch (txError: any) {
            // Handle Ethers/Contract Errors (e.g. FaucetVault__InsufficientBalance, Gas issues)
            console.error(`Blockchain Transaction Error on ${network}:`, txError);

            if (txError.message.includes("FaucetVault__InsufficientBalance")) {
                return NextResponse.json({ error: 'Faucet is empty. Please check back later.' }, { status: 503 });
            }

            return NextResponse.json({ error: 'Blockchain transfer failed' }, { status: 500 });
        }

    } catch (err) {
        console.error("Server API Error:", err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
