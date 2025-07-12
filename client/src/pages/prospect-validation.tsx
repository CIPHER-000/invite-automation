import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Download, FileText, Loader2, CheckCircle, XCircle, AlertCircle, Eye, Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ProspectBatch {
  id: number;
  fileName: string;
  targetIndustry: string;
  totalRecords: number;
  processedRecords: number;
  confirmedRecords: number;
  rejectedRecords: number;
  greyAreaRecords: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: string;
}

interface Prospect {
  id: number;
  originalCompanyName: string;
  websiteDomain?: string;
  companyDescription?: string;
  industryMatch?: 'confirmed' | 'rejected' | 'grey_area';
  confidence?: number;
  competitors?: string[];
  manualStatus?: string;
  manualCompetitors?: string[];
  notes?: string;
  manualOverride: boolean;
  scrapingStatus?: string;
  classificationStatus?: string;
}

interface BatchWithProspects {
  batch: ProspectBatch;
  prospects: Prospect[];
}

export default function DataEnrichment() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetIndustry, setTargetIndustry] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<number | null>(null);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [uploadProgress, setUploadProgress] = useState<any>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all batches
  const { data: batches = [], isLoading: batchesLoading } = useQuery({
    queryKey: ['/api/prospect-validation/batches'],
    refetchInterval: 5000 // Refresh every 5 seconds for processing updates
  });

  // Get prospects for selected batch
  const { data: batchData, isLoading: batchDataLoading } = useQuery({
    queryKey: ['/api/prospect-validation/batches', selectedBatch, 'prospects'],
    enabled: !!selectedBatch,
    refetchInterval: selectedBatch && batches.find((b: ProspectBatch) => b.id === selectedBatch)?.status === 'processing' ? 3000 : false
  });

  // Upload file mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, industry }: { file: File; industry: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetIndustry', industry);
      
      const response = await fetch('/api/prospect-validation/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: `Processing started for ${data.totalRecords} prospects`,
      });
      setSelectedFile(null);
      setTargetIndustry("");
      setUploadProgress(data);
      queryClient.invalidateQueries({ queryKey: ['/api/prospect-validation/batches'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update prospect mutation
  const updateProspectMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Prospect> }) => {
      return apiRequest(`/api/prospect-validation/prospects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      toast({
        title: "Prospect Updated",
        description: "Changes saved successfully",
      });
      setEditingProspect(null);
      queryClient.invalidateQueries({ queryKey: ['/api/prospect-validation/batches', selectedBatch, 'prospects'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete batch mutation
  const deleteBatchMutation = useMutation({
    mutationFn: async (batchId: number) => {
      return apiRequest(`/api/prospect-validation/batches/${batchId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "Batch Deleted",
        description: "Batch and all associated data removed",
      });
      setSelectedBatch(null);
      queryClient.invalidateQueries({ queryKey: ['/api/prospect-validation/batches'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !targetIndustry.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a file and enter target industry",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({ file: selectedFile, industry: targetIndustry.trim() });
  };

  const handleExport = async (batchId: number) => {
    try {
      const response = await fetch(`/api/prospect-validation/batches/${batchId}/export`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prospect-validation-${batchId}-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "Results downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to download results",
        variant: "destructive",
      });
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/prospect-validation/sample-template');
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'prospect-upload-template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download template",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getMatchBadge = (match: string, confidence?: number) => {
    const variants = {
      confirmed: "default",
      rejected: "destructive",
      grey_area: "secondary"
    } as const;
    
    return (
      <Badge variant={variants[match as keyof typeof variants] || "outline"}>
        {match.replace('_', ' ')} {confidence ? `(${confidence}%)` : ''}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Enrichment</h1>
          <p className="text-muted-foreground">
            Upload prospect lists for AI-powered industry enrichment and competitor discovery
          </p>
        </div>
        <Button onClick={downloadTemplate} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Download Template
        </Button>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upload">Upload & Process</TabsTrigger>
          <TabsTrigger value="batches">Processing History</TabsTrigger>
          <TabsTrigger value="results">Results & Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Prospect List</CardTitle>
              <CardDescription>
                Upload a CSV or Excel file with company names and optional website domains
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="targetIndustry">Target Industry</Label>
                <Input
                  id="targetIndustry"
                  placeholder="e.g., SaaS, Healthcare Technology, E-commerce"
                  value={targetIndustry}
                  onChange={(e) => setTargetIndustry(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Specify the industry you want to validate prospects against
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Prospect File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                />
                <p className="text-sm text-muted-foreground">
                  Supported formats: CSV, Excel (.xlsx, .xls). Max file size: 10MB
                </p>
              </div>

              {selectedFile && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">{selectedFile.name}</span>
                    <Badge variant="outline">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</Badge>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleUpload}
                disabled={!selectedFile || !targetIndustry.trim() || uploadMutation.isPending}
                className="w-full"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload & Start Processing
                  </>
                )}
              </Button>

              {uploadProgress && (
                <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                    Processing Started
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Batch ID: {uploadProgress.batchId} | Records: {uploadProgress.totalRecords}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batches" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Processing Batches</CardTitle>
              <CardDescription>
                Track the progress of your prospect validation batches
              </CardDescription>
            </CardHeader>
            <CardContent>
              {batchesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : batches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No batches found. Upload your first prospect list to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {batches.map((batch: ProspectBatch) => (
                    <div key={batch.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(batch.status)}
                            <h3 className="font-medium">{batch.fileName}</h3>
                            <Badge variant="outline">{batch.targetIndustry}</Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Total:</span> {batch.totalRecords}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Processed:</span> {batch.processedRecords}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Confirmed:</span> {batch.confirmedRecords}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Rejected:</span> {batch.rejectedRecords}
                            </div>
                          </div>

                          {batch.status === 'processing' && (
                            <Progress 
                              value={(batch.processedRecords / batch.totalRecords) * 100} 
                              className="w-full"
                            />
                          )}

                          {batch.error && (
                            <div className="text-sm text-red-600 dark:text-red-400">
                              Error: {batch.error}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedBatch(batch.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          
                          {batch.status === 'completed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExport(batch.id)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Export
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteBatchMutation.mutate(batch.id)}
                            disabled={deleteBatchMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {selectedBatch ? (
            <Card>
              <CardHeader>
                <CardTitle>Validation Results</CardTitle>
                <CardDescription>
                  Review and edit the AI classification results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {batchDataLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : batchData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-green-600">{batchData.batch.confirmedRecords}</div>
                          <div className="text-sm text-muted-foreground">Confirmed Matches</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-red-600">{batchData.batch.rejectedRecords}</div>
                          <div className="text-sm text-muted-foreground">Rejected</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-yellow-600">{batchData.batch.greyAreaRecords}</div>
                          <div className="text-sm text-muted-foreground">Grey Area</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{batchData.batch.processedRecords}</div>
                          <div className="text-sm text-muted-foreground">Total Processed</div>
                        </CardContent>
                      </Card>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Company</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Competitors</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {batchData.prospects.map((prospect: Prospect) => (
                          <TableRow key={prospect.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{prospect.originalCompanyName}</div>
                                {prospect.websiteDomain && (
                                  <div className="text-sm text-muted-foreground">{prospect.websiteDomain}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {prospect.manualOverride && prospect.manualStatus ? 
                                getMatchBadge(prospect.manualStatus) :
                                prospect.industryMatch ? getMatchBadge(prospect.industryMatch, prospect.confidence) :
                                <Badge variant="outline">Pending</Badge>
                              }
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs">
                                {(prospect.manualCompetitors || prospect.competitors || []).slice(0, 2).map((comp: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="mr-1 mb-1">
                                    {comp}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs truncate">
                                {prospect.notes || '-'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingProspect(prospect)}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Select a batch from the Processing History tab to view results
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Prospect Dialog */}
      <Dialog open={!!editingProspect} onOpenChange={() => setEditingProspect(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Prospect Classification</DialogTitle>
            <DialogDescription>
              Override AI classification and add manual notes
            </DialogDescription>
          </DialogHeader>
          
          {editingProspect && (
            <div className="space-y-4">
              <div>
                <Label>Company</Label>
                <div className="font-medium">{editingProspect.originalCompanyName}</div>
                {editingProspect.websiteDomain && (
                  <div className="text-sm text-muted-foreground">{editingProspect.websiteDomain}</div>
                )}
              </div>

              <div>
                <Label htmlFor="manualStatus">Manual Classification</Label>
                <Select
                  value={editingProspect.manualStatus || editingProspect.industryMatch || ""}
                  onValueChange={(value) => setEditingProspect({ ...editingProspect, manualStatus: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select classification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">Confirmed Match</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="grey_area">Grey Area</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="competitors">Competitors (comma-separated)</Label>
                <Input
                  id="competitors"
                  value={(editingProspect.manualCompetitors || editingProspect.competitors || []).join(', ')}
                  onChange={(e) => setEditingProspect({ 
                    ...editingProspect, 
                    manualCompetitors: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  placeholder="Company A, Company B, Company C"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={editingProspect.notes || ""}
                  onChange={(e) => setEditingProspect({ ...editingProspect, notes: e.target.value })}
                  placeholder="Add any additional notes or reasoning..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProspect(null)}>
              Cancel
            </Button>
            <Button 
              onClick={() => editingProspect && updateProspectMutation.mutate({
                id: editingProspect.id,
                updates: {
                  manualStatus: editingProspect.manualStatus,
                  manualCompetitors: editingProspect.manualCompetitors,
                  notes: editingProspect.notes
                }
              })}
              disabled={updateProspectMutation.isPending}
            >
              {updateProspectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}