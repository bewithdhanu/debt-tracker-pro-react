export interface Contact {
  id: string;
  user_id: string;
  name: string;
  referral_name?: string;
  address?: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ContactFormData {
  name: string;
  referral_name?: string;
  address?: string;
  phone?: string;
}