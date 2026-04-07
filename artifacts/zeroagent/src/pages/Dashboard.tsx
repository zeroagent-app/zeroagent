import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/auth";
import { useListBookings, useGetMyVenues, useDeleteVenue, useCancelBooking, useApproveBooking, useRejectBooking, useAdminListUsers, useAdminListVenues, useAdminListBookings, useAdminGetStats, useAdminApproveVenue, useAdminRejectVenue, useUpdatePaymentStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Users, Plus, MessageSquare, Check, X, DollarSign, LogIn, Calendar } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-600",
    paid: "bg-green-100 text-green-800",
    unpaid: "bg-orange-100 text-orange-800",
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] ?? "bg-gray-100 text-gray-600"}`}>{status}</span>;
}

function UserDashboard() {
  const { data } = useListBookings({}, { query: {} });
  const bookings = (data as any[]) ?? [];
  const cancelBooking = useCancelBooking();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">My Booking Requests</h2>
      {bookings.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-medium">No bookings yet</p>
          <p className="text-sm mt-1">Browse venues and send a booking request to get started</p>
          <Link href="/venues"><Button className="mt-4 bg-primary text-white">Browse Venues</Button></Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b: any) => (
            <div key={b.id} className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-foreground">{b.venueName}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{b.eventType} · {b.guestCount} guests · {b.eventDate}</p>
                  {b.rejectionReason && <p className="text-sm text-destructive mt-1">Reason: {b.rejectionReason}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={b.status} />
                  <StatusBadge status={b.paymentStatus} />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                {b.status === "approved" && (
                  <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/chat/${b.id}`)} className="text-primary border-primary/30 hover:bg-primary/5">
                    <MessageSquare size={14} className="mr-1" /> Open Chat
                  </Button>
                )}
                {b.status === "pending" && (
                  <Button size="sm" variant="outline" onClick={async () => { await cancelBooking.mutateAsync({ id: b.id }); queryClient.invalidateQueries(); }} className="text-destructive border-destructive/30 hover:bg-destructive/5">
                    Cancel Request
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OwnerDashboard() {
  const { data: venues } = useGetMyVenues();
  const { data: bookings } = useListBookings({}, { query: {} });
  const approveBooking = useApproveBooking();
  const rejectBooking = useRejectBooking();
  const deleteVenue = useDeleteVenue();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const myVenues = (venues as any[]) ?? [];
  const myBookings = (bookings as any[]) ?? [];

  return (
    <Tabs defaultValue="venues">
      <TabsList className="mb-6">
        <TabsTrigger value="venues">My Venues</TabsTrigger>
        <TabsTrigger value="bookings">Booking Requests</TabsTrigger>
      </TabsList>

      <TabsContent value="venues">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">My Venue Listings</h2>
          <Link href="/dashboard/venue/new">
            <Button size="sm" className="bg-primary text-white"><Plus size={14} className="mr-1" /> Add Venue</Button>
          </Link>
        </div>
        {myVenues.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No venues listed yet.</p>
            <Link href="/dashboard/venue/new"><Button className="mt-4 bg-primary text-white"><Plus size={14} className="mr-1" /> Add Your First Venue</Button></Link>
          </div>
        ) : (
          <div className="space-y-4">
            {myVenues.map((v: any) => (
              <div key={v.id} className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    {v.images?.[0] && <img src={v.images[0]} className="w-16 h-16 rounded-lg object-cover" alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                    <div>
                      <h3 className="font-semibold">{v.name}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1"><MapPin size={12} className="text-primary" />{v.city}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1"><Users size={12} className="text-primary" />Capacity: {v.capacity?.toLocaleString()}</p>
                    </div>
                  </div>
                  <StatusBadge status={v.status} />
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/venue/${v.id}/edit`)}>Edit</Button>
                  <Button size="sm" variant="outline" onClick={async () => { if (confirm("Delete this venue?")) { await deleteVenue.mutateAsync({ id: v.id }); queryClient.invalidateQueries(); } }} className="text-destructive border-destructive/30">Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="bookings">
        <h2 className="text-lg font-bold mb-4">Incoming Booking Requests</h2>
        {myBookings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No booking requests yet.</div>
        ) : (
          <div className="space-y-4">
            {myBookings.map((b: any) => (
              <div key={b.id} className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{b.venueName}</h3>
                    <p className="text-sm text-muted-foreground mt-1">By {b.userName} · {b.eventType} · {b.guestCount} guests</p>
                    <p className="text-sm text-muted-foreground">{b.eventDate}</p>
                    {b.notes && <p className="text-sm text-muted-foreground italic mt-1">"{b.notes}"</p>}
                  </div>
                  <StatusBadge status={b.status} />
                </div>
                {b.status === "pending" && (
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={async () => { await approveBooking.mutateAsync({ id: b.id }); queryClient.invalidateQueries(); }}>
                      <Check size={14} className="mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={async () => { await rejectBooking.mutateAsync({ id: b.id, data: { reason: "Not available on this date." } }); queryClient.invalidateQueries(); }}>
                      <X size={14} className="mr-1" /> Reject
                    </Button>
                  </div>
                )}
                {b.status === "approved" && (
                  <Button size="sm" variant="outline" className="mt-4 text-primary border-primary/30" onClick={() => navigate(`/dashboard/chat/${b.id}`)}>
                    <MessageSquare size={14} className="mr-1" /> Open Chat
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

function AdminDashboard() {
  const { data: stats } = useAdminGetStats();
  const { data: users } = useAdminListUsers();
  const { data: venues } = useAdminListVenues();
  const { data: bookings } = useAdminListBookings();
  const approveVenue = useAdminApproveVenue();
  const rejectVenue = useAdminRejectVenue();
  const updatePayment = useUpdatePaymentStatus();
  const queryClient = useQueryClient();
  const s = stats as any;
  const allUsers = (users as any[]) ?? [];
  const allVenues = (venues as any[]) ?? [];
  const allBookings = (bookings as any[]) ?? [];

  return (
    <Tabs defaultValue="overview">
      <TabsList className="mb-6 flex-wrap">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="venues">Venues</TabsTrigger>
        <TabsTrigger value="bookings">Bookings</TabsTrigger>
        <TabsTrigger value="users">Users</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        {s && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Users", value: s.totalUsers, color: "text-blue-600" },
              { label: "Venue Owners", value: s.totalOwners, color: "text-purple-600" },
              { label: "Total Venues", value: s.totalVenues, color: "text-primary" },
              { label: "Pending Venues", value: s.pendingVenues, color: "text-yellow-600" },
              { label: "Total Bookings", value: s.totalBookings, color: "text-primary" },
              { label: "Pending Bookings", value: s.pendingBookings, color: "text-yellow-600" },
              { label: "Paid Bookings", value: s.paidBookings, color: "text-green-600" },
              { label: "Unpaid Bookings", value: s.unpaidBookings, color: "text-red-600" },
            ].map(stat => (
              <div key={stat.label} className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
                <div className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value ?? 0}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="venues">
        <h2 className="text-lg font-bold mb-4">All Venue Listings</h2>
        <div className="space-y-3">
          {allVenues.map((v: any) => (
            <div key={v.id} className="bg-card border border-card-border rounded-xl p-4 shadow-sm flex items-center justify-between gap-4">
              <div>
                <h3 className="font-medium">{v.name}</h3>
                <p className="text-sm text-muted-foreground">{v.city} · Owner: {v.ownerName} · {v.capacity?.toLocaleString()} guests</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <StatusBadge status={v.status} />
                {v.status === "pending" && (
                  <>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={async () => { await approveVenue.mutateAsync({ id: v.id }); queryClient.invalidateQueries(); }}>Approve</Button>
                    <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={async () => { await rejectVenue.mutateAsync({ id: v.id }); queryClient.invalidateQueries(); }}>Reject</Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="bookings">
        <h2 className="text-lg font-bold mb-4">All Bookings</h2>
        <div className="space-y-3">
          {allBookings.map((b: any) => (
            <div key={b.id} className="bg-card border border-card-border rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium">{b.venueName}</h3>
                  <p className="text-sm text-muted-foreground">By {b.userName} · {b.eventType} · {b.guestCount} guests · {b.eventDate}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                  <StatusBadge status={b.status} />
                  <StatusBadge status={b.paymentStatus} />
                  <Button size="sm" variant="outline" className="text-xs" onClick={async () => {
                    const newStatus = b.paymentStatus === "paid" ? "unpaid" : "paid";
                    await updatePayment.mutateAsync({ id: b.id, data: { paymentStatus: newStatus } });
                    queryClient.invalidateQueries();
                  }}>
                    <DollarSign size={12} className="mr-1" />Toggle Payment
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="users">
        <h2 className="text-lg font-bold mb-4">All Users</h2>
        <div className="space-y-2">
          {allUsers.map((u: any) => (
            <div key={u.id} className="bg-card border border-card-border rounded-xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="font-medium">{u.name}</p>
                <p className="text-sm text-muted-foreground">{u.email}</p>
              </div>
              <Badge variant="outline" className={u.role === "admin" ? "border-red-300 text-red-700" : u.role === "owner" ? "border-purple-300 text-purple-700" : "border-blue-300 text-blue-700"}>
                {u.role}
              </Badge>
            </div>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  if (isLoading) return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    </div>
  );

  if (!user) return (
    <div className="max-w-5xl mx-auto px-4 py-16 text-center">
      <LogIn size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
      <h2 className="text-xl font-bold mb-2">Sign in to access your dashboard</h2>
      <Button className="mt-4 bg-primary text-white" onClick={() => navigate("/login")}>Login</Button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Welcome back, {user.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {user.role === "admin" ? "Admin Panel" : user.role === "owner" ? "Owner Dashboard" : "My Bookings"}
        </p>
      </div>
      {user.role === "admin" && <AdminDashboard />}
      {user.role === "owner" && <OwnerDashboard />}
      {user.role === "user" && <UserDashboard />}
    </div>
  );
}
