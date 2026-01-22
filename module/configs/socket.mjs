import { InputDialog } from "../dialog/input-dialog.mjs";

export function registerModuleSocket() {
  game.socket.on("module.pazindor-dev-essentials", async (data, emmiterId) => {
    const emitTypes = PGT.CONST.SOCKET.EMIT;
    switch (data.type) {
      case emitTypes.INPUT_DIALOG:
        handleInputDialog(data.payload, emmiterId);
        break;
    }
  });
}

async function handleInputDialog(payload, emmiterId) {
  if (payload.userIds.includes(game.user.id)) {
    const result = await InputDialog.create(payload.inputType, payload.data, payload.options)
    game.socket.emit('module.pazindor-dev-essentials', {
      type: PDE.SOCKET.RESPONSE.INPUT_DIALOG,
      emmiterId: emmiterId,
      signature: payload.signature,
      payload: result
    })
  }
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