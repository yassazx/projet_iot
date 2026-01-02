const express = require('express');
const router = express.Router();

// Groq Cloud API endpoint
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Recommend drone parts using LLaMA via Groq
router.post('/parts', async (req, res) => {
    try {
        const GROQ_API_KEY = process.env.GROQ_API_KEY;

        if (!GROQ_API_KEY) {
            return res.status(500).json({
                error: 'GROQ_API_KEY not configured',
                message: 'Ajoutez GROQ_API_KEY dans le fichier .env'
            });
        }

        const {
            prototypeName,
            weight,
            maxMotorSpeed,
            batteryCapacity,
            flightTime,
            maxAltitude,
            numberOfMotors,
            frameMaterial,
            hasGPS,
            droneAge
        } = req.body;

        // Create compact prompt for LLaMA (optimized for fewer tokens)
        const prompt = `Drone specs:
- Nom: ${prototypeName}
- Poids: ${weight}g, Moteur max: ${maxMotorSpeed}RPM
- Batterie: ${batteryCapacity}mAh, Vol: ${flightTime}min
- Alt max: ${maxAltitude}m, Moteurs: ${numberOfMotors}
- Châssis: ${frameMaterial}, GPS: ${hasGPS ? 'Oui' : 'Non'}, Âge: ${droneAge} mois

Recommande des pièces RÉELLES du marché. Format JSON strict:
{
  "motor": "Modèle + specs",
  "esc": "Modèle + specs", 
  "controller": "Modèle",
  "battery": "Type + specs",
  "propellers": "Taille + matériau",
  "frame": "Recommandation",
  "sensors": "Liste courte"
}
Réponse JSON uniquement, pas de texte.`;

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                messages: [
                    {
                        role: 'system',
                        content: 'Expert drones. Réponds uniquement en JSON valide, sans markdown.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.5,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Groq API Error:', errorData);
            return res.status(response.status).json({
                error: 'Groq API error',
                details: errorData
            });
        }

        const data = await response.json();
        const recommendation = data.choices[0]?.message?.content || 'Aucune recommandation disponible';

        // Parse recommendation into structured format
        const parts = parseRecommendation(recommendation);

        res.json({
            success: true,
            recommendation: {
                raw: recommendation,
                parts: parts,
                model: data.model,
                usage: data.usage
            }
        });

    } catch (error) {
        console.error('Recommendation error:', error);
        res.status(500).json({
            error: 'Failed to get recommendation',
            message: error.message
        });
    }
});

// Parse JSON response from LLaMA
function parseRecommendation(text) {
    try {
        // Try to extract JSON from response (handle markdown code blocks)
        let jsonStr = text.trim();
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
        }

        const parsed = JSON.parse(jsonStr);
        return {
            motor: parsed.motor || null,
            esc: parsed.esc || null,
            flightController: parsed.controller || null,
            battery: parsed.battery || null,
            propellers: parsed.propellers || null,
            frame: parsed.frame || null,
            sensors: parsed.sensors || null
        };
    } catch (e) {
        console.error('JSON parse error, falling back to text parsing:', e.message);
        // Fallback to basic text extraction
        return {
            motor: extractSimple(text, 'motor'),
            esc: extractSimple(text, 'esc'),
            flightController: extractSimple(text, 'controller'),
            battery: extractSimple(text, 'battery'),
            propellers: extractSimple(text, 'propellers'),
            frame: extractSimple(text, 'frame'),
            sensors: extractSimple(text, 'sensors')
        };
    }
}

function extractSimple(text, key) {
    const regex = new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`, 'i');
    const match = text.match(regex);
    return match ? match[1] : null;
}

module.exports = router;
