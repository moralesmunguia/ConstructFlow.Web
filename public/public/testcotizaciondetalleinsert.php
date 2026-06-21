<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../bootstrap.php';

$_SERVER['HTTP_AUTHORIZATION'] =
'Bearer TU_TOKEN';

/*
|--------------------------------------------------------------------------
| PARTIDA
|--------------------------------------------------------------------------
*/

$_POST['CotizacionID'] = 1;

$_POST['ConceptoID'] = null;

$_POST['Concepto'] =
'SUMINISTRO DE TABLAROCA';

$_POST['Descripcion'] =
'Suministro e instalación de muro de tablaroca a dos caras.';

$_POST['Unidad'] =
'M2';

$_POST['Cantidad'] =
50;

$_POST['PrecioUnitario'] =
850;

$_POST['Descuento'] =
0;

$_POST['Comentarios'] =
'Incluye materiales y mano de obra';

$_POST['OrdenVisual'] =
1;

$controller =
    new \App\Controllers\CotizacionDetalleController();

$controller->store();