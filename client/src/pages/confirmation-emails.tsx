import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Edit3, Send, SkipForward, Clock, CheckCircle, XCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface PendingConfirmationEmail {
  id: number;
  recipient_name: string;
  recipient_email: string;
  meeting_time: string;
  campaign_name: string;
  confirmation_email_status: 'pending' | 'sent' | 'skipped' | 'failed';
  confirmation_email_template?: string;
  event_id: string;
  merge_data: any;
  rsvp_status: string;
  accepted_at?: string;
}

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  isDefault: boolean;
}

export default function ConfirmationEmails() {
  const [selectedInvite, setSelectedInvite] = useState<PendingConfirmationEmail | null>(null);
  const [customTemplate, setCustomTemplate] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get pending confirmation emails
  const { data: pendingEmails = [], isLoading } = useQuery({
    queryKey: ['/api/confirmation-emails/pending'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Get default email templates
  const { data: templates = [] } = useQuery({
    queryKey: ['/api/confirmation-emails/templates']
  });

  // Send confirmation email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (data: { inviteId: number; customTemplate?: string; customSubject?: string }) => {
      return apiRequest(`/api/confirmation-emails/${data.inviteId}/send`, {
        method: 'POST',
        body: JSON.stringify({
          customTemplate: data.customTemplate,
          customSubject: data.customSubject
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Confirmation email sent successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/confirmation-emails/pending'] });
      setIsEditDialogOpen(false);
      setSelectedInvite(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Send Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mark as skipped mutation
  const skipEmailMutation = useMutation({
    mutationFn: async (inviteId: number) => {
      return apiRequest(`/api/confirmation-emails/${inviteId}/skip`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      toast({
        title: "Email Skipped",
        description: "Confirmation email marked as skipped",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/confirmation-emails/pending'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Skip Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'skipped': return <SkipForward className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "default",
      sent: "default",
      skipped: "secondary",
      failed: "destructive"
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status}
      </Badge>
    );
  };

  const renderEmailPreview = (invite: PendingConfirmationEmail) => {
    const defaultTemplate = templates.find((t: EmailTemplate) => t.isDefault);
    const template = invite.confirmation_email_template || defaultTemplate?.body || 
      `Dear {{name}},

Thank you for accepting our meeting invitation! 

Meeting Details:
- Date & Time: {{meeting_time}}
- Meeting Link: {{meeting_link}}

We look forward to speaking with you.

Best regards,
{{sender_name}}`;

    // Replace variables with actual data
    const processedTemplate = template
      .replace(/\{\{name\}\}/g, invite.recipient_name || invite.recipient_email)
      .replace(/\{\{meeting_time\}\}/g, invite.meeting_time ? format(new Date(invite.meeting_time), 'PPpp') : '[Meeting Time]')
      .replace(/\{\{meeting_link\}\}/g, invite.merge_data?.meetingLink || '[Meeting Link]')
      .replace(/\{\{sender_name\}\}/g, invite.merge_data?.senderName || '[Sender Name]')
      .replace(/\{\{company\}\}/g, invite.merge_data?.company || '[Company]');

    return processedTemplate;
  };

  const handleEditEmail = (invite: PendingConfirmationEmail) => {
    setSelectedInvite(invite);
    const defaultTemplate = templates.find((t: EmailTemplate) => t.isDefault);
    setCustomTemplate(invite.confirmation_email_template || defaultTemplate?.body || "");
    setCustomSubject(defaultTemplate?.subject || "Meeting Confirmation");
    setIsEditDialogOpen(true);
  };

  const handlePreviewEmail = (invite: PendingConfirmationEmail) => {
    setSelectedInvite(invite);
    setIsPreviewDialogOpen(true);
  };

  const handleSendEmail = (invite: PendingConfirmationEmail) => {
    sendEmailMutation.mutate({ 
      inviteId: invite.id,
      customTemplate: customTemplate || undefined,
      customSubject: customSubject || undefined
    });
  };

  const handleSkipEmail = (invite: PendingConfirmationEmail) => {
    skipEmailMutation.mutate(invite.id);
  };

  if (isLoading) {
    return <div className="p-8">Loading confirmation emails...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accepted Invites</h1>
          <p className="text-muted-foreground">
            Manage confirmation emails for accepted meeting invitations
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {pendingEmails.length} pending emails
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Accepted Invite Queue
          </CardTitle>
          <CardDescription>
            Review and send confirmation emails to prospects who have accepted meeting invitations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingEmails.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pending confirmation emails</p>
              <p className="text-sm">All accepted invites have been processed</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prospect</TableHead>
                  <TableHead>Meeting Time</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingEmails.map((invite: PendingConfirmationEmail) => (
                  <TableRow key={invite.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{invite.recipient_name}</span>
                        <span className="text-sm text-muted-foreground">{invite.recipient_email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{invite.meeting_time ? format(new Date(invite.meeting_time), 'PPP') : 'TBD'}</span>
                        <span className="text-sm text-muted-foreground">
                          {invite.meeting_time ? format(new Date(invite.meeting_time), 'p') : ''}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{invite.campaign_name}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(invite.confirmation_email_status)}
                        {getStatusBadge(invite.confirmation_email_status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreviewEmail(invite)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditEmail(invite)}
                          disabled={invite.confirmation_email_status === 'sent'}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSendEmail(invite)}
                          disabled={invite.confirmation_email_status === 'sent' || sendEmailMutation.isPending}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSkipEmail(invite)}
                          disabled={invite.confirmation_email_status === 'sent'}
                        >
                          <SkipForward className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Email Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Confirmation Email</DialogTitle>
            <DialogDescription>
              Customize the confirmation email for {selectedInvite?.recipient_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Email Subject</Label>
              <input
                id="subject"
                className="w-full px-3 py-2 border rounded-md"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Meeting Confirmation"
              />
            </div>
            <div>
              <Label htmlFor="template">Email Template</Label>
              <Textarea
                id="template"
                className="min-h-[200px]"
                value={customTemplate}
                onChange={(e) => setCustomTemplate(e.target.value)}
                placeholder="Dear {{name}}, Thank you for accepting our meeting..."
              />
              <p className="text-sm text-muted-foreground mt-2">
                Available variables: name, meeting_time, meeting_link, sender_name, company
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleSendEmail(selectedInvite!)}
              disabled={sendEmailMutation.isPending}
            >
              {sendEmailMutation.isPending ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Email Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Preview of confirmation email for {selectedInvite?.recipient_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-sm text-muted-foreground mb-2">
                <strong>To:</strong> {selectedInvite?.recipient_email}
              </div>
              <div className="text-sm text-muted-foreground mb-4">
                <strong>Subject:</strong> Meeting Confirmation
              </div>
              <div className="whitespace-pre-wrap">
                {selectedInvite ? renderEmailPreview(selectedInvite) : ''}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}