import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SubjectLinePreviewProps {
  subjectLine: string;
  sampleData?: {
    name?: string;
    company?: string;
    email?: string;
    sender_name?: string;
  };
}

export function SubjectLinePreview({ subjectLine, sampleData }: SubjectLinePreviewProps) {
  const [preview, setPreview] = useState("");
  const [usedVariables, setUsedVariables] = useState<string[]>([]);

  const defaultSampleData = {
    name: "John Smith",
    company: "Acme Corp",
    email: "john@acme.com",
    sender_name: "Your Team"
  };

  const sampleValues = { ...defaultSampleData, ...sampleData };

  useEffect(() => {
    const supportedVariables = ["name", "company", "email", "sender_name"];
    const foundVariables: string[] = [];
    
    let processedSubject = subjectLine || "Hi from {{sender_name}}";
    
    supportedVariables.forEach(variable => {
      const regex = new RegExp(`{{${variable}}}`, 'g');
      if (regex.test(processedSubject)) {
        foundVariables.push(variable);
        processedSubject = processedSubject.replace(regex, sampleValues[variable] || `{{${variable}}}`);
      }
    });

    setPreview(processedSubject);
    setUsedVariables(foundVariables);
  }, [subjectLine, sampleData]);

  if (!subjectLine) {
    return null;
  }

  return (
    <Card className="mt-2">
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Preview:
          </div>
          <div className="text-sm font-medium bg-gray-50 dark:bg-gray-800 p-2 rounded border">
            {preview}
          </div>
          {usedVariables.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs text-gray-500">Variables used:</span>
              {usedVariables.map(variable => (
                <Badge key={variable} variant="secondary" className="text-xs">
                  {variable}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}