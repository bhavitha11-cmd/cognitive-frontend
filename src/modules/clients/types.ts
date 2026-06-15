export interface Client {
  id: string;
  clientCode: string;
  name: string;
  industry?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  country?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  projectCount: number;
  createdAt?: string;
}

export interface ClientCreate {
  clientCode?: string;
  name: string;
  industry?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  country?: string;
  address?: string;
  notes?: string;
}

export interface ClientUpdate extends Partial<ClientCreate> {}

export interface ClientListResponse {
  clients: Client[];
  total: number;
  skip: number;
  limit: number;
}
