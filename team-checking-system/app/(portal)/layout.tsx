import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Header from '@/components/Header';
import { FileTreeProvider } from '@/contexts/FileTreeContext';
import { ClientProviders } from '@/components/ClientProviders';

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <ClientProviders>
      <FileTreeProvider>
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Header />
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            {children}
          </main>
        </div>
      </FileTreeProvider>
    </ClientProviders>
  );
}
