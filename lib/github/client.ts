/**
 * GitHub REST API client.
 *
 * Talks directly to https://api.github.com. The OAuth Device Flow is
 * specified at https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps#device-flow.
 */
const CLIENT_ID = process.env.YCODE_GITHUB_CLIENT_ID ?? 'Iv1.b507a08c87b8e858';
// ^ Public OAuth app client ID shipped with Ycode. Users can override at
//   build time via YCODE_GITHUB_CLIENT_ID.

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

export class GitHubClient {
  constructor(private readonly opts: { token: string | null }) {}

  async requestDeviceCode(): Promise<{
    userCode: string;
    verificationUri: string;
    deviceCode: string;
    interval: number;
  }> {
    const res = await fetch('https://github.com/login/device/code', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        scope: 'repo,user,workflow',
      }),
    });
    if (!res.ok) {
      throw new Error(`Device code request failed: ${res.status}`);
    }
    const data = (await res.json()) as DeviceCodeResponse;
    return {
      userCode: data.user_code,
      verificationUri: data.verification_uri,
      deviceCode: data.device_code,
      interval: data.interval,
    };
  }

  async pollForToken(deviceCode: string, interval: number): Promise<TokenResponse> {
    const deadline = Date.now() + 10 * 60 * 1000; // 10 minute max
    while (Date.now() < deadline) {
      const res = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          device_code: deviceCode,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        }),
      });
      const data = (await res.json()) as
        | TokenResponse
        | { error: string; error_description?: string };

      if ('access_token' in data) {
        return data;
      }
      if (data.error === 'authorization_pending') {
        await sleep(interval * 1000);
        continue;
      }
      if (data.error === 'slow_down') {
        await sleep((interval + 5) * 1000);
        continue;
      }
      if (data.error === 'expired_token') {
        throw new Error('Device code expired. Please restart the connection.');
      }
      if (data.error === 'access_denied') {
        throw new Error('You denied the authorization request.');
      }
      throw new Error(data.error_description ?? data.error);
    }
    throw new Error('Timed out waiting for authorization');
  }

  async getAuthenticatedUser(): Promise<{ login: string; id: number; avatarUrl: string }> {
    const user = await this.api<{ login: string; id: number; avatar_url: string }>('/user');
    return { login: user.login, id: user.id, avatarUrl: user.avatar_url };
  }

  async listRepos(): Promise<{ name: string; fullName: string; private: boolean; htmlUrl: string }[]> {
    const repos = await this.api<
      Array<{ name: string; full_name: string; private: boolean; html_url: string }>
    >('/user/repos?per_page=100&sort=updated');
    return repos.map((r) => ({
      name: r.name,
      fullName: r.full_name,
      private: r.private,
      htmlUrl: r.html_url,
    }));
  }

  async createRepo(
    name: string,
    opts: { isPrivate: boolean; description?: string },
  ): Promise<{ html_url: string; clone_url: string }> {
    return this.api<{ html_url: string; clone_url: string }>('/user/repos', {
      method: 'POST',
      body: JSON.stringify({
        name,
        private: opts.isPrivate,
        description: opts.description ?? '',
        auto_init: false,
      }),
    });
  }

  private async api<T>(path: string, init?: RequestInit): Promise<T> {
    if (!this.opts.token) throw new Error('Not connected to GitHub');
    const res = await fetch(`https://api.github.com${path}`, {
      ...init,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${this.opts.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GitHub API ${res.status}: ${text}`);
    }
    return (await res.json()) as T;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
