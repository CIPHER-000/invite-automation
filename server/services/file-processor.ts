import * as XLSX from 'xlsx';
import { prospectProcessor } from './prospect-processor';
import { storage } from '../storage';

interface UploadResult {
  success: boolean;
  batchId?: number;
  totalRecords?: number;
  error?: string;
  preview?: Array<{ originalCompanyName: string; websiteDomain?: string }>;
}

interface ParsedRow {
  originalCompanyName: string;
  websiteDomain?: string;
}

export class FileProcessor {
  private static instance: FileProcessor;

  static getInstance(): FileProcessor {
    if (!FileProcessor.instance) {
      FileProcessor.instance = new FileProcessor();
    }
    return FileProcessor.instance;
  }

  /**
   * Process uploaded CSV or Excel file
   */
  async processFile(
    fileBuffer: Buffer,
    fileName: string,
    userId: string,
    targetIndustry: string,
    mimeType: string
  ): Promise<UploadResult> {
    try {
      // Parse file based on type
      const prospects = await this.parseFile(fileBuffer, fileName, mimeType);
      
      if (prospects.length === 0) {
        return { success: false, error: 'No valid records found in file' };
      }

      if (prospects.length > 1000) {
        return { success: false, error: 'File contains too many records. Maximum 1000 prospects per batch.' };
      }

      // Create batch record
      const batch = await storage.createProspectBatch({
        userId,
        fileName,
        targetIndustry,
        totalRecords: prospects.length,
        status: 'processing'
      });

      // Start processing asynchronously
      prospectProcessor.startProcessing({
        batchId: batch.id,
        userId,
        prospects,
        targetIndustry,
        industryKeywords: [] // TODO: Add industry keywords from templates
      });

      return {
        success: true,
        batchId: batch.id,
        totalRecords: prospects.length,
        preview: prospects.slice(0, 5) // Return first 5 for preview
      };

    } catch (error) {
      console.error('File processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown file processing error'
      };
    }
  }

  /**
   * Parse CSV or Excel file
   */
  private async parseFile(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<ParsedRow[]> {
    let workbook: XLSX.WorkBook;

    if (fileName.endsWith('.csv') || mimeType.includes('csv')) {
      // Parse CSV
      const csvText = fileBuffer.toString('utf-8');
      workbook = XLSX.read(csvText, { type: 'string' });
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || mimeType.includes('spreadsheet')) {
      // Parse Excel
      workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    } else {
      throw new Error('Unsupported file format. Please upload a CSV or Excel file.');
    }

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('File contains no sheets');
    }

    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

    if (rawData.length < 2) {
      throw new Error('File must contain at least a header row and one data row');
    }

    // Find column mappings
    const headers = rawData[0].map(h => h?.toString().toLowerCase().trim() || '');
    const companyNameIndex = this.findColumnIndex(headers, ['company', 'company_name', 'company name', 'business', 'organization', 'name']);
    const domainIndex = this.findColumnIndex(headers, ['domain', 'website', 'url', 'site', 'web', 'domain_name']);

    if (companyNameIndex === -1) {
      throw new Error('Could not find company name column. Expected headers: company, company_name, name, business, organization');
    }

    // Parse data rows
    const prospects: ParsedRow[] = [];
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      const companyName = row[companyNameIndex]?.toString().trim();
      
      if (!companyName || companyName.length < 2) {
        continue; // Skip empty or invalid company names
      }

      const websiteDomain = domainIndex !== -1 ? row[domainIndex]?.toString().trim() : undefined;
      
      prospects.push({
        originalCompanyName: companyName,
        websiteDomain: websiteDomain && websiteDomain.length > 3 ? this.cleanDomain(websiteDomain) : undefined
      });
    }

    return prospects;
  }

  /**
   * Find column index by possible header names
   */
  private findColumnIndex(headers: string[], possibleNames: string[]): number {
    for (const name of possibleNames) {
      const index = headers.findIndex(h => h.includes(name));
      if (index !== -1) return index;
    }
    return -1;
  }

  /**
   * Clean and normalize domain
   */
  private cleanDomain(domain: string): string {
    return domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/.*$/, '')
      .trim()
      .toLowerCase();
  }

  /**
   * Validate file before processing
   */
  validateFile(fileBuffer: Buffer, fileName: string, mimeType: string): { valid: boolean; error?: string } {
    // Check file size (max 10MB)
    if (fileBuffer.length > 10 * 1024 * 1024) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }

    // Check file type
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const validMimeTypes = [
      'text/csv',
      'application/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    const hasValidExtension = validExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
    const hasValidMimeType = validMimeTypes.some(type => mimeType.includes(type));

    if (!hasValidExtension && !hasValidMimeType) {
      return { valid: false, error: 'Invalid file type. Please upload a CSV or Excel file.' };
    }

    return { valid: true };
  }

  /**
   * Generate sample CSV template for download
   */
  generateSampleCSV(): Buffer {
    const sampleData = [
      ['company_name', 'website'],
      ['Acme Corporation', 'acme.com'],
      ['TechStart Inc', 'techstart.io'],
      ['Global Solutions LLC', 'globalsolutions.com'],
      ['Innovation Labs', 'innovationlabs.co']
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample');
    
    return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'csv' }));
  }

  /**
   * Export processed results to Excel
   */
  async exportResults(batchId: number, userId: string): Promise<Buffer> {
    const prospects = await storage.getProspectsByBatch(batchId, userId);
    
    const exportData = [
      ['Company Name', 'Website', 'Industry Match', 'Confidence', 'Competitors', 'Notes']
    ];

    for (const prospect of prospects) {
      const competitors = Array.isArray(prospect.competitors) 
        ? prospect.competitors.join(', ') 
        : '';
      
      exportData.push([
        prospect.originalCompanyName,
        prospect.websiteDomain || '',
        prospect.manualStatus || prospect.industryMatch || '',
        prospect.confidence ? `${prospect.confidence}%` : '',
        competitors,
        prospect.notes || ''
      ]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');
    
    return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  }
}

export const fileProcessor = FileProcessor.getInstance();