const express = require('express');
const router = express.Router();
const db = require('../db/database');
const smartSearch = require('../services/smartSearch');
const vipScorer = require('../services/vipScorer');

// POST /api/research/:guestId - Start research for a single guest
router.post('/:guestId', async (req, res) => {
    try {
        const { guestId } = req.params;
        const { forceRefresh = false } = req.body;

        // Get guest
        const guest = db.prepare('SELECT * FROM guests WHERE id = ?').get(guestId);
        if (!guest) {
            return res.status(404).json({ error: 'Gast niet gevonden' });
        }

        // Check existing research
        const existingResearch = db.prepare('SELECT * FROM research_results WHERE guest_id = ?').get(guestId);
        if (existingResearch && !forceRefresh) {
            return res.json({
                message: 'Research al uitgevoerd',
                research: existingResearch,
                cached: true
            });
        }

        // Perform smart search (Wikipedia + AI)
        const searchResults = await smartSearch.searchGuest(guest);

        // Get VIP score from AI analysis or calculate
        const vipScore = searchResults.vipScore || vipScorer.calculate(searchResults);
        const influenceLevel = searchResults.influenceLevel || vipScorer.getInfluenceLevel(vipScore);

        // Save or update research results
        if (existingResearch) {
            db.prepare(`
        UPDATE research_results SET
          profile_photo_url = ?,
          job_title = ?,
          company_name = ?,
          company_size = ?,
          is_owner = ?,
          employment_type = ?,
          industry = ?,
          linkedin_url = ?,
          linkedin_connections = ?,
          linkedin_candidates = ?,
          needs_linkedin_review = ?,
          instagram_handle = ?,
          instagram_url = ?,
          twitter_handle = ?,
          twitter_url = ?,
          facebook_url = ?,
          youtube_url = ?,
          website_url = ?,
          notable_info = ?,
          press_mentions = ?,
          net_worth = ?,
          followers_estimate = ?,
          vip_score = ?,
          influence_level = ?,
          raw_search_results = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE guest_id = ?
      `).run(
                searchResults.profilePhotoUrl,
                searchResults.jobTitle,
                searchResults.companyName,
                searchResults.companySize,
                searchResults.isOwner === true ? 1 : (searchResults.isOwner === false ? 0 : null),
                searchResults.employmentType,
                searchResults.industry,
                searchResults.linkedinUrl,
                searchResults.linkedinConnections,
                JSON.stringify(searchResults.linkedinCandidates || []),
                searchResults.needsLinkedInReview ? 1 : 0,
                searchResults.instagramHandle,
                searchResults.instagramUrl,
                searchResults.twitterHandle,
                searchResults.twitterUrl,
                searchResults.facebookUrl,
                searchResults.youtubeUrl,
                searchResults.websiteUrl,
                searchResults.notableInfo,
                searchResults.pressMentions,
                searchResults.netWorthEstimate,
                searchResults.followersEstimate,
                vipScore,
                influenceLevel,
                JSON.stringify(searchResults.rawResults),
                guestId
            );
        } else {
            db.prepare(`
        INSERT INTO research_results (
          guest_id, profile_photo_url, job_title, company_name, company_size, is_owner, employment_type,
          industry, linkedin_url, linkedin_connections, linkedin_candidates, needs_linkedin_review,
          instagram_handle, instagram_url, twitter_handle, twitter_url, facebook_url, youtube_url, website_url,
          notable_info, press_mentions, net_worth, followers_estimate, vip_score, influence_level, raw_search_results
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
                guestId,
                searchResults.profilePhotoUrl,
                searchResults.jobTitle,
                searchResults.companyName,
                searchResults.companySize,
                searchResults.isOwner === true ? 1 : (searchResults.isOwner === false ? 0 : null),
                searchResults.employmentType,
                searchResults.industry,
                searchResults.linkedinUrl,
                searchResults.linkedinConnections,
                JSON.stringify(searchResults.linkedinCandidates || []),
                searchResults.needsLinkedInReview ? 1 : 0,
                searchResults.instagramHandle,
                searchResults.instagramUrl,
                searchResults.twitterHandle,
                searchResults.twitterUrl,
                searchResults.facebookUrl,
                searchResults.youtubeUrl,
                searchResults.websiteUrl,
                searchResults.notableInfo,
                searchResults.pressMentions,
                searchResults.netWorthEstimate,
                searchResults.followersEstimate,
                vipScore,
                influenceLevel,
                JSON.stringify(searchResults.rawResults)
            );
        }

        // Get updated research
        const research = db.prepare('SELECT * FROM research_results WHERE guest_id = ?').get(guestId);

        res.json({
            success: true,
            research,
            cached: false
        });

    } catch (error) {
        console.error('Research error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/research/batch - Research multiple guests
router.post('/batch', async (req, res) => {
    try {
        const { guestIds, skipExisting = true } = req.body;

        if (!guestIds || !Array.isArray(guestIds) || guestIds.length === 0) {
            return res.status(400).json({ error: 'Geen gasten geselecteerd' });
        }

        const results = {
            total: guestIds.length,
            completed: 0,
            skipped: 0,
            errors: []
        };

        for (const guestId of guestIds) {
            try {
                const guest = db.prepare('SELECT * FROM guests WHERE id = ?').get(guestId);
                if (!guest) {
                    results.errors.push({ guestId, error: 'Gast niet gevonden' });
                    continue;
                }

                // Check existing research
                const existingResearch = db.prepare('SELECT id FROM research_results WHERE guest_id = ?').get(guestId);
                if (existingResearch && skipExisting) {
                    results.skipped++;
                    continue;
                }

                // Perform smart search
                const searchResults = await smartSearch.searchGuest(guest);
                const vipScore = searchResults.vipScore || vipScorer.calculate(searchResults);
                const influenceLevel = searchResults.influenceLevel || vipScorer.getInfluenceLevel(vipScore);

                // Save results
                if (existingResearch) {
                    db.prepare(`
            UPDATE research_results SET
              profile_photo_url = ?, job_title = ?, company_name = ?, company_size = ?,
              industry = ?, linkedin_url = ?, linkedin_connections = ?, website_url = ?,
              notable_info = ?, press_mentions = ?, vip_score = ?, influence_level = ?,
              raw_search_results = ?, updated_at = CURRENT_TIMESTAMP
            WHERE guest_id = ?
          `).run(
                        searchResults.profilePhotoUrl, searchResults.jobTitle, searchResults.companyName,
                        searchResults.companySize, searchResults.industry, searchResults.linkedinUrl,
                        searchResults.linkedinConnections, searchResults.websiteUrl, searchResults.notableInfo,
                        searchResults.pressMentions, vipScore, influenceLevel,
                        JSON.stringify(searchResults.rawResults), guestId
                    );
                } else {
                    db.prepare(`
            INSERT INTO research_results (
              guest_id, profile_photo_url, job_title, company_name, company_size,
              industry, linkedin_url, linkedin_connections, website_url,
              notable_info, press_mentions, vip_score, influence_level, raw_search_results
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
                        guestId, searchResults.profilePhotoUrl, searchResults.jobTitle, searchResults.companyName,
                        searchResults.companySize, searchResults.industry, searchResults.linkedinUrl,
                        searchResults.linkedinConnections, searchResults.websiteUrl, searchResults.notableInfo,
                        searchResults.pressMentions, vipScore, influenceLevel, JSON.stringify(searchResults.rawResults)
                    );
                }

                results.completed++;

                // Delay between requests (quality over speed)
                await new Promise(resolve => setTimeout(resolve, 10000));

            } catch (guestError) {
                results.errors.push({ guestId, error: guestError.message });
            }
        }

        res.json(results);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/research/:guestId - Get research results for a guest
router.get('/:guestId', (req, res) => {
    try {
        const { guestId } = req.params;

        const research = db.prepare('SELECT * FROM research_results WHERE guest_id = ?').get(guestId);

        if (!research) {
            return res.status(404).json({ error: 'Geen research gevonden' });
        }

        // Parse linkedin_candidates if it exists
        if (research.linkedin_candidates) {
            try {
                research.linkedin_candidates = JSON.parse(research.linkedin_candidates);
            } catch (e) {
                research.linkedin_candidates = [];
            }
        }

        res.json(research);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/research/:guestId/select-linkedin - Select a LinkedIn profile from candidates
router.put('/:guestId/select-linkedin', (req, res) => {
    try {
        const { guestId } = req.params;
        const { candidateIndex } = req.body;

        const research = db.prepare('SELECT * FROM research_results WHERE guest_id = ?').get(guestId);

        if (!research) {
            return res.status(404).json({ error: 'Geen research gevonden' });
        }

        // Parse candidates
        let candidates = [];
        try {
            candidates = JSON.parse(research.linkedin_candidates || '[]');
        } catch (e) {
            return res.status(400).json({ error: 'Geen LinkedIn kandidaten beschikbaar' });
        }

        if (candidateIndex < 0 || candidateIndex >= candidates.length) {
            return res.status(400).json({ error: 'Ongeldige kandidaat index' });
        }

        const selectedCandidate = candidates[candidateIndex];

        // Update research with selected LinkedIn profile
        db.prepare(`
            UPDATE research_results SET
                linkedin_url = ?,
                profile_photo_url = ?,
                job_title = COALESCE(?, job_title),
                needs_linkedin_review = 0,
                updated_at = CURRENT_TIMESTAMP
            WHERE guest_id = ?
        `).run(
            selectedCandidate.url,
            selectedCandidate.thumbnail,
            selectedCandidate.jobTitle,
            guestId
        );

        res.json({
            success: true,
            message: 'LinkedIn profiel geselecteerd',
            selected: selectedCandidate
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
