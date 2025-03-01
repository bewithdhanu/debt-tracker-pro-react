export interface Activity {
  id: string;
  debt_id: string;
  user_id: string;
  activity_type: 'Interest' | 'Note' | 'Payment' | 'Additional Loan';
  amount: number;
  activity_date: string;
  notes?: string;
  months?: number;
  closing_debt?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ActivityFormData {
  activity_type: 'Interest' | 'Note' | 'Payment' | 'Additional Loan';
  amount: number;
  activity_date: string;
  notes?: string;
  months?: number;
  closing_debt?: boolean;
}

export interface NotesActivityFormData {
  activity_date: string;
  notes: string;
}

export interface InterestActivityFormData {
  months: number;
  amount: number;
  activity_date: string;
  closing_debt: boolean;
  notes?: string;
}