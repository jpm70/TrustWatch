// api/headers.js
// Proxy para escanear cabeceras de seguridad de una URL
// Verifica HSTS, CSP, X-Frame-Options, etc.

export default async (req, res) => {
    
    // Configuración CORS
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // La URL debe venir como parámetro de consulta (query parameter)
    const url = req.query.url; 

    if (!url) {
        return res.status(400).json({ error: "Missing url query parameter." });
    }
    
    // Nos aseguramos de que la URL tenga un protocolo para la petición fetch
    let fullUrl = url.startsWith('http') ? url : `https://${url}`;

    try {
        // Hacemos una petición HEAD o GET con el método 'manual' para no seguir redirecciones infinitas
        // Optamos por GET con un timeout bajo para obtener la respuesta final, pero solo procesamos cabeceras.
        const response = await fetch(fullUrl, {
            method: 'GET',
            redirect: 'follow',
            timeout: 5000 // 5 segundos de timeout
        });
        
        // 1. Obtener las cabeceras de respuesta
        const headers = response.headers;
        
        // 2. Definir las cabeceras de seguridad a buscar
        const securityHeaders = {
            'Strict-Transport-Security': { required: true, description: 'Fuerza HTTPS después de la primera visita.' },
            'Content-Security-Policy': { required: true, description: 'Previene la inyección de código (XSS) y Clickjacking.' },
            'X-Content-Type-Options': { required: true, description: 'Previene el "MIME-type sniffing". Debe ser "nosniff".' },
            'X-Frame-Options': { required: true, description: 'Previene Clickjacking. Debe ser "DENY" o "SAMEORIGIN".' },
            'Referrer-Policy': { required: false, description: 'Controla qué información se envía con las peticiones externas.' },
            'Permissions-Policy': { required: false, description: 'Reemplaza a Feature-Policy para controlar el acceso a APIs del navegador.' }
        };
        
        let headerResults = {};
        let score = 0;
        const totalRequired = 4; // HSTS, CSP, X-Content-Type-Options, X-Frame-Options

        // 3. Analizar cada cabecera
        for (const [key, value] of Object.entries(securityHeaders)) {
            const headerValue = headers.get(key.toLowerCase());
            
            if (headerValue) {
                // Cabecera encontrada
                headerResults[key] = {
                    status: 'PRESENT',
                    value: headerValue,
                    description: value.description
                };
                if (value.required) score++;
                
                // Verificaciones de valor específicas
                if (key === 'X-Content-Type-Options' && headerValue.toLowerCase() !== 'nosniff') {
                    headerResults[key].status = 'MISCONFIGURED';
                    if (value.required) score--; // Restar si estaba mal configurada
                }
                
                if (key === 'X-Frame-Options' && !['deny', 'sameorigin'].includes(headerValue.toLowerCase())) {
                    headerResults[key].status = 'MISCONFIGURED';
                    if (value.required) score--; // Restar si estaba mal configurada
                }
            } else if (value.required) {
                // Cabecera faltante
                headerResults[key] = {
                    status: 'MISSING',
                    value: 'N/A',
                    description: value.description
                };
            } else {
                // Cabecera opcional faltante
                 headerResults[key] = {
                    status: 'OPTIONAL_MISSING',
                    value: 'N/A',
                    description: value.description
                };
            }
        }
        
        // 4. Calcular el porcentaje de seguridad
        const securityPercentage = Math.round((score / totalRequired) * 100);
        
        res.status(200).json({ 
            url: fullUrl,
            status: response.status,
            ok: response.ok,
            redirected: response.redirected,
            results: headerResults,
            score: securityPercentage 
        });

    } catch (error) {
        console.error("Proxy Network/Execution Error:", error);
        res.status(500).json({ error: "Proxy failed to execute the request or network error occurred.", details: error.message });
    }
};