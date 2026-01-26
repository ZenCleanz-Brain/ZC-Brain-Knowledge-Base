'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  FolderOpen,
  Edit3,
  Clock,
  CheckCircle,
  XCircle,
  Shield,
  User,
  FileText,
  Eye,
  Send
} from 'lucide-react';
import styles from './page.module.css';

export default function DocsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || 'viewer';

  // Mouse tracking for glow effect
  const handleCardMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleCardMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    const card = e.currentTarget;
    card.style.setProperty('--mouse-x', '50%');
    card.style.setProperty('--mouse-y', '50%');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/dashboard" className={styles.backLink}>
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>
        <div className={styles.headerContent}>
          <BookOpen size={28} className={styles.headerIcon} />
          <div>
            <h1>Documentation</h1>
            <p>Learn how to use the ZC Brain Knowledge Base system</p>
          </div>
        </div>
      </div>

      {/* Role Indicator */}
      <div
        className={`${styles.roleCard} glow-card`}
        onMouseMove={handleCardMouseMove}
        onMouseLeave={handleCardMouseLeave}
      >
        <div className={styles.roleInfo}>
          {userRole === 'admin' ? (
            <Shield size={20} className={styles.roleIconAdmin} />
          ) : (
            <User size={20} className={styles.roleIconUser} />
          )}
          <div>
            <span className={styles.roleLabel}>Your Role</span>
            <span className={styles.roleName}>{userRole === 'admin' ? 'Administrator' : 'Team Member'}</span>
          </div>
        </div>
        <p className={styles.roleDesc}>
          {userRole === 'admin'
            ? 'You have full access to review and approve edits from team members.'
            : 'You can browse files and submit edit suggestions for admin review.'}
        </p>
      </div>

      {/* Quick Start */}
      <section
        className={`${styles.section} glow-card`}
        onMouseMove={handleCardMouseMove}
        onMouseLeave={handleCardMouseLeave}
      >
        <h2>
          <FileText size={20} />
          Quick Start Guide
        </h2>
        <div className={styles.stepsList}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepContent}>
              <h3>Browse the Knowledge Base</h3>
              <p>Navigate to <strong>Browse Files</strong> to explore all available knowledge documents organized by category.</p>
            </div>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepContent}>
              <h3>View a Document</h3>
              <p>Click on any file to read its full content. Documents are formatted in Markdown for easy reading.</p>
            </div>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepContent}>
              <h3>Submit an Edit</h3>
              <p>Found something to improve? Click <strong>Edit</strong> to suggest changes. Your edits will be reviewed before publishing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* For Team Members */}
      <section
        className={`${styles.section} glow-card`}
        onMouseMove={handleCardMouseMove}
        onMouseLeave={handleCardMouseLeave}
      >
        <h2>
          <User size={20} />
          For Team Members
        </h2>
        <div className={styles.sopGrid}>
          <div className={styles.sopCard}>
            <div className={styles.sopIcon}>
              <FolderOpen size={24} />
            </div>
            <h3>Browsing Files</h3>
            <ul>
              <li>Use the folder tree to navigate categories</li>
              <li>Click on any <code>.md</code> file to view its content</li>
              <li>Use search to quickly find specific documents</li>
            </ul>
          </div>

          <div className={styles.sopCard}>
            <div className={styles.sopIcon}>
              <Edit3 size={24} />
            </div>
            <h3>Submitting Edits</h3>
            <ul>
              <li>Click the <strong>Edit</strong> button while viewing a file</li>
              <li>Make your changes in the editor</li>
              <li>Add a brief description of your changes</li>
              <li>Click <strong>Submit for Review</strong></li>
            </ul>
          </div>

          <div className={styles.sopCard}>
            <div className={styles.sopIcon}>
              <Eye size={24} />
            </div>
            <h3>Tracking Your Edits</h3>
            <ul>
              <li>Check the dashboard for your edit status</li>
              <li><span className={styles.statusPending}>Pending</span> - Awaiting admin review</li>
              <li><span className={styles.statusApproved}>Approved</span> - Changes published</li>
              <li><span className={styles.statusRejected}>Rejected</span> - Changes not accepted</li>
            </ul>
          </div>
        </div>
      </section>

      {/* For Admins */}
      {userRole === 'admin' && (
        <section
          className={`${styles.section} glow-card`}
          onMouseMove={handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
        >
          <h2>
            <Shield size={20} />
            For Administrators
          </h2>
          <div className={styles.sopGrid}>
            <div className={styles.sopCard}>
              <div className={styles.sopIconAdmin}>
                <Clock size={24} />
              </div>
              <h3>Reviewing Pending Edits</h3>
              <ul>
                <li>Go to <strong>Pending Reviews</strong> from the dashboard</li>
                <li>Review the proposed changes side-by-side</li>
                <li>Check the diff view to see exact modifications</li>
                <li>Consider the context and accuracy of changes</li>
              </ul>
            </div>

            <div className={styles.sopCard}>
              <div className={styles.sopIconAdmin}>
                <CheckCircle size={24} />
              </div>
              <h3>Approving Edits</h3>
              <ul>
                <li>Click <strong>Approve</strong> if the changes are accurate</li>
                <li>Changes are automatically pushed to the knowledge base</li>
                <li>The submitter will see their edit marked as approved</li>
              </ul>
            </div>

            <div className={styles.sopCard}>
              <div className={styles.sopIconAdmin}>
                <XCircle size={24} />
              </div>
              <h3>Rejecting Edits</h3>
              <ul>
                <li>Click <strong>Reject</strong> if changes are incorrect</li>
                <li>Optionally add a reason for rejection</li>
                <li>The submitter can revise and resubmit</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Best Practices */}
      <section
        className={`${styles.section} glow-card`}
        onMouseMove={handleCardMouseMove}
        onMouseLeave={handleCardMouseLeave}
      >
        <h2>
          <Send size={20} />
          Best Practices
        </h2>
        <div className={styles.tipsGrid}>
          <div className={styles.tipCard}>
            <strong>Be Clear & Concise</strong>
            <p>Write edits that are easy to understand. Avoid jargon unless necessary.</p>
          </div>
          <div className={styles.tipCard}>
            <strong>Provide Context</strong>
            <p>When submitting edits, explain why the change is needed in your description.</p>
          </div>
          <div className={styles.tipCard}>
            <strong>Keep It Accurate</strong>
            <p>Double-check facts and product information before submitting.</p>
          </div>
          <div className={styles.tipCard}>
            <strong>One Topic at a Time</strong>
            <p>Focus each edit on a single improvement for easier review.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className={styles.footer}>
        <p>Need help? Contact your administrator for assistance.</p>
      </div>
    </div>
  );
}
