// routes/selfRoutes.js
import {
    deleteRecordToDB,
    discoverTableFields,
    discoverTables,
    getDataRowByKey,
    getDataWithPagination,
    postRecordToDB, updateRecordToDB
} from '../app-utils/db-discover.js';
import express from "express";
import cache from 'memory-cache';
import {logger} from "../util/logger.js";
import config from '../util/configTreePath.js';
import {getDBConnectRecord} from "../util/headless_dbConnect.js";
const cacheTimeExpiration = 20000;
const router = express.Router();

router.get('/',async(req,res)=>
{
    res.send('READY');
});
async function getConfigurationRecord(objectDefinitionExternalReferenceCode,token)
{
    let cacheKey = `config_${objectDefinitionExternalReferenceCode}`;
    let cachedData = cache.get(cacheKey);
    if (cachedData)
    {
        return cachedData;
    }else
    {
        let configRecord = await getDBConnectRecord(objectDefinitionExternalReferenceCode,token);
        cache.put(cacheKey,configRecord , 100000);
        return configRecord;
    }

}
router.get('/:objectDefinitionExternalReferenceCode',async(req,res)=>
{
    const { companyId, languageId, scopeKey,userId,page,pageSize } = req.query;
    let objectDefinitionExternalReferenceCode = req.params.objectDefinitionExternalReferenceCode;
    const token = req.headers.authorization;
    let cacheKey = `${objectDefinitionExternalReferenceCode}_${page}_${pageSize}`;
    let cachedData = cache.get(cacheKey);
    if (cachedData)
    {
        res.status(200).json(cachedData);
    }
    else
    {
        let configRecord = await getConfigurationRecord(objectDefinitionExternalReferenceCode,token);
        let resultPage = await getDataWithPagination(configRecord.connectionString,
            configRecord.primaryKey,
            configRecord.tabelName,
            page,
            pageSize
        );
        cache.put(cacheKey,resultPage , cacheTimeExpiration);
        res.status(200).json(resultPage);
    }
});
router.get('/:objectDefinitionExternalReferenceCode/:externalReferenceCode',async(req,res)=>
{
    const { companyId, languageId, scopeKey,userId,page,pageSize } = req.query;
    let objectDefinitionExternalReferenceCode = req.params.objectDefinitionExternalReferenceCode;
    let externalReferenceCode = req.params.externalReferenceCode;
    const token = req.headers.authorization;
    let cacheKey = `${objectDefinitionExternalReferenceCode}_${externalReferenceCode}`;
    let cachedData = cache.get(cacheKey);
    if (cachedData)
    {
        res.status(200).json(cachedData);
    }else
    {
        let configRecord = await getConfigurationRecord(objectDefinitionExternalReferenceCode,token);
        let record = await getDataRowByKey(configRecord.connectionString,configRecord.tabelName,configRecord.primaryKey,externalReferenceCode);
        cache.put(cacheKey,record , cacheTimeExpiration);
        res.status(200).json(record);
    }
});
router.post('/:objectDefinitionExternalReferenceCode',async(req,res)=>
{
    let {companyId,languageId,scopeKey,userId,objectEntry} = req.body;
    let objectDefinitionExternalReferenceCode = req.params.objectDefinitionExternalReferenceCode;
    let externalReferenceCode = req.params.externalReferenceCode;
    const token = req.headers.authorization;
    let record = null;
    let task = async ()=>{
        let configRecord = await getConfigurationRecord(objectDefinitionExternalReferenceCode,token);
        record = await postRecordToDB(configRecord.connectionString,configRecord.tabelName,configRecord.primaryKey,req.body.objectEntry);
    }
    task();
    res.status(200).json(req.body.objectEntry);
});
router.put('/:objectDefinitionExternalReferenceCode/:externalReferenceCode',async(req,res)=>
{
    let {companyId,languageId,scopeKey,userId,objectEntry} = req.body;
    let objectDefinitionExternalReferenceCode = req.params.objectDefinitionExternalReferenceCode;
    let externalReferenceCode = req.params.externalReferenceCode;
    let cacheKey = `${objectDefinitionExternalReferenceCode}_${externalReferenceCode}`;
    const token = req.headers.authorization;
    let record = null;
    let task = async ()=>{
        let configRecord = await getConfigurationRecord(objectDefinitionExternalReferenceCode,token);
        record = await updateRecordToDB(configRecord.connectionString,configRecord.tabelName,configRecord.primaryKey,req.body.objectEntry);
        cache.del(cacheKey);
    }
    task();
    res.status(200).json(req.body.objectEntry);
});
router.delete('/:objectDefinitionExternalReferenceCode/:externalReferenceCode',async(req,res)=>
{
    let {companyId,languageId,scopeKey,userId,objectEntry} = req.body;
    let objectDefinitionExternalReferenceCode = req.params.objectDefinitionExternalReferenceCode;
    let externalReferenceCode = req.params.externalReferenceCode;
    let cacheKey = `${objectDefinitionExternalReferenceCode}_${externalReferenceCode}`;
    const token = req.headers.authorization;
    let record = null;
    let task = async ()=>{
        let configRecord = await getConfigurationRecord(objectDefinitionExternalReferenceCode,token);
        record = await deleteRecordToDB(configRecord.connectionString,configRecord.tabelName,configRecord.primaryKey,externalReferenceCode);
        cache.clear();
    }
    task();
    res.status(200).json(req.body.objectEntry);
});
export default router;
