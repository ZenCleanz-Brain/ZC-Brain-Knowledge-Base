import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const owner = process.env.GITHUB_OWNER || '';
const repo = process.env.GITHUB_REPO || '';
const branch = process.env.GITHUB_BRANCH || 'main';
const kbBasePath = process.env.KB_BASE_PATH || 'PUBLISHED FOLDERS MASTER';

export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'dir';
  sha?: string;
}

export interface FileContent {
  content: string;
  sha: string;
  path: string;
  name: string;
}

export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: TreeNode[];
}

// Get contents of a directory from GitHub
export async function getContents(path: string = ''): Promise<FileInfo[]> {
  try {
    const fullPath = path ? `${kbBasePath}/${path}` : kbBasePath;
    const response = await octokit.repos.getContent({
      owner,
      repo,
      path: fullPath,
      ref: branch,
    });

    if (Array.isArray(response.data)) {
      return response.data
        .filter((item) => item.type === 'file' || item.type === 'dir')
        .filter((item) => item.type === 'dir' || item.name.endsWith('.md'))
        .map((item) => ({
          name: item.name,
          path: item.path.replace(`${kbBasePath}/`, ''),
          type: item.type as 'file' | 'dir',
          sha: item.sha,
        }));
    }

    return [];
  } catch (error) {
    console.error('GitHub getContents error:', error);
    return [];
  }
}

// Get file content from GitHub
export async function getFileContent(path: string): Promise<FileContent | null> {
  try {
    const fullPath = `${kbBasePath}/${path}`;
    const response = await octokit.repos.getContent({
      owner,
      repo,
      path: fullPath,
      ref: branch,
    });

    if (!Array.isArray(response.data) && response.data.type === 'file') {
      const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
      return {
        content,
        sha: response.data.sha,
        path: path,
        name: response.data.name,
      };
    }

    return null;
  } catch (error) {
    console.error('GitHub getFileContent error:', error);
    return null;
  }
}

// Update a file in GitHub
export async function updateFile(
  path: string,
  content: string,
  message: string,
  sha: string
): Promise<{ sha: string } | null> {
  try {
    const fullPath = `${kbBasePath}/${path}`;
    console.log('[GitHub] Attempting to update file:', fullPath);
    console.log('[GitHub] Using branch:', branch);
    console.log('[GitHub] Owner:', owner, 'Repo:', repo);
    console.log('[GitHub] SHA:', sha);

    const response = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: fullPath,
      message,
      content: Buffer.from(content).toString('base64'),
      sha,
      branch,
    });

    console.log('[GitHub] File updated successfully!');
    return {
      sha: response.data.content?.sha || '',
    };
  } catch (error: any) {
    console.error('[GitHub] updateFile error:', error.message);
    console.error('[GitHub] Full error:', JSON.stringify(error.response?.data || error, null, 2));
    console.error('[GitHub] Status:', error.status);
    return null;
  }
}

// Delete a file from GitHub
export async function deleteFile(
  path: string,
  message: string,
  sha: string
): Promise<boolean> {
  try {
    const fullPath = `${kbBasePath}/${path}`;
    console.log('[GitHub] Attempting to delete file:', fullPath);
    console.log('[GitHub] Using branch:', branch);
    console.log('[GitHub] SHA:', sha);

    await octokit.repos.deleteFile({
      owner,
      repo,
      path: fullPath,
      message,
      sha,
      branch,
    });

    console.log('[GitHub] File deleted successfully!');
    return true;
  } catch (error: any) {
    console.error('[GitHub] deleteFile error:', error.message);
    console.error('[GitHub] Full error:', JSON.stringify(error.response?.data || error, null, 2));
    console.error('[GitHub] Status:', error.status);
    return false;
  }
}

// Get the full tree structure recursively
export async function getFullTree(path: string = ''): Promise<FileInfo[]> {
  const items = await getContents(path);
  const result: FileInfo[] = [];

  for (const item of items) {
    result.push(item);
    if (item.type === 'dir') {
      const children = await getFullTree(item.path);
      result.push(...children);
    }
  }

  return result;
}

// Build a nested tree structure from flat list
export function buildTree(items: FileInfo[]): TreeNode[] {
  const pathMap = new Map<string, TreeNode>();

  // First pass: Create all nodes and ensure parent directories exist
  for (const item of items) {
    // Ensure all parent directories exist in the map
    const pathParts = item.path.split('/');
    let currentPath = '';

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (!pathMap.has(currentPath)) {
        const isLastPart = i === pathParts.length - 1;
        const nodeType = isLastPart ? item.type : 'dir';

        pathMap.set(currentPath, {
          name: part,
          path: currentPath,
          type: nodeType,
          children: nodeType === 'dir' ? [] : undefined,
        });
      }
    }
  }

  // Second pass: Build the hierarchy by attaching children to parents
  const root: TreeNode[] = [];

  for (const [path, node] of Array.from(pathMap.entries())) {
    const parentPath = path.split('/').slice(0, -1).join('/');

    if (parentPath && pathMap.has(parentPath)) {
      // Has a parent, add to parent's children
      const parent = pathMap.get(parentPath)!;
      if (!parent.children!.some(child => child.path === node.path)) {
        parent.children!.push(node);
      }
    } else if (!parentPath) {
      // No parent path means root level
      if (!root.some(n => n.path === node.path)) {
        root.push(node);
      }
    }
  }

  // Sort children recursively
  function sortChildren(nodes: TreeNode[]) {
    nodes.sort((a, b) => {
      if (a.type === 'dir' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'dir') return 1;
      return a.name.localeCompare(b.name);
    });

    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        sortChildren(node.children);
      }
    }
  }

  sortChildren(root);

  return root;
}

// List all markdown files (flat list)
export async function listFiles(): Promise<FileInfo[]> {
  const allItems = await getFullTree();
  return allItems.filter((item) => item.type === 'file');
}

// Commit info interface
export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

// Get recent commit history from GitHub
export async function getCommitHistory(limit: number = 20): Promise<CommitInfo[]> {
  try {
    const response = await octokit.repos.listCommits({
      owner,
      repo,
      sha: branch,
      per_page: limit,
    });

    return response.data.map((commit) => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.commit.author?.name || commit.author?.login || 'Unknown',
      date: commit.commit.author?.date || '',
      url: commit.html_url,
    }));
  } catch (error) {
    console.error('GitHub getCommitHistory error:', error);
    return [];
  }
}

// Get a specific commit details
export async function getCommit(sha: string): Promise<CommitInfo | null> {
  try {
    const response = await octokit.repos.getCommit({
      owner,
      repo,
      ref: sha,
    });

    return {
      sha: response.data.sha,
      message: response.data.commit.message,
      author: response.data.commit.author?.name || response.data.author?.login || 'Unknown',
      date: response.data.commit.author?.date || '',
      url: response.data.html_url,
    };
  } catch (error) {
    console.error('GitHub getCommit error:', error);
    return null;
  }
}

// Revert to a specific commit by restoring the file tree state at that commit
export async function getFileContentAtCommit(path: string, sha: string): Promise<string | null> {
  try {
    const fullPath = `${kbBasePath}/${path}`;
    const response = await octokit.repos.getContent({
      owner,
      repo,
      path: fullPath,
      ref: sha,
    });

    if (!Array.isArray(response.data) && response.data.type === 'file') {
      return Buffer.from(response.data.content, 'base64').toString('utf-8');
    }

    return null;
  } catch (error) {
    console.error('GitHub getFileContentAtCommit error:', error);
    return null;
  }
}

// Get nested file tree
export async function getFileTree(): Promise<TreeNode[]> {
  console.log('[GitHub] Starting getFileTree...');
  const allItems = await getFullTree();
  console.log('[GitHub] getFullTree returned', allItems.length, 'items');

  // Log some sample items
  console.log('[GitHub] Sample items:', allItems.slice(0, 5).map(i => `${i.type}:${i.path}`));

  const tree = buildTree(allItems);
  console.log('[GitHub] buildTree created', tree.length, 'root nodes');

  // Log the structure
  tree.forEach(node => {
    const childCount = node.children?.length || 0;
    console.log(`[GitHub] Root node: ${node.name} (${node.type}) - ${childCount} children`);
  });

  return tree;
}
