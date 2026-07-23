/**
 * Git operations using isomorphic-git.
 *
 * isomorphic-git works in both Node and the browser. In the Electron main
 * process we use plain `fs` (not lightning-fs). On push/pull, we fall back
 * to the system `git` binary if available — pushing over HTTPS with
 * isomorphic-git is fragile on some networks.
 */
import * as gitlib from 'isomorphic-git';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawn } from 'node:child_process';
import { app, safeStorage } from 'electron';
import { ProjectManager } from '../projects/project-manager';

export interface GitStatus {
  file: string;
  type: 'added' | 'modified' | 'deleted' | 'untracked' | 'ignored';
}

export interface GitLogEntry {
  oid: string;
  message: string;
  author: { name: string; email: string; timestamp: number };
  committer: { name: string; email: string; timestamp: number };
}

export interface GitBranch {
  current: string;
  all: string[];
}

export interface GitRemote {
  name: string;
  url: string;
}

export interface AddRemoteResult {
  ok: true;
}

export interface CommitResult {
  ok: true;
  sha: string;
}

export interface PushResult {
  ok: true;
}

export interface PullResult {
  ok: true;
}

export interface FetchResult {
  ok: true;
}

export interface CheckoutResult {
  ok: true;
}

export interface CreateBranchResult {
  ok: true;
}

const DEFAULT_BRANCH = 'main';

export class GitRepo {
  private static current: GitRepo | null = null;

  static active(): GitRepo | null {
    return GitRepo.current;
  }

  static setActive(repo: GitRepo): void {
    GitRepo.current = repo;
  }

  constructor(public readonly dir: string) {}

  /** Initialize a new git repo in the project root and write a .gitignore. */
  async init(): Promise<void> {
    if (!fs.existsSync(path.join(this.dir, '.git'))) {
      await gitlib.init({ fs, dir: this.dir, defaultBranch: DEFAULT_BRANCH });
    }
    await this.writeGitignore();
    await this.commitInitial();
    GitRepo.setActive(this);
  }

  private async writeGitignore(): Promise<void> {
    const file = path.join(this.dir, '.gitignore');
    const contents = [
      '.ycode/config.json',
      'node_modules/',
      'out/',
      '!out/.gitkeep',
      '.DS_Store',
      'Thumbs.db',
      '*.log',
      '',
    ].join('\n');
    if (!fs.existsSync(file)) {
      await fs.promises.writeFile(file, contents, 'utf8');
    }
  }

  async commitInitial(): Promise<CommitResult> {
    // Stage everything and create an initial commit if the repo is empty.
    await this.addAll();
    const log = await gitlib.log({ fs, dir: this.dir, depth: 1 }).catch(() => []);
    if (log.length > 0) {
      return { ok: true, sha: log[0].oid };
    }
    const sha = await gitlib.commit({
      fs,
      dir: this.dir,
      author: { name: this.authorName(), email: this.authorEmail() },
      message: 'Initial commit',
    });
    return { ok: true, sha };
  }

  async status(): Promise<GitStatus[]> {
    const matrix = await gitlib.statusMatrix({ fs, dir: this.dir });
    const result: GitStatus[] = [];
    for (const [filepath, , workdir, stage] of matrix) {
      if (workdir === 0 && stage === 0) continue; // clean
      if (workdir === 2 && stage === 0) {
        result.push({ file: filepath, type: 'untracked' });
      } else if (workdir === 2 && stage === 2) {
        if (workdir !== stage) {
          result.push({ file: filepath, type: 'modified' });
        }
      } else if (workdir === 0 && stage === 1) {
        result.push({ file: filepath, type: 'deleted' });
      } else if (workdir === 1 && stage === 0) {
        result.push({ file: filepath, type: 'deleted' });
      } else {
        result.push({ file: filepath, type: 'modified' });
      }
    }
    return result;
  }

  async log(limit: number): Promise<GitLogEntry[]> {
    const entries = await gitlib.log({ fs, dir: this.dir, depth: limit, ref: DEFAULT_BRANCH });
    return entries.map((e) => ({
      oid: e.oid,
      message: e.commit.message,
      author: {
        name: e.commit.author.name,
        email: e.commit.author.email,
        timestamp: e.commit.author.timestamp,
      },
      committer: {
        name: e.commit.committer.name,
        email: e.commit.committer.email,
        timestamp: e.commit.committer.timestamp,
      },
    }));
  }

  async diff(filepath: string): Promise<string> {
    // Use the system git diff for a stable, readable output.
    return await runGit(this.dir, ['diff', '--', filepath]);
  }

  async commit(message: string): Promise<CommitResult> {
    if (!message.trim()) {
      throw new Error('Commit message cannot be empty');
    }
    await this.addAll();
    const sha = await gitlib.commit({
      fs,
      dir: this.dir,
      author: { name: this.authorName(), email: this.authorEmail() },
      message,
    });
    return { ok: true, sha };
  }

  async branch(): Promise<GitBranch> {
    const current = (await gitlib.currentBranch({ fs, dir: this.dir })) ?? DEFAULT_BRANCH;
    const all = await gitlib.listBranches({ fs, dir: this.dir });
    return { current, all };
  }

  async checkout(branch: string): Promise<CheckoutResult> {
    await gitlib.checkout({ fs, dir: this.dir, ref: branch });
    return { ok: true };
  }

  async createBranch(branch: string): Promise<CreateBranchResult> {
    await gitlib.branch({ fs, dir: this.dir, ref: branch });
    await gitlib.checkout({ fs, dir: this.dir, ref: branch });
    return { ok: true };
  }

  async remote(): Promise<GitRemote[]> {
    const list = await gitlib.listRemotes({ fs, dir: this.dir });
    return list.map((r) => ({ name: r.remote, url: r.url }));
  }

  async addRemote(name: string, url: string): Promise<AddRemoteResult> {
    await gitlib.addRemote({ fs, dir: this.dir, remote: name, url, force: true });
    return { ok: true };
  }

  async push(remote: string, branch?: string): Promise<PushResult> {
    const branchName = branch ?? (await gitlib.currentBranch({ fs, dir: this.dir })) ?? DEFAULT_BRANCH;
    // We shell out to the system git binary for push. isomorphic-git's HTTP
    // plugin types don't line up with our simple wrapper, and the system
    // git binary is more reliable over HTTPS anyway.
    const token = await getStoredGithubToken();
    const env = token ? { ...process.env, GIT_ASKPASS: 'echo', GIT_TOKEN: token } : process.env;
    await runGit(this.dir, ['push', remote, branchName], env);
    return { ok: true };
  }

  async pull(remote: string, branch?: string): Promise<PullResult> {
    const branchName = branch ?? (await gitlib.currentBranch({ fs, dir: this.dir })) ?? DEFAULT_BRANCH;
    await runGit(this.dir, ['pull', remote, branchName]);
    return { ok: true };
  }

  async fetch(remote: string): Promise<FetchResult> {
    await runGit(this.dir, ['fetch', remote]);
    return { ok: true };
  }

  private async addAll(): Promise<void> {
    const matrix = await gitlib.statusMatrix({ fs, dir: this.dir });
    for (const [filepath, , workdir, stage] of matrix) {
      if (workdir === 0 && stage === 0) continue;
      if (workdir === 2 && stage === 0) {
        await gitlib.add({ fs, dir: this.dir, filepath });
      } else if (workdir === 0 && stage !== 0) {
        await gitlib.remove({ fs, dir: this.dir, filepath });
      } else {
        await gitlib.add({ fs, dir: this.dir, filepath });
      }
    }
  }

  private authorName(): string {
    return process.env.YCODE_GIT_AUTHOR_NAME ?? 'Ycode User';
  }

  private authorEmail(): string {
    return process.env.YCODE_GIT_AUTHOR_EMAIL ?? 'user@ycode.local';
  }
}

export const gitRepo = {
  active(): GitRepo | null {
    const active = ProjectManager.active();
    if (!active) return GitRepo.active();
    const repo = GitRepo.active();
    if (repo && repo.dir === active.path) return repo;
    const fresh = new GitRepo(active.path);
    GitRepo.setActive(fresh);
    return fresh;
  },
};

function runGit(cwd: string, args: string[], envOverride?: NodeJS.ProcessEnv): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('git', args, { cwd, env: envOverride ?? process.env });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => (stdout += d.toString()));
    proc.stderr.on('data', (d) => (stderr += d.toString()));
    proc.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr || `git ${args.join(' ')} exited with code ${code}`));
    });
    proc.on('error', (err) => reject(err));
  });
}

async function getStoredGithubToken(): Promise<string | null> {
  try {
    const file = path.join(app.getPath('userData'), 'github-token.enc');
    if (!fs.existsSync(file)) return null;
    const encrypted = await fs.promises.readFile(file);
    if (!safeStorage.isEncryptionAvailable()) return null;
    const decrypted = safeStorage.decryptString(encrypted);
    const parsed = JSON.parse(decrypted);
    return parsed.access_token ?? null;
  } catch {
    return null;
  }
}
