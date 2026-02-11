import React from "react";
import Layout from "@/components/layout/Layout";

export default function AdminDashboard() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="mt-4 text-muted-foreground">Welcome to the admin area.</p>
      </div>
    </Layout>
  );
}
