import { loadEnv } from 'vite';

type EnvBag = Record<string, string | undefined>;
type EnvLoader = (mode: string, envDir: string, prefixes: string | string[]) => Record<string, string>;

export const hydrateServerEnv = (
  mode = process.env.NODE_ENV || 'development',
  root = process.cwd(),
  targetEnv: EnvBag = process.env,
  envLoader: EnvLoader = loadEnv,
) => {
  const loaded = envLoader(mode, root, '');

  for (const [key, value] of Object.entries(loaded)) {
    if (targetEnv[key] === undefined || targetEnv[key] === '') {
      targetEnv[key] = value;
    }
  }

  return targetEnv;
};
