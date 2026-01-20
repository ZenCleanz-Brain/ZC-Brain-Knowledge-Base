'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './MarkdownViewer.module.css';

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

export default function MarkdownViewer({ content, className = '' }: MarkdownViewerProps) {
  return (
    <div className={`${styles.viewer} markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Generate IDs for headings to enable anchor link navigation
          h1: ({node, ...props}) => <h1 id={generateId(props.children)} {...props} />,
          h2: ({node, ...props}) => <h2 id={generateId(props.children)} {...props} />,
          h3: ({node, ...props}) => <h3 id={generateId(props.children)} {...props} />,
          h4: ({node, ...props}) => <h4 id={generateId(props.children)} {...props} />,
          h5: ({node, ...props}) => <h5 id={generateId(props.children)} {...props} />,
          h6: ({node, ...props}) => <h6 id={generateId(props.children)} {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// Generate slug from heading text for anchor links
function generateId(children: any): string {
  const text = extractText(children);
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/--+/g, '-')     // Replace multiple hyphens with single
    .trim();
}

// Extract plain text from React children
function extractText(children: any): string {
  if (typeof children === 'string') {
    return children;
  }
  if (Array.isArray(children)) {
    return children.map(extractText).join('');
  }
  if (children?.props?.children) {
    return extractText(children.props.children);
  }
  return '';
}
