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
    const response = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: fullPath,
      message,
      content: Buffer.from(content).toString('base64'),
      sha,
      branch,
    });

    return {
      sha: response.data.content?.sha || '',
    };
  } catch (error) {
    console.error('GitHub updateFile error:', error);
    return null;
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
  const root: TreeNode[] = [];
  const pathMap = new Map<string, TreeNode>();

  // Sort items so directories come before files
  const sorted = [...items].sort((a, b) => {
    if (a.type === 'dir' && b.type === 'file') return -1;
    if (a.type === 'file' && b.type === 'dir') return 1;
    return a.name.localeCompare(b.name);
  });

  for (const item of sorted) {
    const node: TreeNode = {
      name: item.name,
      path: item.path,
      type: item.type,
      children: item.type === 'dir' ? [] : undefined,
    };

    pathMap.set(item.path, node);

    const parentPath = item.path.split('/').slice(0, -1).join('/');

    if (parentPath && pathMap.has(parentPath)) {
      pathMap.get(parentPath)!.children!.push(node);
    } else if (!parentPath) {
      root.push(node);
    }
  }

  return root;
}

// List all markdown files (flat list)
export async function listFiles(): Promise<FileInfo[]> {
  const allItems = await getFullTree();
  return allItems.filter((item) => item.type === 'file');
}

// Get nested file tree
export async function getFileTree(): Promise<TreeNode[]> {
  const allItems = await getFullTree();
  return buildTree(allItems);
}
