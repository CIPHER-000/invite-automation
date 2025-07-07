import express from 'express';
import { z } from 'zod';
import { storage } from './storage.js';
import { insertCampaignSchema, insertGoogleAccountSchema, insertMeetingInviteSchema } from '../shared/schema.js';

const router = express.Router();

// Enable JSON parsing
router.use(express.json());

// Campaigns routes
router.get('/campaigns', async (req, res) => {
  try {
    const campaigns = await storage.getCampaigns();
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

router.post('/campaigns', async (req, res) => {
  try {
    const validatedData = insertCampaignSchema.parse(req.body);
    const campaign = await storage.createCampaign(validatedData);
    res.status(201).json(campaign);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create campaign' });
    }
  }
});

router.get('/campaigns/:id', async (req, res) => {
  try {
    const campaign = await storage.getCampaign(req.params.id);
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

router.put('/campaigns/:id', async (req, res) => {
  try {
    const validatedData = insertCampaignSchema.partial().parse(req.body);
    const campaign = await storage.updateCampaign(req.params.id, validatedData);
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }
    res.json(campaign);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update campaign' });
    }
  }
});

router.delete('/campaigns/:id', async (req, res) => {
  try {
    const deleted = await storage.deleteCampaign(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

// Google accounts routes
router.get('/google-accounts', async (req, res) => {
  try {
    const accounts = await storage.getGoogleAccounts();
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Google accounts' });
  }
});

router.post('/google-accounts', async (req, res) => {
  try {
    const validatedData = insertGoogleAccountSchema.parse(req.body);
    const account = await storage.createGoogleAccount(validatedData);
    res.status(201).json(account);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create Google account' });
    }
  }
});

// Meeting invites routes
router.get('/meeting-invites', async (req, res) => {
  try {
    const { campaignId } = req.query;
    let invites;
    if (campaignId && typeof campaignId === 'string') {
      invites = await storage.getMeetingInvitesByCampaign(campaignId);
    } else {
      invites = await storage.getMeetingInvites();
    }
    res.json(invites);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch meeting invites' });
  }
});

router.post('/meeting-invites', async (req, res) => {
  try {
    const validatedData = insertMeetingInviteSchema.parse(req.body);
    const invite = await storage.createMeetingInvite(validatedData);
    res.status(201).json(invite);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create meeting invite' });
    }
  }
});

// Stats endpoint for dashboard
router.get('/stats', async (req, res) => {
  try {
    const [campaigns, accounts, invites] = await Promise.all([
      storage.getCampaigns(),
      storage.getGoogleAccounts(),
      storage.getMeetingInvites(),
    ]);

    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const connectedAccounts = accounts.filter(a => a.isConnected).length;
    const acceptedInvites = invites.filter(i => i.status === 'accepted').length;
    const sentTodayInvites = invites.filter(i => {
      const today = new Date();
      const sentDate = new Date(i.sentAt);
      return sentDate.toDateString() === today.toDateString();
    }).length;

    res.json({
      activeCampaigns,
      connectedAccounts,
      acceptedInvites,
      sentTodayInvites,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;