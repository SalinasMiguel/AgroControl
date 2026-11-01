package com.agrocontrol.insumo.domain;

// De quién se compró y con qué factura; todo opcional.
public record DocumentoCompra(String proveedor, String numeroFactura) {

    public static final DocumentoCompra VACIO = new DocumentoCompra(null, null);

    public DocumentoCompra {
        proveedor = limpiar(proveedor);
        numeroFactura = limpiar(numeroFactura);
    }

    private static String limpiar(String texto) {
        return texto == null || texto.isBlank() ? null : texto.trim();
    }
}
