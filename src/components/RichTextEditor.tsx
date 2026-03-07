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
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Nhập nội dung...",
  className = "",
  productId,
}: RichTextEditorProps) {
  // Create upload endpoint with productId if provided
  const uploadEndpoint = productId ? `/api/upload?productId=${productId}` : '/api/upload';
  
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
