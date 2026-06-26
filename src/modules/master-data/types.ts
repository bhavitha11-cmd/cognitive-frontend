export interface TaskTemplate {
  id: string;
  templateCode: string;
  title: string;
  description?: string;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskTemplateCreate {
  title: string;
  description?: string;
}

export interface TaskTemplateUpdate {
  title?: string;
  description?: string;
  isActive?: boolean;
}

export interface TaskTemplateSearchItem {
  id: string;
  templateCode: string;
  title: string;
  description?: string;
}

export interface TaskTemplateListResponse {
  templates: TaskTemplate[];
  total: number;
  skip: number;
  limit: number;
}
