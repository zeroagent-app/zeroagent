import { useState, useEffect, useRef } from "react";
import { useLocation, useRoute } from "wouter";
import { useCreateVenue, useUpdateVenue, useGetVenue } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/auth";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, Upload, FileImage, Video, Loader2 } from "lucide-react";
import { Link } from "wouter";
import uploadBtn from "@assets/image_1775618956380.png";

const EVENT_TYPES = ["Wedding", "Mehndi", "Valima", "Engagement", "Birthday Party", "Corporate Event", "Conference", "Gala Dinner"];
const AREAS = [
  "Korangi No. 2½",
  "Korangi No. 4",
  "Korangi No. 5",
  "Korangi No. 6",
  "Sector 32",
  "Sector 33",
  "Sector 36",
  "Sector 37",
  "Sector 38",
  "Sector 39",
  "Sector 40",
  "Sector 41",
  "Sector 42",
  "Sector 43",
  "Sector 44",
  "Sector 45",
  "Sector 46",
  "Sector 47",
  "Sector 48",
  "Sector 49",
  "Sector 50",
  "Sector 51",
  "Landhi No. 01",
  "Landhi No. 02",
  "Landhi No. 03",
  "Landhi No. 04",
  "Landhi No. 05",
  "Landhi No. 06",
];

async function uploadFiles(files: File[]): Promise<string[]> {
  if (files.length === 0) return [];
  const form = new FormData();
  files.forEach(f => form.append("files", f));
  const res = await fetch("/api/upload", {
    method: "POST",
    credentials: "include",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(err.error ?? "Upload failed");
  }
  const data = await res.json();
  return data.urls as string[];
}

export default function VenueForm() {
  const [isEditRoute, editParams] = useRoute("/dashboard/venue/:id/edit");
  const editId = isEditRoute ? parseInt(editParams?.id ?? "0") : 0;
  const { data: existingVenue } = useGetVenue(editId, { query: { enabled: !!editId } });
  const existing = existingVenue as any;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("Karachi");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [capacity, setCapacity] = useState("");
  const [pricePerDay, setPricePerDay] = useState("");
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [existingVideos, setExistingVideos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const createVenue = useCreateVenue();
  const updateVenue = useUpdateVenue();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (existing) {
      setName(existing.name ?? "");
      setDescription(existing.description ?? "");
      setCity(existing.city ?? "Karachi");
      setArea(existing.area ?? "");
      setAddress(existing.address ?? "");
      setCapacity(String(existing.capacity ?? ""));
      setPricePerDay(String(existing.pricePerDay ?? ""));
      setSelectedEventTypes(existing.eventTypes ?? []);
      setExistingImages(existing.images ?? []);
      setExistingVideos(existing.videos ?? []);
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
    setUploading(true);

    let uploadedImageUrls: string[] = [];
    let uploadedVideoUrls: string[] = [];

    try {
      [uploadedImageUrls, uploadedVideoUrls] = await Promise.all([
        uploadFiles(imageFiles),
        uploadFiles(videoFiles),
      ]);
    } catch (err: any) {
      setError(err.message ?? "File upload failed.");
      setUploading(false);
      return;
    }

    const images = imageFiles.length > 0 ? uploadedImageUrls : existingImages;
    const videos = videoFiles.length > 0 ? uploadedVideoUrls : existingVideos;

    const payload = {
      name,
      description,
      city,
      area,
      address,
      capacity: parseInt(capacity),
      pricePerDay: parseFloat(pricePerDay),
      eventTypes: selectedEventTypes,
      images,
      videos,
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
    } finally {
      setUploading(false);
    }
  };

  const isBusy = uploading || createVenue.isPending || updateVenue.isPending;

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

        <div className="space-y-1.5">
          <Label>District / Area</Label>
          <select value={area} onChange={e => setArea(e.target.value)} required className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="">Select Korangi / Landhi area</option>
            {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <p className="text-xs text-muted-foreground">Listings are focused on Korangi district, Karachi.</p>
        </div>

        <div className="space-y-1.5">
          <Label>Media Uploads</Label>
          <div className="rounded-xl border border-dashed border-border p-4 space-y-4 bg-muted/30">
            <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => setImageFiles(Array.from(e.target.files ?? []))} />
            <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={e => setVideoFiles(Array.from(e.target.files ?? []))} />

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground flex items-center gap-2"><FileImage size={14} /> Images</Label>
              <Button type="button" variant="outline" className="w-full justify-start gap-2" onClick={() => imageInputRef.current?.click()}>
                <img src={uploadBtn} alt="" className="h-5 w-5 object-contain" />
                Choose images
              </Button>
              {imageFiles.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-xs text-green-700 font-medium">{imageFiles.length} image(s) ready to upload</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {imageFiles.map((f, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                        <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : existingImages.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{existingImages.length} existing image(s) — choose new files to replace them</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {existingImages.map((url, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                        <img src={url} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Upload multiple venue images at once.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground flex items-center gap-2"><Video size={14} /> Videos</Label>
              <Button type="button" variant="outline" className="w-full justify-start gap-2" onClick={() => videoInputRef.current?.click()}>
                <Upload size={14} /> Choose videos
              </Button>
              {videoFiles.length > 0 ? (
                <p className="text-xs text-green-700 font-medium">{videoFiles.length} video(s) ready to upload</p>
              ) : existingVideos.length > 0 ? (
                <p className="text-xs text-muted-foreground">{existingVideos.length} existing video(s) — choose new files to replace them</p>
              ) : (
                <p className="text-xs text-muted-foreground">Upload multiple venue videos at once.</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>City</Label>
            <Input value="Karachi" disabled className="bg-muted" />
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

        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-semibold" disabled={isBusy}>
          {isBusy ? (
            <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" />{uploading ? "Uploading files..." : "Saving..."}</span>
          ) : editId ? "Update Venue" : "Submit for Approval"}
        </Button>
        <p className="text-xs text-muted-foreground text-center">New venues are reviewed by admin before going live.</p>
      </form>
    </div>
  );
}
