import { emitEventToGM, responseListener } from "./socket.mjs";

/**
 * Run CREATE opperation on Document. If user doesn't have permissions to do so request will be sent to active GM.
 * @param {object|Document|(object|Document)[]} [data={}] Initial data used to create this Document, or a Document
 *                                                        instance to persist.
 * @param {Partial<Omit<DatabaseCreateOperation, "data">>} [operation={}]  Parameters of the creation operation
 * @returns {Promise<Document[] | undefined>}        The created Document instance(s)
 */
export async function gmCreate(data={}, operation={}, DocumentClass) {
  const docPerm = operation.parent ? operation.parent.testUserPermission(game.user, "OWNER") : false;
  const globalPerm = DocumentClass.canUserCreate(game.user);
  const canCreate = docPerm || globalPerm;

  if (!canCreate || operation.forceGM) {
    if (operation.parent) operation.parent = operation.parent.uuid; // We cannot transfer full document via socket
    if (operation.ignoreResponse) {
      emitEventToGM(PDE.CONST.SOCKET.EMIT.CREATE_DOCUMENT, {createData: data, operation: operation, documentClassName: DocumentClass.documentName});
    }
    else {
      const signature = foundry.utils.randomID();
      const validationData = {emmiterId: game.user.id, signature: signature}
      const response = responseListener(PDE.CONST.SOCKET.RESPONSE.CREATE_DOCUMENT, validationData);
      emitEventToGM(PDE.CONST.SOCKET.EMIT.CREATE_DOCUMENT, {createData: data, operation: operation, documentClassName: DocumentClass.documentName, signature: signature});
      const result = await response;
      if (!result) return;

      const created = [];
      for (const uuid of result) {
        const doc = await fromUuid(uuid);
        created.push(doc);
      }
      return created;
    }
  }

  else {
    try {
      const result = await DocumentClass.create(data, operation);
      if (Array.isArray(result)) return result;
      else if (result) return [result];
    }
    catch (e) {
      operation.forceGM = true;
      return await gmCreate(data, operation, DocumentClass);
    }
  }
}

/**
 * Run UPDATE opperation on Document. If user doesn't have permissions to do so request will be sent to active GM.
 * @param {object} [data={}]          Differential update data which modifies the existing values of this document
 * @param {Partial<Omit<DatabaseUpdateOperation, "updates">>} [operation={}]  Parameters of the update operation
 * @returns {Promise<Document|undefined>}       The updated Document instance, or undefined not updated
 */
export async function gmUpdate(data={}, operation={}, object) {
  if (!object.canUserModify(game.user, "update") || operation.forceGM) {
    if (operation.ignoreResponse) {
      emitEventToGM(PDE.CONST.SOCKET.EMIT.UPDATE_DOCUMENT, {uuid: object.uuid, updateData: data, operation: operation});
    }
    else {
      const signature = foundry.utils.randomID();
      const validationData = {emmiterId: game.user.id, signature: signature}
      const response = responseListener(PDE.CONST.SOCKET.RESPONSE.UPDATE_DOCUMENT, validationData);
      emitEventToGM(PDE.CONST.SOCKET.EMIT.UPDATE_DOCUMENT, {uuid: object.uuid, updateData: data, operation: operation, signature: signature});
      const result = await response;
      if (!result) return;
      return await fromUuid(result);
    }
  }

  else {
    try {
      const updated = await object.update(data, operation);
      return updated;
    }
    catch (e) {
      operation.forceGM = true;
      return await gmUpdate(data, operation, object);
    }
  }
}

/**
 * Run DELETE opperation on Document. If user doesn't have permissions to do so request will be sent to active GM.
 * @see {@link Document.DELETE_DOCUMENTs}
 * @param {Partial<Omit<DatabaseDeleteOperation, "ids">>} [operation={}]  Parameters of the deletion operation
 * @returns {Promise<boolean|undefined>}       True if deleted, false if not
 */
export async function gmDelete(operation={}, object) {
  if (!object.canUserModify(game.user, "delete") || operation.forceGM) {
    if (operation.ignoreResponse) {
      emitEventToGM(PDE.CONST.SOCKET.EMIT.DELETE_DOCUMENT, {uuid: object.uuid, operation: operation});
    }
    else {
      const signature = foundry.utils.randomID();
      const validationData = {emmiterId: game.user.id, signature: signature}
      const response = responseListener(PDE.CONST.SOCKET.RESPONSE.DELETE_DOCUMENT, validationData);
      emitEventToGM(PDE.CONST.SOCKET.EMIT.DELETE_DOCUMENT, {uuid: object.uuid, operation: operation, signature: signature});
      const result = await response;
      return result;
    }
  }
  
  else {
    try {
      const deleted = await object.delete(operation);
      return !!deleted;
    }
    catch (e) {
      operation.forceGM = true;
      return await gmDelete(operation, object);
    }
  }
}