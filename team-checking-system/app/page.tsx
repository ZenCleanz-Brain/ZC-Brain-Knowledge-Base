import Link from 'next/link';
import Image from 'next/image';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import styles from './page.module.css';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Image
            src="/zencleanz-logo.png"
            alt="ZenCleanz Logo"
            width={120}
            height={120}
            className={styles.logoIcon}
            priority
          />
          <h1>ZenCleanz</h1>
          <p>Knowledge Base Portal</p>
        </div>

        <div className={styles.card}>
          <h2>Welcome, Team!</h2>
          <p>
            Access and manage our knowledge base documents. View product information,
            FAQs, and blog content with easy-to-use editing capabilities.
          </p>

          <div className={styles.features}>
            <div className={styles.feature}>
              <span>📚</span>
              <div>
                <h3>Browse Documents</h3>
                <p>Navigate through organized folders and view markdown files</p>
              </div>
            </div>
            <div className={styles.feature}>
              <span>✏️</span>
              <div>
                <h3>Edit Content</h3>
                <p>Submit edits for review with live markdown preview</p>
              </div>
            </div>
            <div className={styles.feature}>
              <span>🔄</span>
              <div>
                <h3>Auto Sync</h3>
                <p>Changes sync to GitHub and update AI agents automatically</p>
              </div>
            </div>
          </div>

          <Link href="/login" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }}>
            Sign In to Continue
          </Link>
        </div>

        <p className={styles.footer}>
          © 2024 ZenCleanz. Internal team portal.
        </p>
      </div>
    </main>
  );
}
