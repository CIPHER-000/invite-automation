import { GoogleAccount } from "@shared/schema";
import { storage } from "../storage";

export interface InboxUsageStats {
  accountId: number;
  accountEmail: string;
  invitesToday: number;
  invitesThisWeek: number;
  lastUsed: Date | null;
  healthScore: number; // 0-100, higher is better
  isAvailable: boolean;
  cooldownUntil: Date | null;
  errorCount: number;
  successRate: number;
}

export interface LoadBalancingConfig {
  dailyQuotaPerInbox: number; // Max invites per day per inbox
  weeklyQuotaPerInbox: number; // Max invites per week per inbox
  cooldownMinutes: number; // Minutes between sends from same inbox
  maxErrorsBeforePause: number; // Max consecutive errors before pausing
  healthThreshold: number; // Minimum health score to use inbox
}

export class InboxLoadBalancer {
  private config: LoadBalancingConfig;
  private usageStats: Map<number, InboxUsageStats> = new Map();
  private errorCounts: Map<number, number> = new Map();
  private lastUsageTimes: Map<number, Date> = new Map();

  constructor(config?: Partial<LoadBalancingConfig>) {
    this.config = {
      dailyQuotaPerInbox: 50,
      weeklyQuotaPerInbox: 300,
      cooldownMinutes: 30,
      maxErrorsBeforePause: 3,
      healthThreshold: 70,
      ...config
    };
  }

  /**
   * Get the best available inbox for sending
   */
  async getBestAvailableInbox(): Promise<GoogleAccount | null> {
    const accounts = await storage.getGoogleAccounts();
    const activeAccounts = accounts.filter(acc => acc.isActive);

    if (activeAccounts.length === 0) {
      return null;
    }

    // Update usage stats for all accounts
    await this.updateUsageStats(activeAccounts);

    // Filter available accounts
    const availableAccounts = activeAccounts.filter(account => {
      const stats = this.usageStats.get(account.id);
      return stats?.isAvailable && stats.healthScore >= this.config.healthThreshold;
    });

    if (availableAccounts.length === 0) {
      // No accounts available - find the one that will be ready soonest
      return this.getNextAvailableInbox(activeAccounts);
    }

    // Sort by health score and usage (prefer less used, healthier inboxes)
    availableAccounts.sort((a, b) => {
      const statsA = this.usageStats.get(a.id)!;
      const statsB = this.usageStats.get(b.id)!;
      
      // Primary sort: health score (higher is better)
      if (statsA.healthScore !== statsB.healthScore) {
        return statsB.healthScore - statsA.healthScore;
      }
      
      // Secondary sort: daily usage (lower is better)
      if (statsA.invitesToday !== statsB.invitesToday) {
        return statsA.invitesToday - statsB.invitesToday;
      }
      
      // Tertiary sort: last used (older is better)
      const lastUsedA = statsA.lastUsed?.getTime() || 0;
      const lastUsedB = statsB.lastUsed?.getTime() || 0;
      return lastUsedA - lastUsedB;
    });

    return availableAccounts[0];
  }

  /**
   * Record usage for an inbox
   */
  async recordUsage(accountId: number, success: boolean = true): Promise<void> {
    const now = new Date();
    this.lastUsageTimes.set(accountId, now);

    if (success) {
      // Reset error count on success
      this.errorCounts.set(accountId, 0);
      
      // Update last used time in database
      await storage.updateGoogleAccount(accountId, { lastUsed: now });
      
      // Log successful usage
      await storage.createActivityLog({
        type: "inbox_usage",
        message: `Invite sent successfully from inbox ${accountId}`,
        googleAccountId: accountId,
      });
    } else {
      // Increment error count
      const currentErrors = this.errorCounts.get(accountId) || 0;
      this.errorCounts.set(accountId, currentErrors + 1);
      
      // Log error
      await storage.createActivityLog({
        type: "inbox_error",
        message: `Error sending invite from inbox ${accountId}`,
        googleAccountId: accountId,
      });
      
      // Pause inbox if too many errors
      if (currentErrors + 1 >= this.config.maxErrorsBeforePause) {
        await this.pauseInbox(accountId, `Too many consecutive errors (${currentErrors + 1})`);
      }
    }

    // Update usage stats
    const accounts = await storage.getGoogleAccounts();
    await this.updateUsageStats(accounts);
  }

  /**
   * Update usage statistics for all accounts
   */
  private async updateUsageStats(accounts: GoogleAccount[]): Promise<void> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - (todayStart.getDay() * 24 * 60 * 60 * 1000));

    for (const account of accounts) {
      // Get invite counts
      const allInvites = await storage.getInvites();
      const accountInvites = allInvites.filter(invite => invite.googleAccountId === account.id);
      
      const invitesToday = accountInvites.filter(invite => 
        invite.createdAt >= todayStart
      ).length;
      
      const invitesThisWeek = accountInvites.filter(invite => 
        invite.createdAt >= weekStart
      ).length;

      // Calculate success rate
      const recentInvites = accountInvites.filter(invite => 
        invite.createdAt >= new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))
      );
      const successfulInvites = recentInvites.filter(invite => 
        invite.status === "sent" || invite.status === "accepted"
      );
      const successRate = recentInvites.length > 0 ? 
        (successfulInvites.length / recentInvites.length) * 100 : 100;

      // Check cooldown
      const lastUsed = this.lastUsageTimes.get(account.id) || account.lastUsed;
      const cooldownUntil = lastUsed ? 
        new Date(lastUsed.getTime() + (this.config.cooldownMinutes * 60 * 1000)) : null;
      const isInCooldown = cooldownUntil ? now < cooldownUntil : false;

      // Check quotas
      const dailyQuotaExceeded = invitesToday >= this.config.dailyQuotaPerInbox;
      const weeklyQuotaExceeded = invitesThisWeek >= this.config.weeklyQuotaPerInbox;

      // Check error count
      const errorCount = this.errorCounts.get(account.id) || 0;
      const tooManyErrors = errorCount >= this.config.maxErrorsBeforePause;

      // Calculate health score
      const healthScore = this.calculateHealthScore({
        successRate,
        dailyUsageRatio: invitesToday / this.config.dailyQuotaPerInbox,
        weeklyUsageRatio: invitesThisWeek / this.config.weeklyQuotaPerInbox,
        errorCount,
        isActive: account.isActive,
      });

      // Determine availability
      const isAvailable = account.isActive && 
        !isInCooldown && 
        !dailyQuotaExceeded && 
        !weeklyQuotaExceeded && 
        !tooManyErrors;

      const stats: InboxUsageStats = {
        accountId: account.id,
        accountEmail: account.email,
        invitesToday,
        invitesThisWeek,
        lastUsed,
        healthScore,
        isAvailable,
        cooldownUntil: isInCooldown ? cooldownUntil : null,
        errorCount,
        successRate,
      };

      this.usageStats.set(account.id, stats);
    }
  }

  /**
   * Calculate health score for an inbox
   */
  private calculateHealthScore(factors: {
    successRate: number;
    dailyUsageRatio: number;
    weeklyUsageRatio: number;
    errorCount: number;
    isActive: boolean;
  }): number {
    if (!factors.isActive) return 0;

    let score = 100;

    // Success rate factor (0-40 points)
    score = Math.min(score, factors.successRate * 0.4 + 60);

    // Usage factor - prefer less used inboxes (0-30 points)
    const avgUsageRatio = (factors.dailyUsageRatio + factors.weeklyUsageRatio) / 2;
    score -= avgUsageRatio * 30;

    // Error penalty (0-30 points deduction)
    score -= factors.errorCount * 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get the next available inbox (when none are currently available)
   */
  private getNextAvailableInbox(accounts: GoogleAccount[]): GoogleAccount | null {
    let nextAvailable: { account: GoogleAccount; availableAt: Date } | null = null;

    for (const account of accounts) {
      const stats = this.usageStats.get(account.id);
      if (!stats || !account.isActive) continue;

      let availableAt = new Date();

      // If in cooldown, use cooldown end time
      if (stats.cooldownUntil && stats.cooldownUntil > availableAt) {
        availableAt = stats.cooldownUntil;
      }

      // If daily quota exceeded, available tomorrow
      if (stats.invitesToday >= this.config.dailyQuotaPerInbox) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        if (tomorrow > availableAt) {
          availableAt = tomorrow;
        }
      }

      if (!nextAvailable || availableAt < nextAvailable.availableAt) {
        nextAvailable = { account, availableAt };
      }
    }

    return nextAvailable?.account || null;
  }

  /**
   * Pause an inbox temporarily
   */
  async pauseInbox(accountId: number, reason: string): Promise<void> {
    await storage.updateGoogleAccount(accountId, { isActive: false });
    
    await storage.createActivityLog({
      type: "inbox_paused",
      message: `Inbox ${accountId} paused: ${reason}`,
      googleAccountId: accountId,
    });
  }

  /**
   * Resume a paused inbox
   */
  async resumeInbox(accountId: number): Promise<void> {
    await storage.updateGoogleAccount(accountId, { isActive: true });
    this.errorCounts.set(accountId, 0); // Reset error count
    
    await storage.createActivityLog({
      type: "inbox_resumed",
      message: `Inbox ${accountId} resumed`,
      googleAccountId: accountId,
    });
  }

  /**
   * Get usage statistics for all inboxes
   */
  async getAllUsageStats(): Promise<InboxUsageStats[]> {
    const accounts = await storage.getGoogleAccounts();
    await this.updateUsageStats(accounts);
    return Array.from(this.usageStats.values());
  }

  /**
   * Get usage statistics for a specific inbox
   */
  async getInboxStats(accountId: number): Promise<InboxUsageStats | null> {
    const accounts = await storage.getGoogleAccounts();
    await this.updateUsageStats(accounts);
    return this.usageStats.get(accountId) || null;
  }

  /**
   * Reset daily usage counters (call this daily)
   */
  async resetDailyCounters(): Promise<void> {
    // This would typically be called by a cron job
    const accounts = await storage.getGoogleAccounts();
    
    for (const account of accounts) {
      if (!account.isActive) {
        // Auto-resume inboxes that were paused due to daily limits
        const stats = this.usageStats.get(account.id);
        if (stats && stats.errorCount < this.config.maxErrorsBeforePause) {
          await this.resumeInbox(account.id);
        }
      }
    }

    await storage.createActivityLog({
      type: "system",
      message: "Daily usage counters reset",
    });
  }

  /**
   * Get load balancing configuration
   */
  getConfig(): LoadBalancingConfig {
    return { ...this.config };
  }

  /**
   * Update load balancing configuration
   */
  updateConfig(newConfig: Partial<LoadBalancingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

export const inboxLoadBalancer = new InboxLoadBalancer();