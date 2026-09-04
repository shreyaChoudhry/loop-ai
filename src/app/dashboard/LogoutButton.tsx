"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="mt-6 bg-black text-white px-6 py-3 rounded-lg"
    >
      Logout
    </button>
  );
}