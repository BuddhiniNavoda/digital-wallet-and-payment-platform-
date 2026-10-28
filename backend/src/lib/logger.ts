type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const SERVICE = 'backend';

export function log(
  level: LogLevel,
  msg: string,
  extra: { requestId?: string } = {},
): void {
  if (level === 'debug' && process.env.NODE_ENV === 'production') {
    return;
  }

  const line = {
    level,
    msg,
    service: SERVICE,
    requestId: extra.requestId,
    ts: new Date().toISOString(),
  };

  process.stdout.write(`${JSON.stringify(line)}\n`);
}
