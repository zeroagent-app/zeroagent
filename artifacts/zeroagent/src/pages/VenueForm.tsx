import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useCreateVenue, useUpdateVenue, useGetVenue } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/auth";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";

const EVENT_TYPES = ["Wedding", "Mehndi", "Valima", "Engagement", "Birthday Party", "Corporate Event", "Conference", "Gala Dinner"];
const CITIES = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta"];

export default function VenueForm() {
  const [isEditRoute, editParams] = useRoute("/dashboard/venue/:id/edit");
  const editId = isEditRoute ? parseInt(editParams?.id ?? "0") : 0;
  const { data: existingVenue } = useGetVenue(editId, { query: { enabled: !!editId } });
  const existing = existingVenue as any;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [capacity, setCapacity] = useState("");
  const [pricePerDay, setPricePerDay] = useState("");
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const createVenue = useCreateVenue();
  const updateVenue = useUpdateVenue();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (existing) {
      setName(existing.name ?? "");
      setDescription(existing.description ?? "");
      setCity(existing.city ?? "");
      setAddress(existing.address ?? "");
      setCapacity(String(existing.capacity ?? ""));
      setPricePerDay(String(existing.pricePerDay ?? ""));
      setSelectedEventTypes(existing.eventTypes ?? []);
      setImageUrls((existing.images ?? []).join("\n"));
    }
  }, [existing]);

  if (!user || user.role !== "owner") {
    return <div className="max-w-2xl mx-auto px-4 py-16 text-center text-muted-foreground">Access restricted to venue owners.</div>;
  }

  const toggleEventType = (type: string) => {
    setSelectedEventTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const images = imageUrls.split("\n").map(s => s.trim()).filter(Boolean);
    const payload = {
      name, description, city, address,
      capacity: parseInt(capacity),
      pricePerDay: parseFloat(pricePerDay),
      eventTypes: selectedEventTypes,
      images,
    };
    try {
      if (editId) {
        await updateVenue.mutateAsync({ id: editId, data: payload });
      } else {
        await createVenue.mutateAsync({ data: payload });
      }
      queryClient.invalidateQueries();
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Failed to save venue.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/dashboard" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ChevronLeft size={16} /> Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-8">{editId ? "Edit Venue" : "Add New Venue"}</h1>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-6">
          Venue {editId ? "updated" : "created"} successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg px-4 py-3">{error}</div>
        )}

        <div className="space-y-1.5">
          <Label>Venue Name</Label>
          <Input placeholder="e.g. Pearl Continental Banquet Hall" value={name} onChange={e => setName(e.target.value)} required />
        </div>

        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea placeholder="Describe your venue..." value={description} onChange={e => setDescription(e.target.value)} required rows={4} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>City</Label>
            <select value={city} onChange={e => setCity(e.target.value)} required className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="">Select city</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input placeholder="Street address" value={address} onChange={e => setAddress(e.target.value)} required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Capacity (guests)</Label>
            <Input type="number" placeholder="e.g. 500" value={capacity} onChange={e => setCapacity(e.target.value)} required min={1} />
          </div>
          <div className="space-y-1.5">
            <Label>Price Per Day (PKR)</Label>
            <Input type="number" placeholder="e.g. 250000" value={pricePerDay} onChange={e => setPricePerDay(e.target.value)} required min={0} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Event Types Supported</Label>
          <div className="grid grid-cols-2 gap-2">
            {EVENT_TYPES.map(type => (
              <div key={type} className="flex items-center gap-2">
                <Checkbox id={type} checked={selectedEventTypes.includes(type)} onCheckedChange={() => toggleEventType(type)} />
                <label htmlFor={type} className="text-sm cursor-pointer">{type}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Image URLs (one per line)</Label>
          <Textarea placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg" value={imageUrls} onChange={e => setImageUrls(e.target.value)} rows={4} />
          <p className="text-xs text-muted-foreground">Paste full image URLs, one per line</p>
        </div>

        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-semibold" disabled={createVenue.isPending || updateVenue.isPending}>
          {createVenue.isPending || updateVenue.isPending ? "Saving..." : editId ? "Update Venue" : "Submit for Approval"}
        </Button>
        <p className="text-xs text-muted-foreground text-center">New venues are reviewed by admin before going live.</p>
      </form>
    </div>
  );
}
