import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get('wallet');
    const status = searchParams.get('status');
    const ucId = searchParams.get('uc_id');

    try {
        let data: any, error: any;

        if (wallet) {
            const res = await supabaseAdmin.from('voter_registrations').select('*').eq('wallet_address', wallet.toLowerCase()).single();
            data = res.data; error = res.error;
        } else {
            let query = supabaseAdmin.from('voter_registrations').select('*');
            if (status) query = query.eq('status', status);
            if (ucId) query = query.eq('uc_id', ucId);

            const res = await query;
            data = res.data; error = res.error;
        }

        if (error && error.code !== 'PGRST116') { // PGRST116 is no rows returned, perfectly completely fine.
            throw error;
        }

        return NextResponse.json({ data: data || null });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { full_name, cnic_number, hashed_cnic, uc_id, wallet_address } = body;

        const { data: existingRecords } = await supabaseAdmin
            .from('voter_registrations')
            .select('*')
            .or(`wallet_address.eq.${wallet_address.toLowerCase()},cnic_number.eq.${cnic_number}`);

        if (existingRecords && existingRecords.length > 0) {
            // Check if ANY existing record applies and is NOT rejected
            for (const record of existingRecords) {
                if (record.status !== 'rejected') {
                    if (record.cnic_number === cnic_number) {
                        return NextResponse.json({ error: 'A user with this CNIC is already registered and pending/approved.' }, { status: 400 });
                    }
                    if (record.wallet_address === wallet_address.toLowerCase()) {
                        return NextResponse.json({ error: 'This wallet address is already registered and pending/approved.' }, { status: 400 });
                    }
                }
            }
            // If we reached here, all existing conflicting records are REJECTED.
            // Delete them so the user can re-apply cleanly without Unique Constraint errors.
            const idsToDelete = existingRecords.map(r => r.id);
            await supabaseAdmin.from('voter_registrations').delete().in('id', idsToDelete);
        }

        const { error } = await supabaseAdmin.from('voter_registrations').insert([
            {
                full_name,
                cnic_number,
                hashed_cnic,
                uc_id: parseInt(uc_id, 10),
                wallet_address: wallet_address.toLowerCase(),
                status: 'pending'
            }
        ]);

        if (error) {
            if (error.code === '23505') { // Unique constraint
                if (error.message.includes('cnic_number')) {
                    return NextResponse.json({ error: 'A user with this CNIC is already registered.' }, { status: 400 });
                } else if (error.message.includes('wallet_address')) {
                    return NextResponse.json({ error: 'This wallet address is already registered.' }, { status: 400 });
                }
                return NextResponse.json({ error: 'Registration already exists for this CNIC or Wallet.' }, { status: 400 });
            }
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const adminSecret = req.headers.get('x-admin-secret');
        if (adminSecret !== process.env.ADMIN_API_SECRET) {
            return NextResponse.json({ error: 'Unauthorized: Invalid Admin Secret' }, { status: 401 });
        }

        const body = await req.json();
        const { id, status } = body;

        const { error } = await supabaseAdmin
            .from('voter_registrations')
            .update({ status })
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
