"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Clock, Banknote } from "lucide-react";
import { ReactNode } from "react";

interface VendorRecordsTabsProps {
    entriesContent: ReactNode;
    payoutsContent: ReactNode;
}

// The active tab lives in the URL so pagination/filtering inside a tab
// (which navigates) doesn't bounce the user back to the first tab
export function VendorRecordsTabs({ entriesContent, payoutsContent }: VendorRecordsTabsProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const tab = searchParams.get('tab') === 'payouts' ? 'payouts' : 'entries';

    const handleChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === 'entries') {
            params.delete('tab');
        } else {
            params.set('tab', value);
        }
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    };

    return (
        <Tabs value={tab} onValueChange={handleChange}>
            <TabsList>
                <TabsTrigger value="entries" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time &amp; Expenses
                </TabsTrigger>
                <TabsTrigger value="payouts" className="flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    Payouts
                </TabsTrigger>
            </TabsList>
            <TabsContent value="entries" className="mt-4">
                {entriesContent}
            </TabsContent>
            <TabsContent value="payouts" className="mt-4">
                {payoutsContent}
            </TabsContent>
        </Tabs>
    );
}
