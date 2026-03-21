import { DashboardContainer } from '@/components/layout/DashboardContainer';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardContainer>{children}</DashboardContainer>;
}
