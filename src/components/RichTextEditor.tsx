"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { DivtTextEditor } from 'divt-text-editor';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  productId?: number;
  newsId?: number;
  projectId?: number;
  serviceId?: number;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Nhập nội dung...",
  className = "",
  productId,
  newsId,
  projectId,
  serviceId,
}: RichTextEditorProps) {
  // Create upload endpoint based on context
  let uploadEndpoint = '/api/upload';
  
  if (newsId !== undefined) {
    // For news editor - use news-specific upload endpoint
    uploadEndpoint = `/api/news/upload-editor?newsId=${newsId}`;
  } else if (projectId !== undefined) {
    // For project editor - use project-specific upload endpoint
    uploadEndpoint = `/api/projects/upload-editor?projectId=${projectId}`;
  } else if (serviceId !== undefined) {
    // For service editor - use service-specific upload endpoint
    // Pass serviceId even if it's 0 (for new services)
    uploadEndpoint = `/api/services/upload-editor?serviceId=${serviceId}`;
  } else if (productId !== undefined) {
    // For product editor - use product upload endpoint
    uploadEndpoint = `/api/upload?productId=${productId}`;
  }
  
  return (
    <div className={className}>
      <DivtTextEditor
        content={value}
        onChange={onChange}
        uploadEndpoint={uploadEndpoint}
      />
    </div>
  );
}
