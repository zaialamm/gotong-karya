import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect root page to the main route group
  redirect('/');
  
  // This return is unreachable but needed to satisfy TypeScript
  return null;
}
