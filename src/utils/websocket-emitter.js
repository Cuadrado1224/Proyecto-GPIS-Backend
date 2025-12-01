/**
 * Utilidad global para emitir eventos WebSocket desde cualquier controlador
 * Sin necesidad de tener acceso directo a wss
 */

let wssInstance = null;

/**
 * Inicializar la instancia de WebSocket Server
 * Debe ser llamado desde app.js cuando se configure express-ws
 */
export const setWssInstance = (wss) => {
  wssInstance = wss;
  console.log('✅ WebSocket Server instance configurada');
};

/**
 * Emitir notificación a un usuario específico (o múltiples usuarios)
 * @param {number|number[]} userIds - ID de usuario o array de IDs
 * @param {object} notification - Objeto de notificación a enviar
 */
export const emitNotificationToUsers = (userIds, notification) => {
  if (!wssInstance) {
    console.warn('⚠️  WSS no está inicializado. No se puede emitir notificación.');
    return;
  }

  // Convertir a array si es un solo ID
  const targetUserIds = Array.isArray(userIds) ? userIds : [userIds];
  
  // Normalizar IDs a números para comparación
  const normalizedIds = targetUserIds.map(id => parseInt(id));

  console.log(`🔍 Intentando emitir a usuarios: ${normalizedIds.join(', ')}`);
  console.log(`🔍 Clientes conectados: ${wssInstance.clients.size}`);

  let emittedCount = 0;
  // Emitir a todos los clientes conectados que coincidan con los userIds
  wssInstance.clients.forEach((client) => {
    if (client.user) {
      console.log(`🔍 Cliente conectado - User ID: ${client.user.id}, ReadyState: ${client.readyState}`);
    }
    
    if (client.user && normalizedIds.includes(parseInt(client.user.id)) && client.readyState === 1) {
      client.send(
        JSON.stringify({
          type: 'newNotification',
          data: notification
        })
      );
      emittedCount++;
      console.log(`✉️  Notificación enviada a usuario ${client.user.id}`);
    }
  });

  console.log(`📢 Notificación emitida a ${emittedCount}/${normalizedIds.length} usuarios: ${normalizedIds.join(', ')}`);
};

/**
 * Emitir mensaje genérico a usuario(s) específico(s)
 * @param {number|number[]} userIds - ID de usuario o array de IDs
 * @param {string} eventType - Tipo de evento (ej: 'chat:new', 'product:update')
 * @param {object} data - Datos a enviar
 */
export const emitToUsers = (userIds, eventType, data) => {
  if (!wssInstance) {
    console.warn('⚠️  WSS no está inicializado');
    return;
  }

  const targetUserIds = Array.isArray(userIds) ? userIds : [userIds];

  wssInstance.clients.forEach((client) => {
    if (client.user && targetUserIds.includes(client.user.id) && client.readyState === 1) {
      client.send(
        JSON.stringify({
          type: eventType,
          data
        })
      );
    }
  });
};

/**
 * Broadcast a todos los usuarios conectados
 * @param {string} eventType - Tipo de evento
 * @param {object} data - Datos a enviar
 */
export const broadcast = (eventType, data) => {
  if (!wssInstance) {
    console.warn('⚠️  WSS no está inicializado');
    return;
  }

  wssInstance.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(
        JSON.stringify({
          type: eventType,
          data
        })
      );
    }
  });
};

/**
 * Obtener usuarios conectados
 * @returns {number[]} Array de user IDs conectados
 */
export const getConnectedUserIds = () => {
  if (!wssInstance) {
    return [];
  }

  const connectedIds = [];
  wssInstance.clients.forEach((client) => {
    if (client.user && client.readyState === 1) {
      connectedIds.push(client.user.id);
    }
  });

  return [...new Set(connectedIds)]; // Eliminar duplicados
};
