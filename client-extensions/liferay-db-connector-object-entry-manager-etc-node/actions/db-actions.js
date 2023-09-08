// routes/selfRoutes.js

import express from "express";

const router = express.Router();
import config from '../util/configTreePath.js';
import {logger} from "../util/logger.js";
import {getProxyObjectSchema} from "../app-utils/db-discover.js"
import {deleteProxyObject, postDefinition} from '../util/headless_object_admin.js';
import {updateDBConnectRecord} from "../util/headless_dbConnect.js";


router.post('/connect',  (req, res) => {

    const {companyId, languageId, scopeKey, userId, page, pageSize} = req.query;
    const {toNumber, message} = req.body.objectEntry.values;
    let task = async ()=>{
        let {connectionString, tabelName, connectionTitle, primaryKey} = req.body.objectEntry.values;
        let objectSchema = await getProxyObjectSchema(connectionString, tabelName,primaryKey,connectionTitle);
        const token = req.headers.authorization;
        let result =  await postDefinition(objectSchema, token);
        if (result)
        {
            try
            {
                let updatedObject = await updateDBConnectRecord(req.body.objectEntry.externalReferenceCode,result.externalReferenceCode,token);
            }catch (exp)
            {
                logger.error(exp.message);
            }
        }
    }

    task();
    res.status(200).json(req.body.objectEntry);

});
router.post('/disconnect', async (req, res) => {
    const {companyId, languageId, scopeKey, userId, page, pageSize} = req.query;
    let {connectionString, tabelName, connectionTitle, primaryKey,proxyObjectExternalReferenceID} = req.body.objectEntry.values;
    const token = req.headers.authorization;
    let task = async ()=>{
        let deleteStatus = await deleteProxyObject(proxyObjectExternalReferenceID,token);
        if (deleteStatus)
            updateDBConnectRecord(req.body.objectEntry.externalReferenceCode,"",token,false);
    };
    setTimeout(()=>{
        task();
    },1000);
    res.status(200).json(req.body.objectEntry);
});
export default router;
