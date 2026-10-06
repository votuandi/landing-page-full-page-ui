import { assumptions, brand, copy, legal, pricing, projects, pvout, segments, testimonials } from "./data";
export type * from "./types";
// TODO(backend): thay bằng API. Giữ tên hàm và kiểu dữ liệu; không import data trực tiếp trong component.
// Snapshot đồng bộ là hợp đồng hiện tại. Khi nối API, hydrate/cache snapshot tại lớp adapter/provider,
// giữ getter đồng bộ để component hiện có không cần đổi sang Promise.
export const getBrand = () => brand;
export const getPricing = () => pricing;
export const getPvout = () => pvout;
export const getAssumptions = () => assumptions;
export const getLegal = () => legal;
export const getProjects = () => projects;
export const getTestimonials = () => testimonials;
export const getSegments = () => segments;
export const getCopy = () => copy;
