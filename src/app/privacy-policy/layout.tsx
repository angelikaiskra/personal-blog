import { SiteShell } from '@/components/ui/site-shell';

interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return <SiteShell>{children}</SiteShell>;
};

export default Layout;
