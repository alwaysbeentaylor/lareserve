/**
 * VIP Score Calculator
 * Calculates a score from 1-10 based on research results
 */

class VIPScorer {
    /**
     * Calculate VIP score based on research results
     * @param {Object} research - Research results object
     * @returns {number} Score from 1 to 10
     */
    calculate(research) {
        let score = 5; // Base score

        // Job title scoring (+0-3 points)
        if (research.jobTitle) {
            const title = research.jobTitle.toLowerCase();

            if (this.matchesPattern(title, ['ceo', 'founder', 'oprichter', 'owner', 'eigenaar', 'president'])) {
                score += 3;
            } else if (this.matchesPattern(title, ['cto', 'cfo', 'coo', 'chief', 'director', 'directeur', 'partner', 'vp', 'vice president'])) {
                score += 2;
            } else if (this.matchesPattern(title, ['manager', 'head', 'lead', 'senior'])) {
                score += 1;
            }
        }

        // LinkedIn presence (+0-1 points)
        if (research.linkedinUrl) {
            score += 1;
        }

        // Company presence (+0-1 points)
        if (research.companyName || research.websiteUrl) {
            score += 1;
        }

        // Notable info/press mentions (+0-1 points)
        if (research.notableInfo && research.notableInfo.length > 100) {
            score += 1;
        }
        if (research.pressMentions) {
            score += 1;
        }

        // Social media influence (+0-2 points)
        const totalFollowers = (research.instagramFollowers || 0) + (research.twitterFollowers || 0);
        if (totalFollowers > 100000) {
            score += 2;
        } else if (totalFollowers > 10000) {
            score += 1;
        }

        // LinkedIn connections (+0-1 points)
        if (research.linkedinConnections > 500) {
            score += 1;
        }

        // Cap at 10
        return Math.min(Math.max(score, 1), 10);
    }

    /**
     * Get influence level based on VIP score
     * @param {number} score - VIP score
     * @returns {string} Influence level
     */
    getInfluenceLevel(score) {
        if (score >= 9) return 'VIP';
        if (score >= 7) return 'Hoog';
        if (score >= 5) return 'Gemiddeld';
        return 'Laag';
    }

    /**
     * Check if string matches any pattern
     */
    matchesPattern(str, patterns) {
        return patterns.some(pattern => str.includes(pattern));
    }

    /**
     * Get score breakdown for display
     */
    getScoreBreakdown(research) {
        const breakdown = [];

        if (research.jobTitle) {
            const title = research.jobTitle.toLowerCase();
            if (this.matchesPattern(title, ['ceo', 'founder', 'oprichter', 'owner', 'eigenaar', 'president'])) {
                breakdown.push({ factor: 'C-level/Eigenaar', points: 3 });
            } else if (this.matchesPattern(title, ['cto', 'cfo', 'coo', 'chief', 'director', 'directeur', 'partner', 'vp'])) {
                breakdown.push({ factor: 'Director/Partner', points: 2 });
            } else if (this.matchesPattern(title, ['manager', 'head', 'lead', 'senior'])) {
                breakdown.push({ factor: 'Manager/Lead', points: 1 });
            }
        }

        if (research.linkedinUrl) {
            breakdown.push({ factor: 'LinkedIn Profiel', points: 1 });
        }

        if (research.companyName || research.websiteUrl) {
            breakdown.push({ factor: 'Bedrijf/Website', points: 1 });
        }

        if (research.notableInfo && research.notableInfo.length > 100) {
            breakdown.push({ factor: 'Opmerkelijke Info', points: 1 });
        }

        return breakdown;
    }
}

module.exports = new VIPScorer();
