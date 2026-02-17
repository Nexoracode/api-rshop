import { StoreInfoStatus, StoreInfoType } from '../enums/store-info.enum';

export interface IStoreInfoResponse {
  id: number;
  type: StoreInfoType;
  title: string;
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface IIconResponse {
  id: number;
  name: string;
  svg: string;
}

export interface IFaqCategoryResponse {
  id: number;
  name: string;
  iconId: number | null;
  icon: IIconResponse | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IFaqResponse {
  id: number;
  question: string;
  answer: string;
  faqCategoryId: number | null;
  faqCategory: IFaqCategoryResponse | null;
  displayOrder: number;
  isActive: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IFaqGroupedByCategory {
  category: IFaqCategoryResponse | null;
  faqs: IFaqResponse[];
}
