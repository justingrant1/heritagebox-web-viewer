"use client";

import { useState } from "react";
import Link from "next/link";
import SetPasswordPrompt from "./set-password";

interface Order {
  id: string;
  number: string;
  status: string;
  digitization_completed_at: string | null;
}

interface Props {
  customerName: string;
  orders: Order[];
  needsPassword: boolean;
}

export default function GalleryClient({ customerName, orders, needsPassword }: Props) {
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(needsPassword);

  return (
    <div className="min-h-screen">
      {showPasswordPrompt && (
        <SetPasswordPrompt onComplete={() => setShowPasswordPrompt(false)} />
      )}

      <nav className="border-b border-stone-800 px-4 h-14 flex items-center justify-between">
        <span className="text-xl font-bold">HeritageBox</span>
        <span className="text-stone-400 text-sm">{customerName}</span>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-1">Your Orders</h1>
        <p className="text-stone-500 text-sm mb-8">{orders.length} order{orders.length !== 1 ? "s" : ""}</p>

        {orders.length === 0 ? (
          <div className="text-center py-16 text-stone-500">
            <p className="text-lg">No orders found.</p>
            <p className="text-sm mt-2">Your digitized media will appear here once ready.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/gallery/${order.id}`}
                className="block bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-stone-600 rounded-xl px-5 py-4 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{order.number}</p>
                    <p className="text-stone-500 text-sm capitalize mt-0.5">{order.status.replace(/_/g, " ")}</p>
                  </div>
                  <div className="text-stone-600 text-xl">›</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
