import { Suspense } from "react";
import GithubCallback from "@/components/auth/GithubCallback";

export default function Page() {
    return (
        <Suspense fallback={<div>Loading GitHub callback...</div>}>
            <GithubCallback />
        </Suspense>
    );
}
