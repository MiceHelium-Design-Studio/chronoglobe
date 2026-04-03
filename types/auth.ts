import { User as FirebaseUser } from 'firebase/auth';
import { UserBilling } from './plans';

export interface AuthState {
  user: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  billing: UserBilling;
}
