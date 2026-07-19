/**
 * login.js
 * Ref: DEF-WEB-001 sección 11 (Flujo) y sección 12 (API)
 *
 * Flujo:
 *  1. Validar campos en cliente.
 *  2. POST a ConstructFlow.Api -> /api/v1/auth/login
 *  3. La API regresa { success, message, data: { token, usuario, empresaId, roles, permisos } }
 *  4. Se envía ese resultado a un "bridge" PHP local (auth-bridge.php) que arma la $_SESSION,
 *     porque el JWT vive en el navegador pero el front (index.php) valida sesión de PHP.
 *  5. Redirect a index.php (dashboard).
 */

const API_BASE_URL = 'http://localhost:8081/ConstructFlow.Api/public'; // URL real confirmada en Postman
const BRIDGE_URL    = '../../../auth-bridge.php';                      // endpoint puente en ConstructFlow.Web

document.addEventListener('DOMContentLoaded', () => {

    const form        = document.getElementById('loginForm');
    const btnLogin     = document.getElementById('btnLogin');
    const inputUsuario = document.getElementById('usuario');
    const inputPassword = document.getElementById('password');
    const togglePass    = document.getElementById('togglePass');

    // Mostrar / ocultar contraseña
    togglePass?.addEventListener('click', () => {
        const isPassword = inputPassword.type === 'password';
        inputPassword.type = isPassword ? 'text' : 'password';
        togglePass.querySelector('i').className = isPassword ? 'bi bi-eye-slash' : 'bi bi-eye';
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        limpiarErrores();

        const usuario  = inputUsuario.value.trim();
        const password = inputPassword.value;
        const recordar = document.getElementById('remember')?.checked ?? false;

        // ---- Validación cliente ----
        let valido = true;
        if (!usuario) {
            mostrarError(inputUsuario, 'Ingresa tu usuario o correo electrónico.');
            valido = false;
        }
        if (!password) {
            mostrarError(inputPassword, 'Ingresa tu contraseña.');
            valido = false;
        }
        if (!valido) return;

        setLoading(true);

        try {
            // ---- POST a la API ----
            // AuthController::login espera 'correo' (o 'usuario'/'email'/'username' como fallback)
            const response = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
                correo: usuario,
                password: password
            });

            const body = response.data;

            if (!body.success) {
                await Swal.fire({
                    icon: 'error',
                    title: 'No se pudo iniciar sesión',
                    text: body.message || 'Verifica tus credenciales e intenta de nuevo.'
                });
                setLoading(false);
                return;
            }

            // AuthService::getSesion() regresa todo plano en data (no anidado en "usuario")
            const {
                UsuarioID, EmpresaID, Nombre, Correo, Perfil,
                Roles, Permisos, Menu, Token
            } = body.data;

            // ---- Guardar sesión PHP vía bridge ----
            const bridgeResp = await axios.post(BRIDGE_URL, {
                token: Token,
                usuario: { UsuarioID, Nombre, Correo, Perfil },
                empresaId: EmpresaID,
                roles: Roles,
                permisos: Permisos,
                menu: Menu,
                recordar
            });

            if (!bridgeResp.data.success) {
                throw new Error(bridgeResp.data.message || 'No se pudo iniciar la sesión local.');
            }

            // ---- Guardar JWT en cliente (para llamadas futuras vía Axios) ----
            const storage = recordar ? localStorage : sessionStorage;
            storage.setItem('cf_token', Token);

            window.location.href = '../../../index.php';

        } catch (error) {
            console.error('Error en login:', error);

            const mensaje = error.response?.data?.message
                || 'Ocurrió un error al conectar con el servidor. Intenta nuevamente.';

            await Swal.fire({
                icon: 'error',
                title: 'Error de autenticación',
                text: mensaje
            });
        } finally {
            setLoading(false);
        }
    });

    function mostrarError(input, mensaje) {
        input.classList.add('is-invalid');
        const contenedor = input.closest('.form-group');
        const errorDiv = contenedor?.querySelector('.field-error');
        if (errorDiv) errorDiv.textContent = mensaje;
    }

    function limpiarErrores() {
        document.querySelectorAll('.form-group input').forEach(i => i.classList.remove('is-invalid'));
        document.querySelectorAll('.field-error').forEach(e => e.textContent = '');
    }

    function setLoading(loading) {
        btnLogin.disabled = loading;
        btnLogin.innerHTML = loading
            ? '<span class="spinner-border spinner-border-sm"></span> Ingresando...'
            : '<i class="bi bi-box-arrow-in-right"></i> Iniciar sesión';
    }
});
