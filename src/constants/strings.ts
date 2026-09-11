export const STRINGS = {
  // Marca y Cabecera
  APP_NAME: 'DelaySpend',
  APP_TAGLINE: 'Cada gasto que evitás vale tanto como lo que gastás.',
  EXPORT_BUTTON: 'Rendición / Exportar',

  // Filtros de Período
  FILTER_CURRENT_MONTH: 'Este mes',
  FILTER_PREVIOUS_MONTH: 'Mes anterior',
  FILTER_ALL: 'Todo el historial',

  // Dashboard y Métricas
  METRICS_REAL_TITLE: 'Total Gastado',
  METRICS_REAL_SUBTITLE: 'Plata que salió de tu bolsillo',
  METRICS_DELAYED_TITLE: 'Total Guardado',
  METRICS_DELAYED_SUBTITLE: 'Compras que decidiste evitar',
  METRICS_TRANSFER_TITLE: 'Monto a Transferir',
  METRICS_TRANSFER_SUBTITLE: 'Para mover de NX a tu cuenta de ahorro',
  METRICS_TRANSFER_ACTION: 'Ya lo transferí',
  METRICS_TRANSFER_SUCCESS: '¡Estás al día con tu ahorro! 🚀',
  METRICS_ACCOUNTED_LABEL: 'Rendición Total (Gastado + Ahorrado):',

  // Formulario de Carga
  FORM_TITLE_ADD: 'Nuevo Registro',
  FORM_TITLE_EDIT: 'Editar Registro',
  FORM_TYPE_REAL: 'Gasto Real',
  FORM_TYPE_DELAYED: 'Compra Delayeada',
  FORM_TYPE_REAL_DESC: 'Plata que ya pagaste',
  FORM_TYPE_DELAYED_DESC: 'Ibas a comprarlo y te frenaste',
  FORM_AMOUNT_LABEL: 'Monto en pesos',
  FORM_AMOUNT_PLACEHOLDER: '0',
  FORM_CATEGORY_LABEL: 'Categoría',
  FORM_DESCRIPTION_LABEL: 'Concepto o detalle',
  FORM_DESCRIPTION_PLACEHOLDER: 'Ej: Café al paso, Buzo en rebaja, Delivery...',
  FORM_DATE_LABEL: 'Fecha',
  FORM_SUBMIT_REAL: 'Registrar gasto',
  FORM_SUBMIT_DELAYED: '¡Delayear y guardar!',
  FORM_SUBMIT_EDIT: 'Guardar cambios',
  FORM_CANCEL: 'Cancelar',

  // Historial y Listado
  HISTORY_TITLE: 'Movimientos',
  HISTORY_EMPTY_TITLE: 'No hay movimientos en este período',
  HISTORY_EMPTY_DESC: 'Tocá el botón (+) para registrar tu primer gasto o una compra que hayas delayeado.',
  HISTORY_TODAY: 'Hoy',
  HISTORY_YESTERDAY: 'Ayer',
  HISTORY_BADGE_REAL: 'Gasto',
  HISTORY_BADGE_DELAYED: 'Delayeado',
  HISTORY_BADGE_TRANSFERRED: 'Ahorro transferido',
  HISTORY_ACTION_EDIT: 'Editar',
  HISTORY_ACTION_DELETE: 'Eliminar',
  HISTORY_ACTION_MARK_TRANSFERRED: 'Marcar como transferido',
  HISTORY_ACTION_UNMARK_TRANSFERRED: 'Desmarcar transferencia',

  // Acciones Destructivas y Modales de Confirmación
  CONFIRM_DELETE_TITLE: '¿Eliminar este movimiento?',
  CONFIRM_DELETE_MSG: 'Esta acción no se puede deshacer. Se descontará del historial y de los cálculos.',
  CONFIRM_DELETE_BUTTON: 'Sí, eliminar',
  CONFIRM_DELETE_CANCEL: 'No, conservar',

  CONFIRM_TRANSFER_ALL_TITLE: '¿Confirmás la transferencia?',
  CONFIRM_TRANSFER_ALL_MSG: 'Vamos a marcar todos tus gastos delayeados pendientes como transferidos a tu cuenta de ahorro. El contador volverá a $0.',
  CONFIRM_TRANSFER_ALL_BUTTON: 'Confirmar transferencia',
  CONFIRM_TRANSFER_ALL_CANCEL: 'Todavía no',

  CONFIRM_RESET_TITLE: '¿Borrar todos los datos de la app?',
  CONFIRM_RESET_MSG: 'Se eliminarán definitivamente todos los gastos cargados en este dispositivo. Te recomendamos exportar antes.',
  CONFIRM_RESET_BUTTON: 'Borrar todo',
  CONFIRM_RESET_CANCEL: 'Volver',

  // Panel de Rendición y Exportación
  EXPORT_TITLE: 'Rendición de Cuentas',
  EXPORT_SUBTITLE: 'Generá un resumen claro para mandarle a tus padres o guardar como comprobante.',
  EXPORT_TAB_WHATSAPP: 'Para WhatsApp',
  EXPORT_TAB_CSV: 'Archivo CSV (Excel)',
  EXPORT_WHATSAPP_HINT: 'Copiá el texto y pegalo directamente en el chat. Ya viene formateado con subtotales.',
  EXPORT_WHATSAPP_COPY_BUTTON: 'Copiar reporte para WhatsApp',
  EXPORT_CSV_DOWNLOAD_BUTTON: 'Descargar reporte (.csv)',
  EXPORT_WHATSAPP_HEADER: '📊 *Rendición de Gastos - DelaySpend*',
  EXPORT_WHATSAPP_PERIOD: '🗓 *Período:*',
  EXPORT_WHATSAPP_REAL_SECTION: '💸 *Gastos Reales Realizados:*',
  EXPORT_WHATSAPP_DELAYED_SECTION: '🛡 *Compras Delayeadas (Ahorradas):*',
  EXPORT_WHATSAPP_SUMMARY_SECTION: '📈 *Resumen Financiero:*',
  EXPORT_WHATSAPP_TOTAL_REAL: '• Total gastado efectivamente:',
  EXPORT_WHATSAPP_TOTAL_DELAYED: '• Total protegido/ahorrado:',
  EXPORT_WHATSAPP_PENDING_TRANSFER: '• Monto a transferir a caja de ahorro:',
  EXPORT_WHATSAPP_TOTAL_BUDGET: '• Total presupuestario rendido:',
  EXPORT_WHATSAPP_FOOTER: 'Generado con DelaySpend 🚀',

  // Notificaciones Toast
  TOAST_EXPENSE_ADDED_REAL: 'Gasto registrado correctamente.',
  TOAST_EXPENSE_ADDED_DELAYED: '¡Buenísimo! Delayaste este gasto y cuidaste tu plata.',
  TOAST_EXPENSE_UPDATED: 'Movimiento actualizado.',
  TOAST_EXPENSE_DELETED: 'Movimiento eliminado.',
  TOAST_TRANSFERRED_ALL_SUCCESS: '¡Excelente! Moviste el dinero a tu cuenta de ahorro.',
  TOAST_TRANSFER_TOGGLED: 'Estado de transferencia actualizado.',
  TOAST_COPIED_TO_CLIPBOARD: 'Reporte copiado al portapapeles listo para enviar.',
  TOAST_CSV_DOWNLOADED: 'Archivo CSV descargado con éxito.',
  TOAST_ERROR_INVALID_AMOUNT: 'Por favor ingresá un monto válido mayor a 0.',
  TOAST_ERROR_NO_DESCRIPTION: 'Por favor agregá un detalle o concepto.',

  // Sincronización Multi-Dispositivo & Auth
  SYNC_STATUS_SYNCED: 'Sincronizado',
  SYNC_STATUS_SYNCING: 'Sincronizando...',
  SYNC_STATUS_OFFLINE: 'Sin conexión',
  SYNC_STATUS_GUEST: 'Sincronizar',
  AUTH_TITLE_SIGNIN: 'Iniciar Sesión',
  AUTH_TITLE_SIGNUP: 'Crear Cuenta para Sincronizar',
  AUTH_EMAIL_LABEL: 'Correo electrónico',
  AUTH_PASSWORD_LABEL: 'Contraseña (mínimo 6 caracteres)',
  AUTH_BUTTON_SIGNIN: 'Entrar y sincronizar',
  AUTH_BUTTON_SIGNUP: 'Crear cuenta y sincronizar',
  AUTH_BUTTON_LOGOUT: 'Cerrar sesión en este dispositivo',
  AUTH_SUCCESS_LOGIN: '¡Sesión iniciada! Tus gastos se están sincronizando.',
  AUTH_SUCCESS_LOGOUT: 'Cerraste sesión correctamente.',
  AUTH_SWITCH_TO_SIGNUP: '¿No tenés cuenta todavía? Creala en un toque',
  AUTH_SWITCH_TO_SIGNIN: '¿Ya tenés cuenta? Iniciá sesión acá',
  AUTH_ERROR_GENERIC: 'Ocurrió un error al autenticar. Verificá los datos.',
  AUTH_SUBTITLE: 'Accedé al mismo historial en tu celular, computadora y tablet en tiempo real.',
} as const;

export type StringKey = keyof typeof STRINGS;

