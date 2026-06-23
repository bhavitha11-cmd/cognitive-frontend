export interface Client {
  id: string;
  clientCode: string;
  name: string;
  industry?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  alternatePhone?: string;
  country?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  status: string;
  deactivationReason?: string;
  deactivatedAt?: string;
  deactivatedBy?: string;
  projectCount: number;
  createdAt?: string;
}

export interface ClientCreate {
  clientCode: string;
  name: string;
  industry?: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  alternatePhone?: string;
  country: string;
  address: string;
  notes?: string;
}

export interface ClientUpdate extends Partial<ClientCreate> {
  isActive?: boolean;
  status?: string;
  deactivationReason?: string;
}

export interface ClientListResponse {
  clients: Client[];
  total: number;
  skip: number;
  limit: number;
}
