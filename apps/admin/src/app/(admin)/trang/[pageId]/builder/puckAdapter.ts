import type { Data } from "@puckeditor/core";
import type { EditableSection } from "@solar/cms-ui";

type Props = Omit<EditableSection, "type"> & { data: unknown };

export const toPuck = (sections: EditableSection[], contents: Record<string, unknown>): Data => ({
  root: { props: {} },
  content: sections.map(({ type, ...section }) => ({ type, props: { ...section, data: contents[section.id] } })),
});

export const fromPuck = (data: Data): EditableSection[] => data.content.map(item => {
  const { data: _data, ...section } = item.props as unknown as Props;
  return { ...section, type: String(item.type) } as EditableSection;
});

/** Chỉ gửi section có nội dung khác lần lưu trước; section ngoài demo giữ nguyên trên server. */
export function editedContents(data: Data, saved: Record<string, string>) {
  return Object.fromEntries(data.content.flatMap(item => {
    const { id, data: value } = item.props as unknown as Props;
    return JSON.stringify(value) === saved[id] ? [] : [[id, value]];
  }));
}

export const snapshot = (data: Data) => Object.fromEntries(data.content.map(item => {
  const { id, data: value } = item.props as unknown as Props;
  return [id, JSON.stringify(value)];
}));
