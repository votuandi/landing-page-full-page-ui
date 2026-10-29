export class ChannelError extends Error {
  constructor(message: string, public readonly permanent = false) { super(message); }
}
export function checkStatus(status: number, channel: string) {
  if (status >= 200 && status < 300) return;
  throw new ChannelError(`${channel}: dịch vụ trả mã ${status}`, status >= 400 && status < 500 && ![408, 429].includes(status));
}
