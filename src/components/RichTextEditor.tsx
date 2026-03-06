"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { DivtTextEditor } from 'divt-text-editor';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Nhập nội dung...",
  className = "",
}: RichTextEditorProps) {
  return (
    <div className={className}>
      <DivtTextEditor
        content={value}
        onChange={onChange}
        uploadEndpoint="/api/upload"
      />
    </div>
  );
}
