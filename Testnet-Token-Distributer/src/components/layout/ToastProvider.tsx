'use client';

import dynamic from 'next/dynamic';

// Lazy load toast — it's not needed at initial render
const ToastContainer = dynamic(
    () => import('react-toastify').then(mod => mod.ToastContainer),
    { ssr: false }
);

export default function ToastProvider() {
    return (
        <ToastContainer
            position="bottom-right"
            theme="dark"
            toastClassName="border border-neutral-800 bg-neutral-900 text-white shadow-xl rounded-xl"
        />
    );
}
