'use client';

import SearchSidebar from '@/components/SearchSidebar';
import styles from './page.module.css';

export default function BrowsePage() {
  return (
    <div className={styles.container}>
      <SearchSidebar />

      <main className={styles.main}>
        <div className={styles.placeholder}>
          <div className={styles.placeholderContent}>
            <h2>Select a file to view</h2>
            <p>Choose a document from the sidebar to view or edit its contents.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
