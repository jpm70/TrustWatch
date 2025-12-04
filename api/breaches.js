// api/breaches.js (Código CORREGIDO para Vercel)

// 🛑 IMPORTANTE: Eliminamos 'import fetch from "node-fetch";'
// y usamos el 'fetch' nativo de Node.js, que Vercel soporta.

// La API real de brechas.
const XPOSED_API_URL = "https://exposedornot.com/api/v1/search";

export default async (req, res) => {
    
    // =======================================================
    // 🛑 Encabezados CORS y manejo de OPTIONS
    // =======================================================
    res.setHeader('Access-Control-Allow-Origin', '*'); // Permitir acceso desde cualquier origen
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        // Manejar la petición "preflight"
        return res.status(200).end();
    }
    // =======================================================
    
    const { email } = req.query; 

    if (!email) {
        return res.status(400).json({ error: "Missing email parameter" });
    }

    const searchUrl = `${XPOSED_API_URL}/${encodeURIComponent(email)}`;

    try {
        // Usamos el fetch global (nativo) de Node
        const response = await fetch(searchUrl, {
            method: 'GET',
            headers: { 
                "Accept": "application/json",
            }
        });
        
        const data = await response.json();
        // Devolvemos el status code que la API real nos dio (200 o 404, etc.)
        res.status(response.status).json(data);

    } catch (error) {
        console.error("Proxy Runtime Error:", error);
        res.status(500).json({ error: "Internal Proxy Error while executing function." });
    }
};
