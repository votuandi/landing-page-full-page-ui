/** RFC 4180 records; reject malformed quoting instead of silently corrupting cells. */
export function parseCsv(text: string): string[][] {
  text = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false, closed = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char !== '"') cell += char;
      else if (text[i + 1] === '"') { cell += '"'; i++; }
      else { quoted = false; closed = true; }
    } else if (char === "," || char === "\r" || char === "\n") {
      row.push(cell); cell = ""; closed = false;
      if (char !== ",") {
        rows.push(row); row = [];
        if (char === "\r" && text[i + 1] === "\n") i++;
      }
    } else if (char === '"' && !cell && !closed) quoted = true;
    else {
      if (closed || char === '"') throw new Error(`CSV không hợp lệ ở bản ghi ${rows.length + 1}`);
      cell += char;
    }
  }
  if (quoted) throw new Error(`CSV thiếu dấu nháy ở bản ghi ${rows.length + 1}`);
  if (cell || closed || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

export function toCsv(rows: readonly (readonly string[])[]): string {
  return "\uFEFF" + rows.map(row => row.map(cell => /[",\r\n]/.test(cell) ? `"${cell.replaceAll('"', '""')}"` : cell).join(",")).join("\r\n") + "\r\n";
}
