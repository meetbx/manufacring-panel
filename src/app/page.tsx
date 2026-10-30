import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect users visiting http://localhost:3001/ straight to login
  redirect('/login');
}