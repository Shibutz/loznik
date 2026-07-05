export type ViewMode = 'day' | 'week' | 'month' | 'year' | 'list' | 'digest';
export type AudienceType = 'school' | 'layer' | 'class' | 'mixed';
export type EventVisibility = 'public' | 'staff' | 'admin';
export type UserRole = 'public' | 'staff' | 'admin';

export interface SchoolYear {
  id: string;
  labelHebrew: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Layer {
  id: string;
  name: string;
  order: number;
  color: string;
  textColor: string;
  darkColor: string;
}

export interface SchoolClass {
  id: string;
  layerId: string;
  displayName: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Category {
  id: string;
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  sortOrder: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  schoolYearId: string;
  categoryId: string;
  startDateTime: string;
  endDateTime: string;
  allDay: boolean;
  layerIds: string[];
  classIds: string[];
  audienceType: AudienceType;
  visibility?: EventVisibility;
  createdAt: string;
  updatedAt: string;
}
