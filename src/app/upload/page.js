'use client';

import { useRouter } from 'next/navigation';
import UploadSection from '../components/UploadSection';

export default function UploadPage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
      <UploadSection
        onUploadSuccess={() => {
          // You can also add a toast notification here if you want
          router.push('/');
        }}
        onClose={() => {
          router.push('/');
        }}
      />
    </div>
  );
}
