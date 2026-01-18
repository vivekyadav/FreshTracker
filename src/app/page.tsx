import { Scanner } from "@/components/Scanner";
import { InventoryList } from "@/components/InventoryList";
import { ManualEntry } from "@/components/ManualEntry";
import { ShoppingBasket } from "lucide-react";
import { prisma } from "@/lib/prisma";

// Force dynamic since we are fetching data
export const dynamic = 'force-dynamic';

export default async function Home() {
  const items = await prisma.item.findMany({
    orderBy: { expiryDate: 'asc' }
  });

  // Serialize dates for client component
  const serializedItems = items.map((item) => ({
    ...item,
    expiryDate: item.expiryDate ? item.expiryDate.toISOString() : null,
    addedAt: item.addedAt.toISOString(),
  }));

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-green-100 p-2 rounded-lg text-green-600">
              <ShoppingBasket size={24} />
            </div>
            <h1 className="text-xl font-bold text-gray-800">FreshKeeper</h1>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-8">
        <section>
          <Scanner />
        </section>

        <section>
          <ManualEntry />
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Your Inventory</h2>
            <span className="text-sm text-gray-500">Sorted by expiry</span>
          </div>

          <InventoryList items={serializedItems} />
        </section>
      </div>
    </main>
  );
}
