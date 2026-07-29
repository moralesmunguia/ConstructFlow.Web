/**
 * calendario-laboral.js
 * Ref: DEF-WEB-003 (PRO-020 - Calendario laboral)
 *
 * Configuración > Calendario Laboral: lee y guarda si Sábado/Domingo
 * cuentan como días laborables para la Empresa en sesión. Antes no
 * existía esta pantalla; el flag se cambiaba por UPDATE directo a BD.
 */
(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        cargarConfiguracion();

        document.getElementById('btnGuardarCalendarioLaboral')
            ?.addEventListener('click', guardarConfiguracion);
    });

    async function cargarConfiguracion() {
        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/calendario-laboral`);
            if (!resp.data.success) return;

            document.getElementById('cfSabadoLaboral').checked = !!resp.data.data.SabadoLaboral;
            document.getElementById('cfDomingoLaboral').checked = !!resp.data.data.DomingoLaboral;

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible cargar la configuración de calendario laboral.' });
        }
    }

    async function guardarConfiguracion() {
        const payload = {
            SabadoLaboral: document.getElementById('cfSabadoLaboral').checked,
            DomingoLaboral: document.getElementById('cfDomingoLaboral').checked
        };

        try {
            const resp = await axios.put(`${CF_API_BASE_URL}/calendario-laboral`, payload);

            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo guardar', text: resp.data.message || '' });
            }

            Swal.fire({ icon: 'success', title: 'Configuración guardada', timer: 1300, showConfirmButton: false });

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible guardar la configuración.' });
        }
    }
})();
