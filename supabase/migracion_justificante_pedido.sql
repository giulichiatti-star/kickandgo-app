-- Marca cuándo se pidió el justificante de pago a un cliente.
-- El aviso sigue en estado 'pendiente' (el pago no está confirmado), pero el
-- panel muestra "Justificante pedido · fecha" para no volver a pedirlo por error.
alter table payment_notifications add column if not exists justificante_pedido_en timestamptz;
