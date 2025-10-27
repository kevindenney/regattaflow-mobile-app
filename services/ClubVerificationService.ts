/**
 * Club Verification Service
 * Handles DNS and meta tag verification for club onboarding
 */

import { supabase } from './supabase';

export interface VerificationResult {
  success: boolean;
  method?: 'dns' | 'meta_tag';
  error?: string;
  verificationToken?: string;
}

export interface ClubExtractedData {
  clubName?: string;
  established?: number;
  fleets?: Array<{ name: string; boats: number }>;
  races?: Array<{ name: string; frequency: string }>;
  regattas?: string[];
  adminUsers?: string[];
  memberCount?: number;
}

export class ClubVerificationService {
  private static VERIFICATION_TOKEN_META = 'regattaflow-verification';
  private static VERIFICATION_TXT_PREFIX = 'regattaflow-verify=';

  /**
   * Generate a unique verification token for a club
   */
  static async generateVerificationToken(userId: string): Promise<string> {
    const token = `rf_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Store token in club_profiles
    const { error } = await supabase
      .from('club_profiles')
      .upsert({
        user_id: userId,
        verification_token: token,
        verification_status: 'pending',
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error('Error storing verification token:', error);
      throw new Error('Failed to generate verification token');
    }

    return token;
  }

  /**
   * Verify website using meta tag method
   * Checks for <meta name="regattaflow-verification" content="token">
   */
  static async verifyMetaTag(
    websiteUrl: string,
    userId: string
  ): Promise<VerificationResult> {
    try {
      // Get the stored verification token
      const { data: profile, error: profileError } = await supabase
        .from('club_profiles')
        .select('verification_token')
        .eq('user_id', userId)
        .single();

      if (profileError || !profile?.verification_token) {
        return {
          success: false,
          error: 'No verification token found. Please generate one first.',
        };
      }

      const expectedToken = profile.verification_token;

      // Fetch the website HTML
      const response = await fetch(websiteUrl, {
        headers: {
          'User-Agent': 'RegattaFlow-Verifier/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch website: ${response.status}`);
      }

      const html = await response.text();

      // Check for meta tag
      const metaRegex = new RegExp(
        `<meta[^>]*name=["']${this.VERIFICATION_TOKEN_META}["'][^>]*content=["']${expectedToken}["'][^>]*>`,
        'i'
      );
      const metaRegexReverse = new RegExp(
        `<meta[^>]*content=["']${expectedToken}["'][^>]*name=["']${this.VERIFICATION_TOKEN_META}["'][^>]*>`,
        'i'
      );

      const isVerified = metaRegex.test(html) || metaRegexReverse.test(html);

      // Log the verification attempt
      await this.logVerificationAttempt(
        userId,
        'meta_tag',
        websiteUrl,
        isVerified,
        isVerified ? undefined : 'Meta tag not found or token mismatch'
      );

      if (isVerified) {
        // Update club profile
        await this.updateVerificationStatus(userId, 'verified', 'meta_tag');

        return {
          success: true,
          method: 'meta_tag',
          verificationToken: expectedToken,
        };
      }

      return {
        success: false,
        error: 'Meta tag not found. Please add the verification meta tag to your website.',
      };
    } catch (error: any) {
      console.error('Meta tag verification error:', error);

      // Log the failed attempt
      await this.logVerificationAttempt(
        userId,
        'meta_tag',
        websiteUrl,
        false,
        error.message
      );

      return {
        success: false,
        error: error.message || 'Failed to verify website',
      };
    }
  }

  /**
   * Verify website using DNS TXT record method
   * Checks for TXT record: regattaflow-verify=token
   */
  static async verifyDNS(
    websiteUrl: string,
    userId: string
  ): Promise<VerificationResult> {
    try {
      // Get the stored verification token
      const { data: profile, error: profileError } = await supabase
        .from('club_profiles')
        .select('verification_token')
        .eq('user_id', userId)
        .single();

      if (profileError || !profile?.verification_token) {
        return {
          success: false,
          error: 'No verification token found. Please generate one first.',
        };
      }

      const expectedToken = profile.verification_token;

      // Extract domain from URL
      const domain = new URL(websiteUrl).hostname;

      // Note: DNS verification requires a backend API or service
      // This is a placeholder - in production, you'd call a backend endpoint
      // that performs DNS lookups using node's dns module or external DNS API

      // For now, we'll return an error indicating this needs backend support
      return {
        success: false,
        error: 'DNS verification requires backend API support. Please use meta tag verification instead.',
      };

      // Production implementation would look like:
      // const response = await fetch('/api/verify-dns', {
      //   method: 'POST',
      //   body: JSON.stringify({ domain, expectedToken }),
      // });
      //
      // const { verified } = await response.json();
      //
      // if (verified) {
      //   await this.updateVerificationStatus(userId, 'verified', 'dns');
      //   return { success: true, method: 'dns', verificationToken: expectedToken };
      // }
    } catch (error: any) {
      console.error('DNS verification error:', error);

      await this.logVerificationAttempt(
        userId,
        'dns',
        websiteUrl,
        false,
        error.message
      );

      return {
        success: false,
        error: error.message || 'Failed to verify DNS',
      };
    }
  }

  /**
   * Extract club data from website using AI
   */
  static async extractClubData(
    websiteUrl: string
  ): Promise<ClubExtractedData | null> {
    try {
      // Fetch website HTML
      const response = await fetch(websiteUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch website: ${response.status}`);
      }

      const html = await response.text();

      // In production, this would use Anthropic Claude or similar to extract data
      // For now, return mock data as placeholder
      // TODO: Integrate with Anthropic Claude for extraction

      return {
        clubName: 'Extracted Club Name',
        established: new Date().getFullYear() - 50,
        memberCount: 250,
        fleets: [
          { name: 'Laser Fleet', boats: 24 },
          { name: 'J/24 Fleet', boats: 12 },
        ],
        races: [
          { name: 'Wednesday Series', frequency: 'Weekly' },
          { name: 'Weekend Regatta', frequency: 'Monthly' },
        ],
        regattas: ['Annual Championship', 'Harbor Regatta'],
        adminUsers: ['admin@example.com'],
      };
    } catch (error: any) {
      console.error('Error extracting club data:', error);
      return null;
    }
  }

  /**
   * Check if website URL exists in yacht_clubs database
   */
  static async findMatchingYachtClub(websiteUrl: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('yacht_clubs')
        .select('id, website')
        .ilike('website', `%${new URL(websiteUrl).hostname}%`)
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error finding matching yacht club:', error);
      return null;
    }
  }

  /**
   * Update verification status in database
   */
  private static async updateVerificationStatus(
    userId: string,
    status: 'pending' | 'verified' | 'rejected',
    method?: 'dns' | 'meta_tag'
  ): Promise<void> {
    const updateData: any = {
      verification_status: status,
    };

    if (method) {
      updateData.verification_method = method;
    }

    if (status === 'verified') {
      updateData.verified_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('club_profiles')
      .update(updateData)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating verification status:', error);
      throw new Error('Failed to update verification status');
    }
  }

  /**
   * Log verification attempt for audit trail
   */
  private static async logVerificationAttempt(
    userId: string,
    method: 'dns' | 'meta_tag',
    websiteUrl: string,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      // First, get the club profile id
      const { data: profile } = await supabase
        .from('club_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!profile) {
        console.error('No club profile found for user');
        return;
      }

      await supabase.from('club_verification_attempts').insert({
        club_profile_id: profile.id,
        method,
        website_url: websiteUrl,
        success,
        error_message: errorMessage,
      });
    } catch (error) {
      console.error('Error logging verification attempt:', error);
      // Don't throw - logging failures shouldn't break verification flow
    }
  }

  /**
   * Get verification instructions for users
   */
  static getVerificationInstructions(token: string): {
    metaTag: string;
    dnsRecord: string;
  } {
    return {
      metaTag: `<meta name="${this.VERIFICATION_TOKEN_META}" content="${token}">`,
      dnsRecord: `${this.VERIFICATION_TXT_PREFIX}${token}`,
    };
  }
}
