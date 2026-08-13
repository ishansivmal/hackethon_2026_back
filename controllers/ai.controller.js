const pdfParse = require("pdf-parse/lib/pdf-parse.js");

const {
    Internship,
    Job,
    AppliedInternship,
    AppliedJob,
    User
} = require("../models");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

// Maximum number of candidates scored in a single request (keeps the prompt
// well inside the model's context window).
const MAX_CANDIDATES = 15;

// How much CV text is sent per candidate.
const CV_CHAR_LIMIT = 6000;

// Simple in-memory cache so a company doesn't burn API calls re-ranking the
// same listing over and over. Entries expire after CACHE_TTL_MS.
const CACHE_TTL_MS = 15 * 60 * 1000;
const rankCache = new Map();

const SYSTEM_PROMPT = [
    "You are a senior technical recruiter with deep expertise in evaluating resumes against job requirements.",
    "Your task is to objectively score and rank candidates based ONLY on how well their CV matches the provided listing's requirements.",
    "Be fair and data-driven: match skills, experience, education and keywords, but do not invent facts about a candidate.",
    "Candidates with little or no CV text must receive lower scores than candidates with clearly relevant profiles.",
    "Return ONLY valid JSON, no markdown, no commentary. Use the exact shape described by the user."
].join(" ");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const callGroq = async (messages) => {
    const response = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            temperature: 0.2,
            response_format: { type: "json_object" },
            messages
        })
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Groq API error (${response.status}): ${body}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? "";
};

const download = async (url) => {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to download CV (${response.status})`);
    }

    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer);
};

const extractPdfText = async (buffer) => {
    const result = await pdfParse(buffer);
    return (result.text || "").replace(/\s+/g, " ").trim();
};

const buildPrompt = (typeLabel, listing, candidates) => {
    const requirements = listing.requirements || "Not specified";
    const description = listing.description || "";

    const candidateBlock = candidates
        .map((c, index) => {
            const cv = c.cv ? `\nCV TEXT:\n${c.cv}` : "\nCV TEXT: (empty — candidate did not provide a readable CV)";
            return `--- CANDIDATE ${index + 1} (id: ${c.id}) ---\nName: ${c.name} (${c.email})${cv}`;
        })
        .join("\n\n");

    return [
        `LISTING TYPE: ${typeLabel}`,
        `TITLE: ${listing.title}`,
        `DESCRIPTION: ${description}`,
        `REQUIREMENTS:\n${requirements}`,
        "",
        "CANDIDATES TO RANK:",
        candidateBlock,
        "",
        `Score every candidate from 0 to 100 based on their fit for the ${typeLabel} above.`,
        "Return a JSON object with exactly one key: \"candidates\", an array of objects.",
        "Each object MUST have these keys:",
        "  \"id\": the numeric candidate id shown in the CANDIDATE header",
        "  \"name\": the candidate's name",
        "  \"score\": integer 0-100 representing overall match quality",
        "  \"summary\": one or two sentences explaining the verdict",
        "  \"strengths\": array of 2-4 short strings of matching skills/experience",
        "  \"weaknesses\": array of 1-3 short strings of missing skills/concerns",
        "  \"recommendation\": one of \"Shortlisted\", \"Consider\" or \"Reject\"",
        "Sort the array by score, highest first. Include every candidate exactly once."
    ].join("\n");
};

const normalizeResults = (content) => {
    let text = String(content || "").trim();

    // Strip markdown code fences if the model wraps the JSON.
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) text = fenced[1].trim();

    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
        throw new Error("Groq response did not contain a JSON object");
    }

    const parsed = JSON.parse(text.slice(start, end + 1));
    const candidates = Array.isArray(parsed.candidates) ? parsed.candidates : [];

    return candidates
        .map((c) => ({
            id: Number(c.id),
            name: c.name || "Unknown",
            score: Math.max(0, Math.min(100, Math.round(Number(c.score) || 0))),
            summary: c.summary || "",
            strengths: Array.isArray(c.strengths) ? c.strengths : [],
            weaknesses: Array.isArray(c.weaknesses) ? c.weaknesses : [],
            recommendation: c.recommendation || "Consider"
        }))
        .filter((c) => Number.isInteger(c.id))
        .sort((a, b) => b.score - a.score);
};

// ---------------------------------------------------------------------------
// Rank applicants for a single listing owned by the authenticated company
// ---------------------------------------------------------------------------

const rankApplicants = async (req, res) => {
    try {
        if (!GROQ_API_KEY) {
            return res.status(500).json({ message: "GROQ_API_KEY is not configured on the server" });
        }

        const { type, id } = req.params;
        const listingId = Number.parseInt(id, 10);

        const configs = {
            internship: {
                label: "internship",
                model: Internship,
                idKey: "id",
                titleKey: "title",
                descriptionKey: "description",
                requirementsKey: "requirements",
                applicationModel: AppliedInternship,
                appIdKey: "applied_internship_ID"
            },
            job: {
                label: "job",
                model: Job,
                idKey: "job_ID",
                titleKey: "position",
                descriptionKey: null,
                requirementsKey: "requirements",
                applicationModel: AppliedJob,
                appIdKey: "applied_job_ID"
            }
        };

        const config = configs[type];

        if (!config || !Number.isInteger(listingId)) {
            return res.status(400).json({ message: "Invalid application type" });
        }

        const cacheKey = `${type}:${listingId}`;
        const cached = rankCache.get(cacheKey);

        if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
            return res.status(200).json({ ...cached.data, cached: true });
        }

        const listing = await config.model.findOne({
            where: { [config.idKey]: listingId, user_ID: req.user.id },
            include: [{
                model: config.applicationModel,
                as: "applications",
                include: [{
                    model: User,
                    as: "user",
                    attributes: ["id", "name", "email"]
                }]
            }]
        });

        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }

        const applications = (listing.applications ?? []).filter((app) => app.cv_url);

        if (applications.length === 0) {
            return res.status(400).json({
                message: "No CVs available to rank for this listing yet"
            });
        }

        const capped = applications.slice(0, MAX_CANDIDATES);
        const truncated = applications.length > MAX_CANDIDATES;

        // Download + parse every CV so the model can compare actual content.
        const candidates = [];

        for (const app of capped) {
            let cv = "";

            try {
                const buffer = await download(app.cv_url);
                cv = await extractPdfText(buffer);
            } catch (error) {
                console.error(`Failed to parse CV for application ${app[config.appIdKey]}:`, error.message);
                cv = "";
            }

            candidates.push({
                id: app[config.appIdKey],
                name: app.user?.name || "Unknown",
                email: app.user?.email || "",
                cv: cv.slice(0, CV_CHAR_LIMIT)
            });
        }

        const listingTitle = listing[config.titleKey] || "Untitled";
        const description = config.descriptionKey ? (listing[config.descriptionKey] || "") : "";

        const prompt = buildPrompt(
            config.label,
            { title: listingTitle, description, requirements: listing[config.requirementsKey] },
            candidates
        );

        const content = await callGroq([
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt }
        ]);

        const rankedCandidates = normalizeResults(content);

        const payload = {
            type,
            listing: { id: listing[config.idKey], title: listingTitle },
            truncated,
            candidates: rankedCandidates
        };

        rankCache.set(cacheKey, { at: Date.now(), data: payload });

        return res.status(200).json({ ...payload, cached: false });

    } catch (error) {
        console.error("AI ranking error:", error);
        return res.status(500).json({ message: "AI ranking failed. Please try again." });
    }
};

module.exports = { rankApplicants };
