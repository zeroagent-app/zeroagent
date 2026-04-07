import { useState, useRef, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useGetBooking, useGetChatMessages, useSendChatMessage, getGetChatMessagesQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/auth";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Send, Lock } from "lucide-react";

export default function Chat() {
  const [, params] = useRoute("/dashboard/chat/:bookingId");
  const bookingId = parseInt(params?.bookingId ?? "0");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: bookingData } = useGetBooking(bookingId, { query: { enabled: !!bookingId } });
  const booking = bookingData as any;
  const { data: messagesData, refetch } = useGetChatMessages(bookingId, { query: { enabled: !!bookingId && booking?.status === "approved" } });
  const messages = (messagesData as any[]) ?? [];
  const sendMessage = useSendChatMessage();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!bookingId || booking?.status !== "approved") return;
    const interval = setInterval(() => refetch(), 5000);
    return () => clearInterval(interval);
  }, [bookingId, booking?.status, refetch]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    await sendMessage.mutateAsync({ bookingId, data: { message: message.trim() } });
    setMessage("");
    queryClient.invalidateQueries({ queryKey: getGetChatMessagesQueryKey(bookingId) });
  };

  if (!booking) return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center text-muted-foreground">
      <div className="animate-pulse h-64 bg-muted rounded-xl" />
    </div>
  );

  if (booking.status !== "approved") return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <Lock size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
      <h2 className="text-lg font-bold mb-2">Chat Locked</h2>
      <p className="text-muted-foreground text-sm">Chat is only available for approved bookings.</p>
      <Link href="/dashboard"><Button className="mt-4" variant="outline">Back to Dashboard</Button></Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/dashboard" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
        <ChevronLeft size={16} /> Back to Dashboard
      </Link>
      <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden flex flex-col" style={{ height: "calc(100vh - 220px)", minHeight: "480px" }}>
        {/* Header */}
        <div className="p-4 border-b border-border bg-muted/30">
          <h2 className="font-bold">{booking.venueName}</h2>
          <p className="text-xs text-muted-foreground">{booking.eventType} · {booking.eventDate} · {booking.guestCount} guests</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">No messages yet. Start the conversation!</div>
          )}
          {messages.map((msg: any) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMe ? "bg-primary text-white rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"}`}>
                  {!isMe && <p className="text-xs font-medium mb-1 opacity-70">{msg.senderName} ({msg.senderRole})</p>}
                  <p className="text-sm leading-relaxed">{msg.message}</p>
                  <p className={`text-xs mt-1 ${isMe ? "text-white/60" : "text-muted-foreground"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-border flex gap-2">
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" className="bg-primary text-white" disabled={sendMessage.isPending || !message.trim()}>
            <Send size={16} />
          </Button>
        </form>
      </div>
    </div>
  );
}
