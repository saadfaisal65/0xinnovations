import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('registration_logs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            // Return empty array if table doesn't exist
            if (error.code === '42P01') {
                return NextResponse.json({ data: [] });
            }
            throw error;
        }

        return NextResponse.json({ data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const adminSecret = req.headers.get('x-admin-secret');
        if (adminSecret !== process.env.ADMIN_API_SECRET) {
            return NextResponse.json({ error: 'Unauthorized: Invalid Admin Secret' }, { status: 401 });
        }

        const body = await req.json();
        const { status, tx_hash, admin_wallet } = body;

        // Try to insert log
        const { error } = await supabaseAdmin.from('registration_logs').insert([{
            status,
            tx_hash,
            admin_wallet: admin_wallet.toLowerCase()
        }]);

        if (error) {
            if (error.code === '42P01') {
                return NextResponse.json({ error: 'registration_logs table does not exist in database.' }, { status: 500 });
            }
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
