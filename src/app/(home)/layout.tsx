import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

interface Props {
    children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
    return (
        <>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
        </>
    );
}

export default Layout;