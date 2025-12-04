// api/breaches.js (Versión Final con ExposedOrNot - Endpoint Alternativo)

// 🛑 CAMBIO CLAVE: Usamos el endpoint '/api/v1/user' en lugar de '/api/v1/search'
const XPOSED_API_URL = "https://exposedornot.com/api/v1/user";

export default async (req, res) => {
    
    // ... (Configuración CORS y manejo de OPTIONS: Se mantiene igual)
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const { email } = req.query; 

    if (!email) {
        return res.status(400).json({ error: "Missing email parameter" });
    }

    // 🛑 Construcción de la URL: Usaremos el email como parte del PATH (la ruta)
    // Ya que es el formato más común para los endpoints de 'user'.
    const searchUrl = `${XPOSED_API_URL}/${encodeURIComponent(email)}`; 

    try {
        // Petición al API externo (desde Vercel)
        const response = await fetch(searchUrl, {
            method: 'GET',
            headers: { 
                "Accept": "application/json",
            }
        });
        
        const responseBody = await response.text(); 
        
        // La API de ExposedOrNot devuelve 200 con datos o 404 si NO encuentra brechas.
        if (response.status === 404) {
             // 404 es un éxito, significa que no se encontraron brechas.
             return res.status(200).json({ status: 404, message: "Email not found in breaches." });
        }
        
        if (response.status !== 200) {
            // Si devuelve cualquier otro código (ej. 403, 500, etc.), es un error real.
            console.error(`External API returned status ${response.status}`);
            return res.status(502).json({ 
                error: `External API returned status ${response.status}.`,
                external_message: responseBody.substring(0, 500)
            });
        }
        
        // Intentar parsear el JSON (solo si el status es 200)
        let data = JSON.parse(responseBody);
        
        // Devolver la respuesta exitosa al frontend
        res.status(200).json(data);

    } catch (error) {
        // Error de red/conexión. Aquí entraría el error "Proxy failed to execute..."
        console.error("Proxy Network/Execution Error:", error);
        res.status(500).json({ error: "Proxy failed to execute the request or network error occurred." });
    }
};
