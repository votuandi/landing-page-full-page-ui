import { shortsFixture } from "./fixtures";

/** v1 → v2: giữ nội dung và bổ sung nhãn phân khúc mặc định cho dữ liệu cũ. */
export function migrateShortsV1(data: Record<string, unknown>) {
  return { ...data, segmentLabels: data.segmentLabels ?? shortsFixture.segmentLabels };
}

/** v2 → v3: thêm `channels` (rỗng → không hiện link kênh như trước). */
export function migrateShortsV2(data: Record<string, unknown>) {
  return { ...data, channels: data.channels ?? [] };
}
