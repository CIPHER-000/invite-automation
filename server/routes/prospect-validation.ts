import { Router } from 'express';
import { fileProcessor } from '../services/file-processor';
import { prospectProcessor } from '../services/prospect-processor';
import { openaiClassifier } from '../services/openai-classifier';
import { storage } from '../storage';
import { requireAuth } from '../auth';
import multer from 'multer';
import { z } from 'zod';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowedTypes.includes(file.mimetype) || 
        file.originalname.match(/\.(csv|xlsx|xls)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload CSV or Excel files only.'));
    }
  }
});

// Upload and process prospect list
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const { targetIndustry } = req.body;
    const file = req.file;
    const userId = (req as any).user.id;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!targetIndustry || typeof targetIndustry !== 'string') {
      return res.status(400).json({ error: 'Target industry is required' });
    }

    // Validate file
    const validation = fileProcessor.validateFile(file.buffer, file.originalname, file.mimetype);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Process file
    const result = await fileProcessor.processFile(
      file.buffer,
      file.originalname,
      userId,
      targetIndustry.trim(),
      file.mimetype
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      batchId: result.batchId,
      totalRecords: result.totalRecords,
      preview: result.preview,
      message: `Processing started for ${result.totalRecords} prospects`
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Failed to process upload',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get processing progress
router.get('/batches/:id/progress', requireAuth, async (req, res) => {
  try {
    const batchId = parseInt(req.params.id);
    const userId = (req as any).user.id;

    // Verify batch ownership
    const batch = await storage.getProspectBatch(batchId, userId);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // Get progress from processor
    const progress = prospectProcessor.getProgress(batchId);
    
    res.json({
      batchId,
      ...progress,
      batch: {
        id: batch.id,
        fileName: batch.fileName,
        targetIndustry: batch.targetIndustry,
        status: batch.status,
        error: batch.error,
        createdAt: batch.createdAt
      }
    });

  } catch (error) {
    console.error('Progress check error:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

// Get all prospect batches for user
router.get('/batches', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const batches = await storage.getProspectBatches(userId);
    
    res.json(batches);
  } catch (error) {
    console.error('Get batches error:', error);
    res.status(500).json({ error: 'Failed to get batches' });
  }
});

// Get prospects for a batch
router.get('/batches/:id/prospects', requireAuth, async (req, res) => {
  try {
    const batchId = parseInt(req.params.id);
    const userId = (req as any).user.id;

    // Verify batch ownership
    const batch = await storage.getProspectBatch(batchId, userId);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const prospects = await storage.getProspectsByBatch(batchId, userId);
    
    res.json({
      batch,
      prospects
    });

  } catch (error) {
    console.error('Get prospects error:', error);
    res.status(500).json({ error: 'Failed to get prospects' });
  }
});

// Update prospect manually
router.patch('/prospects/:id', requireAuth, async (req, res) => {
  try {
    const prospectId = parseInt(req.params.id);
    const userId = (req as any).user.id;
    const { manualStatus, manualCompetitors, notes } = req.body;

    // Verify prospect ownership
    const prospect = await storage.getProspect(prospectId, userId);
    if (!prospect) {
      return res.status(404).json({ error: 'Prospect not found' });
    }

    // Update prospect
    const updated = await storage.updateProspect(prospectId, {
      manualStatus: manualStatus || prospect.manualStatus,
      manualCompetitors: manualCompetitors || prospect.manualCompetitors,
      notes: notes !== undefined ? notes : prospect.notes,
      manualOverride: true
    });

    res.json(updated);

  } catch (error) {
    console.error('Update prospect error:', error);
    res.status(500).json({ error: 'Failed to update prospect' });
  }
});

// Export results
router.get('/batches/:id/export', requireAuth, async (req, res) => {
  try {
    const batchId = parseInt(req.params.id);
    const userId = (req as any).user.id;

    // Verify batch ownership
    const batch = await storage.getProspectBatch(batchId, userId);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const exportBuffer = await fileProcessor.exportResults(batchId, userId);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="prospect-validation-${batch.fileName}-${Date.now()}.xlsx"`);
    res.send(exportBuffer);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export results' });
  }
});

// Download sample CSV template
router.get('/sample-template', (req, res) => {
  try {
    const sampleBuffer = fileProcessor.generateSampleCSV();
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="prospect-upload-template.csv"');
    res.send(sampleBuffer);

  } catch (error) {
    console.error('Sample template error:', error);
    res.status(500).json({ error: 'Failed to generate sample template' });
  }
});

// Delete batch
router.delete('/batches/:id', requireAuth, async (req, res) => {
  try {
    const batchId = parseInt(req.params.id);
    const userId = (req as any).user.id;

    // Verify batch ownership
    const batch = await storage.getProspectBatch(batchId, userId);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // Stop processing if still active
    if (batch.status === 'processing') {
      await prospectProcessor.stopProcessing(batchId);
    }

    // Delete batch and all associated data
    await storage.deleteProspectBatch(batchId, userId);

    res.json({ success: true, message: 'Batch deleted successfully' });

  } catch (error) {
    console.error('Delete batch error:', error);
    res.status(500).json({ error: 'Failed to delete batch' });
  }
});

// Test OpenAI connection
router.get('/test-openai', requireAuth, async (req, res) => {
  try {
    const testResult = await openaiClassifier.testConnection();
    res.json(testResult);
  } catch (error) {
    console.error('OpenAI test error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Industry Templates
router.get('/templates', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const templates = await storage.getIndustryTemplates(userId);
    res.json(templates);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to get templates' });
  }
});

router.post('/templates', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { name, description, industryKeywords } = req.body;

    if (!name || !Array.isArray(industryKeywords)) {
      return res.status(400).json({ error: 'Name and industry keywords are required' });
    }

    const { classificationPrompt, competitorPrompt } = openaiClassifier.buildIndustryTemplate(
      name, industryKeywords, description
    );

    const template = await storage.createIndustryTemplate({
      userId,
      name,
      description,
      industryKeywords,
      classificationPrompt,
      competitorPrompt
    });

    res.json(template);

  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

export { router as prospectValidationRouter };