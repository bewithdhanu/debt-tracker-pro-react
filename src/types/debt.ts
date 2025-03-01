export interface Debt {
  id: string;
  user_id: string;
  contact_id: string;
  contact_name?: string;
  principal_amount: number;
  interest_rate: number;
  debt_date: string;
  type: 'I Owe' | 'Owe Me';
  status: 'active' | 'completed';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DebtFormData {
  contact_id: string;
  principal_amount: number;
  interest_rate: number;
  debt_date: string;
  type: 'I Owe' | 'Owe Me';
  status?: 'active' | 'completed';
  notes?: string;
}