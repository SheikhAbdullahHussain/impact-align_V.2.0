import type { Metadata } from 'next';
import { ProfileForm } from '@/components/dashboard/profile-form';
export const metadata: Metadata = { title: 'Profile' };
export default function ProfilePage() { return <ProfileForm />; }
