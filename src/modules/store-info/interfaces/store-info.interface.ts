import { StoreInfoStatus, StoreInfoType } from '../enums/store-info.enum';

export interface IStoreInfo {
  id: number;
  type: StoreInfoType;
  title: string;
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  status: StoreInfoStatus;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

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

export interface IFaqCategoryResponse {
  id: number;
  name: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IFaq {
  id: number;
  question: string;
  answer: string;
  faqCategoryId: number | null;
  faqCategory: IFaqCategoryResponse | null;
  displayOrder: number;
  isActive: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
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
