import type { PluginOption } from 'vite';

import { readWorkspaceManifest } from '@pnpm/workspace.read-manifest';

import { dateUtil, readPackageJSON } from '../utils';

/**
 * 将 catalog: 占位符替换为真实版本号
 */
function resolveVersions(
  deps: Record<string, string>,
  catalog: Record<string, string>,
): Record<string, string> {
  const resolved: Record<string, string> = {};
  for (const [name, version] of Object.entries(deps)) {
    resolved[name] =
      version === 'catalog:' ? (catalog[name] ?? version) : version;
  }
  return resolved;
}

/**
 * 用于注入项目信息
 */
async function viteMetadataPlugin(
  root = process.cwd(),
): Promise<PluginOption | undefined> {
  const {
    author,
    dependencies = {},
    description,
    devDependencies = {},
    homepage,
    license,
    version,
  } = await readPackageJSON(root);

  // 从 pnpm-workspace.yaml 解析 catalog 版本映射
  const manifest = await readWorkspaceManifest(root);
  const catalog = (manifest?.catalog as Record<string, string>) ?? {};

  const buildTime = dateUtil().format('YYYY-MM-DD HH:mm:ss');

  return {
    config() {
      const isAuthorObject = typeof author === 'object';
      const authorName = isAuthorObject ? author.name : author;
      const authorEmail = isAuthorObject ? author.email : null;
      const authorUrl = isAuthorObject ? author.url : null;

      return {
        define: {
          __VBEN_ADMIN_METADATA__: JSON.stringify({
            authorEmail,
            authorName,
            authorUrl,
            buildTime,
            dependencies: resolveVersions(dependencies, catalog),
            description,
            devDependencies: resolveVersions(devDependencies, catalog),
            homepage,
            license,
            version,
          }),
          'import.meta.env.VITE_APP_VERSION': JSON.stringify(version),
        },
      };
    },
    enforce: 'post',
    name: 'vite:inject-metadata',
  };
}

export { viteMetadataPlugin };
