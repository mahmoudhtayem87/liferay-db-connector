import Sequelize from 'sequelize';
import {convertDBColumnTypeToLiferayType, isSystemField} from "./type-mapping.js";
import {parseDate, parseDateTime} from "./date-util.js";


const underscore = "t0414";
const prefix = "m0511";
export async function discoverTables(connectionString, dbName) {
    const sequelize = new Sequelize(connectionString);
    try {
        await sequelize.authenticate();
        const query = `
            SELECT table_name as 'table'
            FROM information_schema.tables
            WHERE table_schema = '${dbName}';`
        ;
        const [results, _] = await sequelize.query(query,
            {
                raw: true,
                logging: false
            });
        const tableNames = results.map((row) => row.table);
        return tableNames;
    } catch (error) {
        console.error('Error connecting to the database:', error);
    } finally {
        await sequelize.close();
    }
}
export async function getDataWithPagination(connectionString, primaryKey, tableName, pageIndex, pageSize) {
    try {
        const sequelize = new Sequelize(connectionString,{logging: false});
        let tableFields = await discoverTableFields(connectionString,tableName);
        const offset = (pageIndex - 1) * pageSize;
        const query = `SELECT ${getTableFieldsFixed(tableFields,primaryKey).join(',')}
                       FROM ${tableName} LIMIT ${pageSize}
                       OFFSET ${offset};`
        const countQuery = `SELECT COUNT(*) AS total
                            FROM ${tableName};`;
        const results = await sequelize.query(query, {
            type: Sequelize.QueryTypes.SELECT,
            raw: false,
            plain: false,
            logging: false
        });
        const totalCount = await sequelize.query(countQuery, {
            type: Sequelize.QueryTypes.SELECT,
            raw: false,
            plain: true
        });
        let resultPage = {
            items: results,
            page: pageIndex,
            totalCount: totalCount.total,
            pageSize: pageSize
        }
        return resultPage;
    }  catch (error) {
        console.error(`Error while getting records from ${tableName}:`, error.message);
    }
}
function getTableFieldsFixed(fields,primaryKey)
{
    let fixedFields = [];
    for (let index =0 ; index < fields.length ; index++)
    {
        fixedFields.push(`${fixFieldName(fields[index].fieldName,"toDB")} as ${fixFieldName(fields[index].fieldName,"toLR")}`);
    }
    fixedFields.push(`${primaryKey} as externalReferenceCode`);
    return fixedFields;
}
export async function getDataRowByKey(connectionString, tableName, primaryKey, primaryKeyValue) {
    try {
        const sequelize = new Sequelize(connectionString,{logging: false});
        let tableFields = await discoverTableFields(connectionString,tableName);
        const query = `SELECT ${getTableFieldsFixed(tableFields,primaryKey).join(',')}
                       FROM ${tableName}
                       where ${primaryKey} = '${primaryKeyValue}'`
        const countQuery = `SELECT COUNT(*) AS total
                            FROM ${tableName};`;
        const result = await sequelize.query(query, {
            type: Sequelize.QueryTypes.SELECT,
            raw: false,
            plain: true,
            logging: false
        });
        return result;
    } catch (error) {
        console.error(`Error while getting record  with id ${primaryKeyValue}:`, error.message);
    }
}
export async function discoverTableFields(connectionString, tableName) {
    const sequelize = new Sequelize(connectionString,{logging: false});

    try {
        await sequelize.authenticate();
        let dbName = sequelize.config.database;
        const query = `
            SELECT column_name as 'column_name', data_type as 'data_type',  IS_NULLABLE as 'required'
            FROM information_schema.columns
            WHERE table_schema = :dbName
              AND table_name = :tableName;
        `;

        const [results, _] = await sequelize.query(query, {
            replacements: {dbName, tableName},
            raw: true,
            logging: false
        });
        const fields = results.map((row) => ({
            fieldName: row.column_name,
            fieldType: row.data_type,
            required:  row.required
        }));
        return fields;
    } catch (error) {
        console.error('Error connecting to the database:', error);
    } finally {
        await sequelize.close();
    }
}
async function parseType(fieldType) {

    return convertDBColumnTypeToLiferayType(fieldType);
}
function capitalizeFirstChar(inputString)
{
    if (typeof inputString !== 'string') {
        throw new Error('Input must be a string');
    }

    return inputString.charAt(0).toUpperCase() + inputString.slice(1);
}
function fixFieldName(fieldName,direction)
{
    let fixedFieldName = "";
    switch (direction)
    {
        case "toDB":
        {
            fixedFieldName = fieldName.replaceAll(underscore,"_").replaceAll(prefix,"");
            break;
        }
        case "toLR":
        {
            if (isSystemField(fieldName))
            {
                fixedFieldName = `${prefix}${fieldName}`;
                fixedFieldName = fixedFieldName.replaceAll("_",underscore)
            }
            else{
                fixedFieldName = fieldName.replaceAll("_",underscore);
            }
            break;
        }
    }
    return fixedFieldName;
}
export async function getProxyObjectSchema(connectionString, tableName,primaryKey,connectionTitle)
{
    let tableFields = await discoverTableFields(connectionString, tableName);
    let objectFields = [];
    for (let index = 0 ; index < tableFields.length ; index++)
    {
        if (tableFields[index].fieldName == primaryKey)
            continue;
        let field = tableFields[index];
        let parsedType = await parseType(field.fieldType);
        if (parsedType.parsed) {
            let template = {
                "indexed": true,
                "objectFieldSettings": [],
                "readOnly": "true",
                "DBType":parsedType.dbType,
                "label": {
                    "en_US": field.fieldName
                },
                "type": parsedType.dbType,
                "required": field.required.toLowerCase() == "no",
                "indexedAsKeyword": true,
                "system": false,
                "indexedLanguageId": "",
                "name": fixFieldName(field.fieldName,"toLR"),
                "state": false,
                "businessType": parsedType.businessType,
                "readOnlyConditionExpression": ""
            };
            if ("objectFieldSettings" in parsedType)
            {
                template["objectFieldSettings"] = parsedType["objectFieldSettings"];
            }
            objectFields.push(template);
        }
    }
    let schemaTemplate ={
        "enableComments": false,
        "objectRelationships": [],
        "enableCategorization": false,
        externalReferenceCode:tableName,
        "accountEntryRestrictedObjectFieldName": "",
        "objectActions": [],
        "accountEntryRestricted": false,
        "objectFields": objectFields,
        "scope": "company",
        "portlet": true,
        "parameterRequired": false,
        "enableObjectEntryHistory": false,
        "titleObjectFieldName": "id",
        "objectValidationRules": [],
        "active": true,
        "defaultLanguageId": "en_US",
        "label": {
            "en_US": connectionTitle
        },
        "panelCategoryKey": "applications_menu.applications.custom.apps",
        "pluralLabel": {
            "en_US": connectionTitle
        },
        "objectLayouts": [],
        "system": false,
        "objectViews": [],
        "name": capitalizeFirstChar(tableName),
        "storageType": "function#liferay-db-connector-object-manager-etc-node",

        "status": {
            "label_i18n": "Approved",
            "code": 0,
            "label": "approved"
        }
    }
    return schemaTemplate;
}
export async function postRecordToDB(connectionString, tableName,primaryKey,dataObject)
{
    ///todo manage data injection
    try {
        let fieldsFixed = [];
        let values = [];
        let replacements = [];
        let tableFields = await discoverTableFields(connectionString,tableName);
        Object.keys(dataObject).forEach(key=>{
            if(fixFieldName(key,"toDB") != primaryKey && dataObject[key] && !isSystemField(fixFieldName(key,"toDB")))
            {
                fieldsFixed.push(fixFieldName(key,"toDB"));
                values.push(`?`);
                replacements.push(fixValue(tableFields,`${fixFieldName(key,"toDB")}`,dataObject[key]));
            }
        });
        const sequelize = new Sequelize(connectionString);
        const query = `insert into ${tableName} (${fieldsFixed.join(',')}) values (${values.join(',')})`
        const result = await sequelize.query(query, {
            type: Sequelize.QueryTypes.INSERT,
            raw: false,
            plain: true,
            replacements : replacements,
            logging: false
        });
        return result;
    } catch (error) {
        console.error(`Error while inserting a new record :`, error.message);
    }
}
function fixValue(tableFields,fieldName,fieldValue)
{
    try{
        let tableField = tableFields.filter(field=> field.fieldName == fieldName)[0];
        if (!tableField)
        {
            console.error(`error while trying to get value for ${fieldName}`);
        }
        let lrType = convertDBColumnTypeToLiferayType(tableField.fieldType);
        switch (lrType.businessType)
        {
            case "LongText":
            {
                try{
                    return JSON.stringify(fieldValue);
                }catch (exp)
                {
                    return JSON.stringify({});
                }
                break;
            }
            case "Date":
            {
                return parseDate(fieldValue);
            }
            case "DateTime":
            {
                return parseDateTime(fieldValue);
            }
            default:
                return fieldValue;
        }
    }catch (e) {
        console.log(e.message);
    }
}
export async function updateRecordToDB(connectionString, tableName,primaryKey,dataObject)
{
    let primaryKeyValue = dataObject["externalReferenceCode"];
    try {
        let fieldsFixed = [];
        let replacements = [];
        let primaryKeyValue = dataObject["externalReferenceCode"];
        let tableFields = await discoverTableFields(connectionString,tableName);
        Object.keys(dataObject).forEach(key=>{
            if(fixFieldName(key,"toDB") != primaryKey && dataObject[key] && !isSystemField(fixFieldName(key,"toDB")))
            {
                fieldsFixed.push(`${fixFieldName(key,"toDB")} = ?`);
                replacements.push(fixValue(tableFields,`${fixFieldName(key,"toDB")}`,dataObject[key]));
            }
        });
        replacements.push(primaryKeyValue);
        const sequelize = new Sequelize(connectionString);
        const query = `update  ${tableName} set ${fieldsFixed.join(',')} where ${primaryKey} = ?`;
        const result = await sequelize.query(query, {
            type: Sequelize.QueryTypes.UPDATE,
            raw: false,
            plain: true,
            replacements : replacements,
            logging: false
        });
        return result;
    } catch (error) {
        console.error(`Error while updating record with id ${primaryKeyValue}:`, error.message);
    }
}

export async function deleteRecordToDB(connectionString, tableName,primaryKey,dataObject)
{
    let primaryKeyValue = dataObject;
    try {
        let fieldsFixed = [];
        let replacements = [];
        replacements.push(primaryKeyValue);
        const sequelize = new Sequelize(connectionString);
        const query = `delete from ${tableName} where ${primaryKey} = ?`;
        const result = await sequelize.query(query, {
            type: Sequelize.QueryTypes.UPDATE,
            raw: false,
            plain: true,
            replacements : [primaryKeyValue],
            logging: false
        });
        return result;
    } catch (error) {
        console.error(`Error while deleting record with id ${dataObject}:`, error.message);
    }
}
