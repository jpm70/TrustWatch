// api/breaches.js (Versión para Have I Been Pwned - HIBP)

// La URL de la API de HIBP (Requiere que el email esté en el PATH)
const HIBP_API_URL = "https://haveibeenpwned.com/api/v3/breachedaccount/";

export default async (req, res) => {
    
    // ... (Configuración CORS y manejo de OPTIONS: Esto se mantiene igual)
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json'); // Aseguramos que la respuesta es JSON

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const { email } = req.query; 

    if (!email) {
        return res.status(400).json({ error: "Missing email parameter" });
    }

    // 🛑 CAMBIO CLAVE: Construcción de la URL de HIBP
    const searchUrl = `${HIBP_API_URL}${encodeURIComponent(email)}?truncateResponse=true`; 

    try {
        // Petición al API de HIBP (desde Vercel)
        const response = await fetch(searchUrl, {
            method: 'GET',
            headers: { 
                "User-Agent": "TrustWatch-App-Proxy", // HIBP requiere un User-Agent identificable
                "Accept": "application/json",
            }
        });
        
        // La API de HIBP usa 404 para NO ENCONTRADO (lo cual es un ÉXITO)
        if (response.status === 404) {
             return res.status(200).json({ status: 404, message: "Email not found in breaches." });
        }
        
        const responseBody = await response.text(); 
        
        if (response.status !== 200) {
            // Si devuelve cualquier otro código (ej. 400, 403, 429), es un error real.
            console.error(`HIBP API returned status ${response.status}`);
            return res.status(502).json({ 
                error: `HIBP API returned status ${response.status}.`,
                external_message: responseBody.substring(0, 500)
            });
        }
        
        // Intentar parsear el JSON (solo si el status es 200)
        let data = JSON.parse(responseBody);
        
        // Devolver la respuesta exitosa al frontend
        res.status(200).json(data);

    } catch (error) {
        console.error("Proxy Network/Execution Error:", error);
        res.status(500).json({ error: "Proxy failed to execute the request or network error occurred." });
    }
};
