"use client";

import CustomerSupport from "@/components/chatbot";
import { useAuth } from "@/lib/auth-context";

export default function CustomerSupportMount() {
  const { customer, loading } = useAuth();

  // Don't render before auth finishes → no "Please log in" flash
  if (loading) return null;

  return <CustomerSupport userId={customer?.id} loginHref="/login" />;
}