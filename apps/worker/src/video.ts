import { spawn } from "node:child_process";

export class InvalidVideoError extends Error {
  constructor() { super("invalid or too long video"); }
}

/** No shell, network protocols or unbounded output from uploaded containers. */
export function runVideoTool(command: string, args: string[], options: { spawn?: typeof spawn } = {}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const child = (options.spawn ?? spawn)(command, args, { shell: false, windowsHide: true, stdio: ["ignore", "pipe", "ignore"] });
    const chunks: Buffer[] = []; let size = 0, aborted = false;
    const stop = () => { aborted = true; child.kill("SIGKILL"); };
    const timer = setTimeout(stop, 60_000);
    child.stdout!.on("data", (chunk: Buffer) => {
      if (aborted) return;
      size += chunk.length;
      if (size > 50 * 1024 * 1024) { stop(); return; }
      chunks.push(chunk);
    });
    child.on("error", error => { clearTimeout(timer); reject(error); });
    // Wait for termination before the caller removes the temporary input (also on Windows).
    child.on("close", code => {
      clearTimeout(timer);
      if (aborted || code !== 0) reject(new InvalidVideoError());
      else resolve(Buffer.concat(chunks, size));
    });
  });
}

type Runner = (command: string, args: string[]) => Promise<Buffer>;
export async function probeVideo(path: string, run: Runner = runVideoTool): Promise<{ duration: number; width: number; height: number }> {
  const output = await run(process.env.FFPROBE_PATH || "ffprobe", ["-v", "error", "-protocol_whitelist", "file,pipe", "-print_format", "json", "-show_format", "-show_streams", path]);
  try {
    const data = JSON.parse(output.toString("utf8"));
    const stream = data.streams?.find((item: { codec_type?: string }) => item.codec_type === "video");
    const duration = Number(data.format?.duration ?? stream?.duration), width = Number(stream?.width), height = Number(stream?.height);
    if (![duration, width, height].every(value => Number.isFinite(value) && value > 0) || width * height > 50_000_000) throw new InvalidVideoError();
    return { duration, width, height };
  } catch { throw new InvalidVideoError(); }
}

export function posterFrame(path: string, at: number, run: Runner = runVideoTool) {
  return run(process.env.FFMPEG_PATH || "ffmpeg", ["-v", "error", "-nostdin", "-protocol_whitelist", "file,pipe", "-ss", String(at), "-i", path, "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "-"]);
}
