import Sidebar from "@/components/sidebar/sidebar";
import Navbar from "@/components/header/navbar";

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <Navbar />
            <div className="flex min-h-screen">
                <Sidebar />
                <main className="flex-[5] mt-[60px] sm:mt-[30px] md:mt-[0px]">
                    {children}
                </main>
            </div>
        </>
    );
}