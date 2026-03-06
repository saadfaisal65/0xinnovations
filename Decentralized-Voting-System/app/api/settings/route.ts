import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin.from('app_settings').select('*');
        if (error) {
            // Return default registration_open true if table doesn't exist
            if (error.code === '42P01') {
                return NextResponse.json({ registration_open: 'true' });
            }
            throw error;
        }

        const settingsResponse: any = {};
        if (data && data.length > 0) {
            data.forEach((row: any) => {
                settingsResponse[row.key] = row.value;
            });
        }

        // Default to true if not found in db
        if (!settingsResponse.registration_open) {
            settingsResponse.registration_open = 'true';
        }

        return NextResponse.json(settingsResponse);
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
        const { key, value } = body;

        // Try to update/upsert
        const { error } = await supabaseAdmin.from('app_settings').upsert(
            { key, value },
            { onConflict: 'key' }
        );

        if (error) {
            // Check if table missing
            if (error.code === '42P01') {
                return NextResponse.json({ error: 'Settings table does not exist in database.' }, { status: 500 });
            }
            throw error;
        }

        return NextResponse.json({ success: true, [key]: value });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
