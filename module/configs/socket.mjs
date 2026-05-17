import { announce } from "../announcement/announcement.mjs";
import { InputDialog } from "../dialog/input-dialog.mjs";

export function registerModuleSocket() {
  game.socket.on("module.pazindor-dev-essentials", async (data, emmiterId) => {
    const emitTypes = PDE.CONST.SOCKET.EMIT;
    switch (data.type) {
      case emitTypes.INPUT_DIALOG:
        handleInputDialog(data.payload, emmiterId);
        break;

      case emitTypes.CREATE_DOCUMENT:
        handleCreateDocument(data.payload, emmiterId);
        break

      case emitTypes.UPDATE_DOCUMENT:
        handleUpdateDocument(data.payload, emmiterId);
        break

      case emitTypes.DELETE_DOCUMENT:
        handleDeleteDocument(data.payload, emmiterId);
        break

      case emitTypes.ANNOUNCEMENT:
        handleAnnouncement(data.payload);
        break;
    }

  });
}

async function handleInputDialog(payload, emmiterId) {
  if (payload.userIds.includes(game.user.id)) {
    const result = await InputDialog.create(payload.inputType, payload.data, payload.options)
    emitEvent(PDE.CONST.SOCKET.RESPONSE.INPUT_DIALOG, {
      emmiterId: emmiterId,
      signature: payload.signature,
      result: result
    })
  }
}

async function handleCreateDocument(payload, emmiterId) {
  const { createData, operation, documentClassName, signature, gmUserId } = payload;
  if (game.user.id !== gmUserId) return;
  console.info(`[PDE] GM CREATE: Received CREATE request for document class: '${documentClassName}'`);

  const documentClass = getDocumentClass(documentClassName);
  if (!documentClass) {
    ui.notifications.error(`Document Class with name ${documentClassName} doesn't exist.`);
    return;
  }

  if (operation.parent) operation.parent = await fromUuid(operation.parent);
  const result = await documentClass.create(createData, operation);
  if (signature) {
    let uuids;
    if (Array.isArray(result)) uuids = result.map(r => r.uuid);
    else if (result) uuids = [result.uuid];

    game.socket.emit('module.pazindor-dev-essentials', {
      payload: uuids, 
      emmiterId: emmiterId,
      type: PDE.CONST.SOCKET.RESPONSE.CREATE_DOCUMENT,
      signature: signature
    });
  }
}

async function handleUpdateDocument(payload, emmiterId) {
  const { uuid, updateData, operation, signature, gmUserId } = payload;
  if (game.user.id !== gmUserId) return;
  console.info(`[PDE] GM UPDATE: Received UPDATE request for item with uuid: '${uuid}'`);

  const document = await fromUuid(uuid);
  if (!document) {
    ui.notifications.error(`Document with uuid ${uuid} doesn't exist.`);
    return;
  }

  const result = await document.update(updateData, operation);
  if (signature) {
    game.socket.emit('module.pazindor-dev-essentials', {
      payload: result.uuid, 
      emmiterId: emmiterId,
      type: PDE.CONST.SOCKET.RESPONSE.UPDATE_DOCUMENT,
      signature: signature
    });
  }
}

async function handleDeleteDocument(payload, emmiterId) {
  const { uuid, operation, signature, gmUserId } = payload;
  if (game.user.id !== gmUserId) return;
  console.info(`[PDE] GM DELETE: Received DELETE request for item with uuid: '${uuid}'`);

  const document = await fromUuid(uuid);
  if (!document) {
    ui.notifications.error(`Document with uuid ${uuid} doesn't exist.`);
    return;
  }

  const result = await document.delete(operation);
  if (signature) {
    game.socket.emit('module.pazindor-dev-essentials', {
      payload: !!result, 
      emmiterId: emmiterId,
      type: PDE.CONST.SOCKET.RESPONSE.DELETE_DOCUMENT,
      signature: signature
    });
  }
}

function handleAnnouncement(payload) {
  const { announcement, timer, options } = payload;
  announce(announcement, timer, options);
}

//=======================================
//      EMIT AND WAIT FOR RESPONSE      =
//=======================================
export function emitEvent(type, payload) {
  game.socket.emit('module.pazindor-dev-essentials', {
    type: type,
    payload: payload
  });
}

export function emitEventToGM(type, payload) {
  const activeGM = game.users.activeGM;
  if (!activeGM) {
    ui.notifications.error("There needs to be an active GM to proceed with that operation");
    return false;
  }

  emitEvent(type, {
    gmUserId: activeGM.id,
    ...payload,
  })
}

export async function responseListener(type, validationData={}) {
  return new Promise((resolve) => {
    game.socket.once('module.pazindor-dev-essentials', (response) => {
      if (response.type !== type) {
        resolve(responseListener(type, validationData));
      }
      else if (!_validatePayload(response.payload, validationData)) {
        resolve(responseListener(type, validationData));
      }
      else {
        resolve(response.payload);
      }
    });
  });
}

function _validatePayload(response, validationData) {
  for (const [key, expectedValue] of Object.entries(validationData)) {
    if (response[key]) {
      if (response[key] !== expectedValue) return false;
    }
  }
  return true;
}