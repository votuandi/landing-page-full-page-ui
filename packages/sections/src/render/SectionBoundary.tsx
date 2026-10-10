"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { tenantId: string; sectionId: string; type: string; children: ReactNode };

// Lỗi render của một section chỉ làm section đó rỗng; wrapper ngoài giữ id neo.
export class SectionBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const { tenantId, sectionId, type } = this.props;
    console.error("[sections] render section lỗi", { tenantId, sectionId, type, error, stack: info.componentStack });
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
