## Story

- ID: [E?-S??] — <tiêu đề>
- Story: `roadmap/epics/<file>.md` · Plan: `roadmap/plans/<ID>.md`
- Người viết: codex | claude · Reviewer: codex | claude

## Thay đổi chính

-

## AC → bằng chứng

| AC | Đạt | Bằng chứng |
|---|---|---|
|  |  |  |

## Kiểm tra

- [ ] typecheck · lint · test qua (lệnh, exit code và bằng chứng)
- [ ] Build qua khi buildPolicy yêu cầu (epic-last: story cuối epic; CI build mọi PR)
- [ ] `lint:tokens` (sau E2) · ảnh chụp 390/1440 (story UI)

## Checklist DoD (AGENTS.md §7)

- [ ] Mọi AC đạt và có bằng chứng
- [ ] typecheck · lint · test qua; `lint:tokens` sau E2; build theo policy
- [ ] Có test cho logic mới và e2e cho luồng người dùng phù hợp
- [ ] Review theo policy trên SHA cuối; mọi finding P0/P1 đã xử lý
- [ ] Không màu/font/bo góc viết cứng; mọi truy vấn có `tenantId`; entitlement kiểm phía server
- [ ] Không dependency mới chưa giải thích
- [ ] Tài liệu/roadmap đã cập nhật nếu hành vi thay đổi

## Kết quả review

- Verdict, reviewer, SHA cuối, vòng sửa:
- Tóm tắt/đính kèm bằng chứng review và checks (không chỉ đường dẫn local ignored):
