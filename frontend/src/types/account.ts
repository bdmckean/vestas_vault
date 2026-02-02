export type AccountType = 'pretax' | 'roth' | 'taxable' | 'cash';

export interface Account {
  id: string;
  name: string;
  account_type: AccountType;
  balance: string;
  created_at: string;
  updated_at: string;
}

export interface AccountCreate {
  name: string;
  account_type: AccountType;
  balance: string;
}

export interface AccountUpdate {
  name?: string;
  account_type?: AccountType;
  balance?: string;
}
