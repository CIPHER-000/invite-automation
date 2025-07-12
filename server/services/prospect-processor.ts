import { prospectScraper } from './prospect-scraper';
import { openaiClassifier } from './openai-classifier';
import { storage } from '../storage';
import type { InsertProspect, InsertProspectProcessingLog } from '@shared/schema';

interface ProcessingJob {
  batchId: number;
  userId: string;
  prospects: Array<{
    originalCompanyName: string;
    websiteDomain?: string;
  }>;
  targetIndustry: string;
  industryKeywords?: string[];
}

interface ProcessingProgress {
  batchId: number;
  totalRecords: number;
  processedRecords: number;
  confirmedRecords: number;
  rejectedRecords: number;
  greyAreaRecords: number;
  status: 'processing' | 'completed' | 'failed';
  error?: string;
}

export class ProspectProcessor {
  private static instance: ProspectProcessor;
  private processingJobs = new Map<number, ProcessingProgress>();
  private activeProcessing = new Set<number>();

  static getInstance(): ProspectProcessor {
    if (!ProspectProcessor.instance) {
      ProspectProcessor.instance = new ProspectProcessor();
    }
    return ProspectProcessor.instance;
  }

  /**
   * Start processing a batch of prospects
   */
  async startProcessing(job: ProcessingJob): Promise<void> {
    const { batchId, userId, prospects, targetIndustry, industryKeywords } = job;

    if (this.activeProcessing.has(batchId)) {
      throw new Error(`Batch ${batchId} is already being processed`);
    }

    this.activeProcessing.add(batchId);
    
    // Initialize progress tracking
    this.processingJobs.set(batchId, {
      batchId,
      totalRecords: prospects.length,
      processedRecords: 0,
      confirmedRecords: 0,
      rejectedRecords: 0,
      greyAreaRecords: 0,
      status: 'processing'
    });

    // Log processing start
    await this.logProcessingStep(batchId, userId, 'processing', 'started', 
      `Started processing batch ${batchId} with ${prospects.length} prospects`);

    // Process asynchronously
    this.processProspectsAsync(job).catch(async (error) => {
      console.error(`Processing failed for batch ${batchId}:`, error);
      await this.handleProcessingError(batchId, userId, error);
    });
  }

  /**
   * Get processing progress for a batch
   */
  getProgress(batchId: number): ProcessingProgress | undefined {
    return this.processingJobs.get(batchId);
  }

  /**
   * Process all prospects in a batch
   */
  private async processProspectsAsync(job: ProcessingJob): Promise<void> {
    const { batchId, userId, prospects, targetIndustry, industryKeywords } = job;
    const progress = this.processingJobs.get(batchId)!;

    try {
      // Process prospects in parallel batches of 3 to avoid overwhelming APIs
      const batchSize = 3;
      for (let i = 0; i < prospects.length; i += batchSize) {
        const batch = prospects.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(prospect => this.processIndividualProspect({
            batchId,
            userId,
            prospect,
            targetIndustry,
            industryKeywords
          }))
        );

        // Update progress
        progress.processedRecords = Math.min(i + batchSize, prospects.length);
        
        // Small delay between batches to be respectful to APIs
        if (i + batchSize < prospects.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Mark as completed
      progress.status = 'completed';
      await storage.updateProspectBatch(batchId, {
        status: 'completed',
        processedRecords: progress.processedRecords,
        confirmedRecords: progress.confirmedRecords,
        rejectedRecords: progress.rejectedRecords,
        greyAreaRecords: progress.greyAreaRecords,
        updatedAt: new Date()
      });

      await this.logProcessingStep(batchId, userId, 'completion', 'completed',
        `Completed processing batch ${batchId}. Results: ${progress.confirmedRecords} confirmed, ${progress.rejectedRecords} rejected, ${progress.greyAreaRecords} grey area`);

    } catch (error) {
      await this.handleProcessingError(batchId, userId, error);
    } finally {
      this.activeProcessing.delete(batchId);
    }
  }

  /**
   * Process a single prospect
   */
  private async processIndividualProspect({
    batchId,
    userId,
    prospect,
    targetIndustry,
    industryKeywords
  }: {
    batchId: number;
    userId: string;
    prospect: { originalCompanyName: string; websiteDomain?: string };
    targetIndustry: string;
    industryKeywords?: string[];
  }): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Step 1: Create prospect record
      const prospectRecord = await storage.createProspect({
        batchId,
        userId,
        originalCompanyName: prospect.originalCompanyName,
        websiteDomain: prospect.websiteDomain,
        cleanedCompanyName: this.cleanCompanyName(prospect.originalCompanyName),
        scrapingStatus: 'pending',
        classificationStatus: 'pending'
      });

      // Step 2: Scrape company description
      let companyDescription = '';
      let scrapingStatus = 'failed';
      let scrapingError: string | undefined;

      if (prospect.websiteDomain) {
        try {
          const scrapingResult = await prospectScraper.scrapeCompanyDescription(prospect.websiteDomain);
          if (scrapingResult.success) {
            companyDescription = scrapingResult.description;
            scrapingStatus = 'success';
          } else {
            scrapingError = scrapingResult.error;
          }
        } catch (error) {
          scrapingError = error instanceof Error ? error.message : 'Unknown scraping error';
        }
      } else {
        // Try to extract domain from company name
        const suggestedDomains = prospectScraper.extractDomainFromCompanyName(prospect.originalCompanyName);
        
        for (const domain of suggestedDomains) {
          try {
            const scrapingResult = await prospectScraper.scrapeCompanyDescription(domain);
            if (scrapingResult.success && scrapingResult.description.length > 100) {
              companyDescription = scrapingResult.description;
              scrapingStatus = 'success';
              await storage.updateProspect(prospectRecord.id, { websiteDomain: domain });
              break;
            }
          } catch (error) {
            // Continue to next domain suggestion
          }
        }
        
        if (scrapingStatus === 'failed') {
          scrapingError = 'No valid domain found and unable to scrape content';
        }
      }

      // Update prospect with scraping results
      await storage.updateProspect(prospectRecord.id, {
        companyDescription,
        scrapingStatus,
        scrapingError
      });

      // Step 3: Classify with OpenAI (even if scraping failed, try with company name)
      let classificationStatus = 'failed';
      let industryMatch: string | undefined;
      let confidence: number | undefined;
      let competitors: string[] = [];
      let reasoning = '';
      let openaiPrompt = '';
      let openaiResponse: any;

      try {
        const descriptionToAnalyze = companyDescription || `Company name: ${prospect.originalCompanyName}`;
        
        const classificationResult = await openaiClassifier.classifyCompany({
          companyName: prospect.originalCompanyName,
          companyDescription: descriptionToAnalyze,
          targetIndustry,
          industryKeywords
        });

        industryMatch = classificationResult.status;
        confidence = classificationResult.confidence;
        competitors = classificationResult.competitors;
        reasoning = classificationResult.reasoning;
        openaiResponse = classificationResult.rawResponse;
        classificationStatus = 'completed';

        // Update progress counters
        const progress = this.processingJobs.get(batchId)!;
        if (industryMatch === 'confirmed') progress.confirmedRecords++;
        else if (industryMatch === 'rejected') progress.rejectedRecords++;
        else progress.greyAreaRecords++;

      } catch (error) {
        reasoning = error instanceof Error ? error.message : 'Classification failed';
      }

      // Step 4: Update prospect with classification results
      await storage.updateProspect(prospectRecord.id, {
        classificationStatus,
        industryMatch,
        confidence,
        competitors,
        classificationReasoning: reasoning,
        openaiPrompt,
        openaiResponse
      });

      // Step 5: Log completion
      const executionTime = Date.now() - startTime;
      await this.logProcessingStep(
        batchId, userId, 'classification', 'completed',
        `Processed ${prospect.originalCompanyName}: ${industryMatch || 'failed'} (${confidence || 0}% confidence)`,
        prospectRecord.id, { executionTime, scrapingStatus, classificationStatus }
      );

    } catch (error) {
      const executionTime = Date.now() - startTime;
      await this.logProcessingStep(
        batchId, userId, 'classification', 'failed',
        `Failed to process ${prospect.originalCompanyName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined, { executionTime }
      );
      throw error;
    }
  }

  /**
   * Handle processing errors
   */
  private async handleProcessingError(batchId: number, userId: string, error: any): Promise<void> {
    const progress = this.processingJobs.get(batchId);
    if (progress) {
      progress.status = 'failed';
      progress.error = error instanceof Error ? error.message : 'Unknown processing error';
    }

    await storage.updateProspectBatch(batchId, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown processing error'
    });

    await this.logProcessingStep(batchId, userId, 'processing', 'failed',
      `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  /**
   * Log processing step
   */
  private async logProcessingStep(
    batchId: number,
    userId: string,
    step: string,
    status: string,
    message: string,
    prospectId?: number,
    metadata?: any
  ): Promise<void> {
    try {
      await storage.createProspectProcessingLog({
        batchId,
        userId,
        prospectId,
        step,
        status,
        message,
        metadata: metadata || {},
        executionTime: metadata?.executionTime
      });
    } catch (error) {
      console.error('Failed to log processing step:', error);
    }
  }

  /**
   * Clean company name for consistency
   */
  private cleanCompanyName(name: string): string {
    return name
      .replace(/\b(inc|corp|corporation|company|co|ltd|limited|llc|llp)\b\.?/gi, '')
      .replace(/[^\w\s]/g, '')
      .trim()
      .replace(/\s+/g, ' ');
  }

  /**
   * Stop processing a batch (if needed)
   */
  async stopProcessing(batchId: number): Promise<void> {
    this.activeProcessing.delete(batchId);
    const progress = this.processingJobs.get(batchId);
    if (progress && progress.status === 'processing') {
      progress.status = 'failed';
      progress.error = 'Processing stopped by user';
      
      await storage.updateProspectBatch(batchId, {
        status: 'failed',
        error: 'Processing stopped by user'
      });
    }
  }
}

export const prospectProcessor = ProspectProcessor.getInstance();