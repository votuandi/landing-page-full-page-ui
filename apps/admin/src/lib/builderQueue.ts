import type { PageSectionResult } from "./pageSections.ts";

/** Read revision when work starts, after all earlier writes have completed. */
export function createBuilderQueue(initialRevision: number) {
  let revision = initialRevision, tail = Promise.resolve(), conflict = false;
  return {
    write(work: (revision: number) => Promise<PageSectionResult>): Promise<PageSectionResult> {
      const result = tail.then(async (): Promise<PageSectionResult> => {
        if (conflict) return { ok: false, status: 409, error: "Trang đã thay đổi ở nơi khác. Vui lòng tải lại trang." };
        try {
          const result = await work(revision);
          if (result.ok && result.revision !== undefined) revision = result.revision;
          if (result.status === 409) conflict = true;
          return result;
        } catch { return { ok: false, error: "Không thể kết nối. Vui lòng thử lại." }; }
      });
      tail = result.then(() => {});
      return result;
    },
  };
}
