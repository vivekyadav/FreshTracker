import { auth, signOut } from '@/auth';
import { Scanner } from '@/components/Scanner';
import { InventoryList } from '@/components/InventoryList';
import { ManualEntry } from '@/components/ManualEntry';
import { NotificationManager } from '@/components/NotificationManager';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ChefHat, LogIn, LogOut, User as UserIcon } from 'lucide-react';

export default async function Home() {
  const session = await auth();

  // Fetch items only if logged in
  let items: any[] = [];

  if (session?.user?.id) {
    items = await prisma.item.findMany({
      where: { userId: session.user.id },
      orderBy: { expiryDate: 'asc' },
    });
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20 md:pb-10">
      <div className="max-w-md mx-auto md:max-w-4xl bg-white min-h-screen shadow-2xl overflow-hidden flex flex-col relative">

        {/* Header */}
        <header className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 pb-24 rounded-b-[2.5rem] shadow-lg relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl">
                <ChefHat size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">FreshKeeper</h1>
                <p className="text-green-100 text-sm font-medium">Smart Pantry Tracker</p>
              </div>
            </div>

            {session ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-semibold">{session.user?.email?.split('@')[0]}</span>
                  <span className="text-xs text-green-100">Pro Member</span>
                </div>
                <form action={async () => {
                  'use server';
                  await signOut({ redirectTo: '/' });
                }}>
                  <button className="bg-white/10 hover:bg-white/20 p-2 rounded-xl backdrop-blur-sm transition-all" title="Sign Out">
                    <LogOut size={20} />
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-white/90 hover:text-white px-3 py-2 text-sm font-semibold transition-colors">
                  Log In
                </Link>
                <Link href="/signup" className="bg-white text-green-600 px-4 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-green-50 transition-colors flex items-center gap-2">
                  <UserIcon size={16} />
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <NotificationManager items={items} />
          </div>
        </header>

        {/* content */}
        <div className="flex-1 px-4 sm:px-6 -mt-16 relative z-20 space-y-6">
          {/* Scanner Section */}
          <div className="bg-white rounded-3xl shadow-xl p-1 border border-gray-100">
            <Scanner />
          </div>

          {!session && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center space-y-2">
              <div className="flex justify-center text-blue-500 mb-1">
                <UserIcon size={32} />
              </div>
              <h3 className="font-bold text-gray-800">Guest Mode</h3>
              <p className="text-sm text-gray-600">
                You can scan items to try the AI, but they won&apos;t be saved.
                <Link href="/signup" className="text-blue-600 font-bold hover:underline mx-1">Sign up</Link>
                to save your inventory!
              </p>
            </div>
          )}

          {/* Inventory or Manual Entry Section */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                {session ? 'Your Inventory' : 'Try Manual Entry'}
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              </h2>
            </div>

            <div className="p-6 space-y-8">
              {session ? (
                <>
                  <ManualEntry />
                  <InventoryList items={items} />
                </>
              ) : (
                <ManualEntry /> // Guests can see the form but it will fail/warn on submit due to API check
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
