import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetVenue, useCreateBooking } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/auth";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, DollarSign, ChevronLeft, CalendarDays } from "lucide-react";
import { Link } from "wouter";

const EVENT_TYPES = ["Wedding", "Mehndi", "Valima", "Engagement", "Birthday Party", "Corporate Event", "Conference", "Gala Dinner"];

export default function VenueDetail() {
  const [, params] = useRoute("/venues/:id");
  const id = parseInt(params?.id ?? "0");
  const { data, isLoading } = useGetVenue(id, { query: { enabled: !!id } });
  const venue = data as any;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const createBooking = useCreateBooking();

  const [selectedImage, setSelectedImage] = useState(0);
  const [eventDate, setEventDate] = useState("");
  const [eventType, setEventType] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [notes, setNotes] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate("/login"); return; }
    if (user.role !== "user") { setBookingError("Only regular users can make booking requests."); return; }
    setBookingError("");
    try {
      await createBooking.mutateAsync({ data: { venueId: id, eventDate, eventType, guestCount: parseInt(guestCount), notes: notes || undefined } });
      queryClient.invalidateQueries();
      setBookingSuccess(true);
    } catch (err: any) {
      setBookingError(err?.response?.data?.error ?? "Booking failed. Please try again.");
    }
  };

  if (isLoading) return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-64" />
        <div className="h-96 bg-muted rounded-xl" />
      </div>
    </div>
  );

  if (!venue) return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <p className="text-muted-foreground">Venue not found.</p>
      <Link href="/venues"><Button className="mt-4">Browse Venues</Button></Link>
    </div>
  );

  const images = venue.images?.length ? venue.images : ["https://images.unsplash.com/photo-1519167758452-f4d76ab8d6f8?w=800"];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/venues" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ChevronLeft size={16} /> Back to venues
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left: Details */}
        <div className="lg:col-span-2">
          {/* Image gallery */}
          <div className="mb-6">
            <div className="rounded-xl overflow-hidden h-80 mb-3">
              <img src={images[selectedImage]} alt={venue.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1519167758452-f4d76ab8d6f8?w=800"; }} />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((img: string, i: number) => (
                  <button key={i} onClick={() => setSelectedImage(i)} className={`h-16 w-24 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === i ? "border-primary" : "border-transparent"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            {venue.eventTypes?.map((t: string) => (
              <Badge key={t} variant="secondary" className="bg-primary/10 text-primary border-none">{t}</Badge>
            ))}
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-2">{venue.name}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1"><MapPin size={14} className="text-primary" />{venue.city}, {venue.address}</span>
            <span className="flex items-center gap-1"><Users size={14} className="text-primary" />Capacity: up to {venue.capacity?.toLocaleString()}</span>
          </div>

          <p className="text-foreground/80 leading-relaxed mb-6">{venue.description}</p>

          <div className="bg-muted/50 rounded-xl p-5 border border-border">
            <h3 className="font-semibold mb-3">Pricing</h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">PKR {Number(venue.pricePerDay)?.toLocaleString()}</span>
              <span className="text-muted-foreground text-sm">/ day</span>
            </div>
          </div>
        </div>

        {/* Right: Booking form */}
        <div>
          <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm sticky top-20">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><CalendarDays size={18} className="text-primary" />Request a Booking</h2>
            {bookingSuccess ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 text-xl">✓</span>
                </div>
                <p className="font-semibold text-foreground mb-1">Booking Request Sent!</p>
                <p className="text-sm text-muted-foreground mb-4">The owner will review your request. You'll be able to chat once approved.</p>
                <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>View in Dashboard</Button>
              </div>
            ) : (
              <form onSubmit={handleBook} className="space-y-4">
                {bookingError && (
                  <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg px-3 py-2">{bookingError}</div>
                )}
                <div className="space-y-1.5">
                  <Label>Event Date</Label>
                  <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} required min={new Date().toISOString().split("T")[0]} />
                </div>
                <div className="space-y-1.5">
                  <Label>Event Type</Label>
                  <Select value={eventType} onValueChange={setEventType} required>
                    <SelectTrigger><SelectValue placeholder="Select event type" /></SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Number of Guests</Label>
                  <Input type="number" placeholder="e.g. 300" value={guestCount} onChange={e => setGuestCount(e.target.value)} required min={1} max={venue.capacity} />
                  <p className="text-xs text-muted-foreground">Max capacity: {venue.capacity?.toLocaleString()}</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Additional Notes (optional)</Label>
                  <Textarea placeholder="Any special requirements..." value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
                </div>
                {!user ? (
                  <Button type="button" className="w-full bg-primary text-white" onClick={() => navigate("/login")}>Login to Book</Button>
                ) : (
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-semibold" disabled={createBooking.isPending || !eventType}>
                    {createBooking.isPending ? "Sending..." : "Send Booking Request"}
                  </Button>
                )}
                <p className="text-xs text-muted-foreground text-center">Owner will approve or reject your request. Chat unlocks after approval.</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
