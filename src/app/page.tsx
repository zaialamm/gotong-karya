
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/campaigns');
  return null; // Or a loading spinner, but redirect is immediate
}
