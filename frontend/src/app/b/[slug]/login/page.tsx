"use client";

import React from "react";
import LoginPage from "@/app/login/page";

export default function ScopedLoginPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  return <LoginPage />;
}
