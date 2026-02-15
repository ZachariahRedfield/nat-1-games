export function resolveE2eExecutionMode({ chromiumInstalled, ciEnv }) {
  const isCi = ciEnv === '1' || ciEnv === 'true';

  if (chromiumInstalled) {
    return 'run';
  }

  return isCi ? 'fail' : 'skip';
}
