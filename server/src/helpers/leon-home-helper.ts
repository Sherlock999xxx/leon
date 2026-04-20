import os from 'node:os'
import path from 'node:path'

export const DEFAULT_LEON_PROFILE = 'just-me'
const LEON_HOME_DIRNAME = '.leon'

/**
 * Resolve the Leon application root from the current process environment.
 * This stays overrideable so scripts, tests, and managed runtimes can all
 * agree on the same codebase location.
 */
export function resolveLeonAppRoot(
  env: NodeJS.ProcessEnv = process.env
): string {
  return path.resolve(env['LEON_APP_ROOT'] || process.cwd())
}

/**
 * Resolve the user-owned Leon home directory where mutable runtime data lives.
 * Falls back to `~/.leon` when no explicit override is provided.
 */
export function resolveLeonHome(
  env: NodeJS.ProcessEnv = process.env
): string {
  const configuredLeonHome = String(env['LEON_HOME'] || '').trim()

  return configuredLeonHome
    ? path.resolve(configuredLeonHome)
    : path.join(os.homedir(), LEON_HOME_DIRNAME)
}

/**
 * Resolve the active Leon profile name.
 */
export function resolveLeonProfile(
  env: NodeJS.ProcessEnv = process.env
): string {
  return String(env['LEON_PROFILE'] || '').trim() || DEFAULT_LEON_PROFILE
}

/**
 * Resolve the directory that contains all Leon profiles.
 */
export function resolveLeonProfilesPath(
  env: NodeJS.ProcessEnv = process.env
): string {
  return path.join(resolveLeonHome(env), 'profiles')
}

/**
 * Resolve the active Leon profile directory.
 */
export function resolveLeonProfilePath(
  env: NodeJS.ProcessEnv = process.env
): string {
  return path.join(resolveLeonProfilesPath(env), resolveLeonProfile(env))
}

/**
 * Resolve the `.env` file path for the active Leon profile.
 */
export function resolveProfileDotEnvPath(
  env: NodeJS.ProcessEnv = process.env
): string {
  return path.join(resolveLeonProfilePath(env), '.env')
}

/**
 * Normalize the shared Leon path-related environment variables so every entry
 * point resolves the same app root, home, and profile paths.
 */
export function syncLeonHomeEnvironment(
  env: NodeJS.ProcessEnv = process.env
): void {
  env['LEON_APP_ROOT'] = resolveLeonAppRoot(env)
  env['LEON_HOME'] = resolveLeonHome(env)
  env['LEON_PROFILE'] = resolveLeonProfile(env)
  env['LEON_PROFILE_PATH'] = resolveLeonProfilePath(env)
}
