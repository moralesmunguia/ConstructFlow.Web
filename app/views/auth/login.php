<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Iniciar sesión · ConstructFlow</title>

<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
<link rel="stylesheet" href="../../../public/css/login.css">
</head>
<body>

<div class="login-wrap">

    <!-- ===================== PANEL IZQUIERDO: MARCAS ===================== -->
    <section class="login-left">

        <div class="brand-header">
            <img src="../../../public/img/LogoConstructFlow.png" alt="ConstructFlow" class="cf-badge">
            <div class="cf-text">
                <span class="cf-name">CONSTRUCT<b>FLOW</b></span>
                <span class="cf-tag">Control total de tus proyectos</span>
            </div>
        </div>

        <img src="../../../public/img/logo_ROM.jpg" alt="ROM Constructora" class="rom-logo">

        <p class="left-desc">Plataforma para la gestión integral de proyectos de construcción y mantenimiento.</p>

        <div class="benefit-list">
            <div class="benefit-item">
                <div class="icon"><i class="bi bi-bar-chart-fill"></i></div>
                <span>Control total de tus proyectos</span>
            </div>
            <div class="benefit-item">
                <div class="icon"><i class="bi bi-clock-fill"></i></div>
                <span>Información en tiempo real</span>
            </div>
            <div class="benefit-item">
                <div class="icon"><i class="bi bi-people-fill"></i></div>
                <span>Equipos más productivos</span>
            </div>
        </div>

        <div class="left-spacer"></div>

        <div class="dev-by">
            <span>Desarrollado por:</span>
            <img src="../../../public/img/Logo.png" alt="CORA Soluciones Digitales">
        </div>

        <footer class="left-footer">
            <span><i class="bi bi-tag"></i> Versión Web 1.0.1</span>           
        </footer>
    </section>

    <!-- ===================== PANEL CENTRAL: FOTO DIAGONAL ===================== -->
    <section class="login-photo">
        <img src="../../../public/img/portadaweb.png" alt="ConstructFlow en obra">
    </section>

    <!-- ===================== PANEL DERECHO: LOGIN ===================== -->
    <section class="login-panel">
        <div class="login-card">

            <div class="lock-icon">
                <i class="bi bi-lock-fill" style="font-size:1.5rem;color:#F97316;"></i>
            </div>

            <h2>Iniciar sesión</h2>
            <p class="welcome">Bienvenido a <b>ConstructFlow</b></p>

            <form id="loginForm" novalidate>

                <div class="form-group">
                    <label for="usuario">Usuario o correo electrónico</label>
                    <div class="input-icon">
                        <i class="bi bi-person"></i>
                        <input type="text" id="usuario" name="usuario" placeholder="Ingresa tu usuario o correo" autocomplete="username">
                    </div>
                    <div class="field-error"></div>
                </div>

                <div class="form-group">
                    <label for="password">Contraseña</label>
                    <div class="input-icon">
                        <i class="bi bi-shield-lock"></i>
                        <input type="password" id="password" name="password" placeholder="Ingresa tu contraseña" autocomplete="current-password">
                        <button type="button" id="togglePass" class="toggle-pass"><i class="bi bi-eye"></i></button>
                    </div>
                    <div class="field-error"></div>
                </div>

                <div class="form-row">
                    <label class="remember">
                        <input type="checkbox" id="remember"> Recordarme
                    </label>
                    <a href="#">¿Olvidaste tu contraseña?</a>
                </div>

                <button type="submit" id="btnLogin" class="btn-login">
                    <i class="bi bi-box-arrow-in-right"></i> Iniciar sesión
                </button>
            </form>

            <div class="divider">o continúa con</div>

            <div class="help-row">
                <a href="#"><i class="bi bi-question-circle"></i> Centro de ayuda</a>
                <a href="#"><i class="bi bi-headset"></i> Soporte</a>
            </div>
        </div>
    </section>

</div>

<script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script src="../../../public/js/login.js"></script>
</body>
</html>
