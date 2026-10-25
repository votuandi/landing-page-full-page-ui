class UploadError extends Error {}
async function checked(response: Response) {
  if (!response.ok) {
    const value = await response.json().catch(() => null);
    throw new UploadError(typeof value?.error === "string" ? value.error : "Không thể tải tệp. Vui lòng thử lại.");
  }
  return response;
}

/** Each file owns its reservation and result; one failure must never stop the rest of the batch. */
export async function uploadMediaFiles(files: readonly File[], progress: (index: number, message: string, error?: boolean) => void, request: typeof fetch = fetch) {
  for (const [index, file] of files.entries()) {
    let id: string | undefined;
    try {
      progress(index, "Đang tải lên…");
      const reservation = await checked(await request("/api/media", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: file.name, mime: file.type, size: file.size }) }));
      const value = await reservation.json(); id = value.id;
      await checked(await request(value.upload.url, { method: value.upload.method, headers: value.upload.headers, body: file }));
      await checked(await request(`/api/media/${id}/complete`, { method: "POST" }));
      progress(index, "Đã tải lên · Đang xử lý");
    } catch (error) {
      progress(index, error instanceof UploadError ? error.message : "Không thể tải tệp. Kiểm tra kết nối và thử lại.", true);
      if (id) await request(`/api/media/${id}`, { method: "DELETE" }).catch(() => undefined);
    }
  }
}
