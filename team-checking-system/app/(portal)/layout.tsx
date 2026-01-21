import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Header from '@/components/Header';
import VideoBackground from '@/components/VideoBackground';
import { FileTreeProvider } from '@/contexts/FileTreeContext';
import { BackgroundProvider } from '@/contexts/BackgroundContext';
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
      <BackgroundProvider>
        <FileTreeProvider>
          <VideoBackground />
          <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
              {children}
            </main>
          </div>
        </FileTreeProvider>
      </BackgroundProvider>
    </ClientProviders>
  );
}
