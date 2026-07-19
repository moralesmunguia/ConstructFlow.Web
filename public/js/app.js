/**
 * app.js
 * Lógica general del shell privado.
 * Ref: DEF-WEB-000 sección 21 (formato estándar de integración API).
 *
 * Responsabilidad:
 *  - Adjuntar automáticamente el JWT (guardado en login.js) a toda
 *    petición Axios dirigida a ConstructFlow.Api.
 *  - Si la API responde 401 (token vencido/ inválido), limpiar la
 *    sesión local y regresar al login.
 */

function cfGetToken() {
    return localStorage.getItem('cf_token') || sessionStorage.getItem('cf_token');
}

axios.interceptors.request.use((config) => {
    const token = cfGetToken();
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('cf_token');
            sessionStorage.removeItem('cf_token');
            window.location.href = `${CF_BASE_URL}/app/views/auth/login.php?motivo=sesion_expirada`;
        }
        return Promise.reject(error);
    }
);
