import DashboardNavSidebar from '@/components/DashboardNavSidebar';
import styles from './layout.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.container}>
      <DashboardNavSidebar />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
