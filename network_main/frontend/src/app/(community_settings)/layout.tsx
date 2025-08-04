import Navbar from "@/components/header/navbar";
import type { Metadata } from "next";


export const metadata: Metadata = {
    title: "Community managment",
    description: "Community settings",
};

export default function CpmmunitySettingsLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <Navbar />
            <main className="w-full">
                {children}
            </main>
        </>
    );
}