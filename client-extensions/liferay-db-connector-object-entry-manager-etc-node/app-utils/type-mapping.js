import {logger} from "../util/logger.js";

const typeMappings = {
    // Numeric types
    'smallint': 'Integer',
    'integer': 'Integer',
    'int': 'Integer',
    'bigint': 'LongInteger',
    'decimal': 'PrecisionDecimal',
    'numeric': 'LongInteger',
    'real': 'Decimal',
    'double precision': 'Decimal',

    // Character types
    'character': 'Text',
    'char': 'Text',
    'character varying': 'LongText',
    'varchar': 'LongText',
    'longtext': 'LongText',
    'text': 'LongText',

    // Date and time types
    'date': 'Date',
    'time': 'DateTime',
    'timestamp': 'Date',
    'timestamptz': 'DateTime',
    'datetime': 'DateTime', // Added support for datetime

    // Boolean
    //'boolean': 'boolean',

    // Binary data
    //'bytea': 'LongText',

    // JSON types
    //'json': 'LongText',
    //'jsonb': 'LongText',

    // UUID
    'uuid': 'Text',

    // Enumerated types
    'enum': 'Text',

    // Custom types (You may need to handle these case-by-case)
    /*
    'hstore': 'Text',
    'point': 'Text',
    'line': 'Text',
    'lseg': 'Text',
    'box': 'Text',
    'path': 'Text',
    'polygon': 'Text',
    'circle': 'Text',
    'interval': 'Text',
    'bit': 'Text',
    'bit varying': 'LongText',
    'macaddr': 'LongText',
    'inet': 'LongText',
    'cidr': 'LongText',
    'macaddr8': 'LongText',
    'money': 'Long',
     */

};
const liferayTypes = {
    "Text": {
        "dbType": "String",
        "type": "String",
        "businessType": "Text"
    },
    "Date": {
        "dbType": "Date",
        "type": "Date",
        "businessType": "Date",
        "objectFieldSettings": [
            {
                "name": "timeStorage",
                "value": "convertToUTC"
            }
        ]
    },
    "LongInteger": {
        "dbType": "Long",
        "type": "Long",
        "businessType": "LongInteger"
    },
    "DateTime": {
        "dbType": "DateTime",
        "type": "DateTime",
        "businessType": "DateTime",
        "objectFieldSettings": [
            {
                "name": "timeStorage",
                "value": "convertToUTC"
            }
        ]
    },
    "Integer": {
        "dbType": "Integer",
        "type": "Integer",
        "businessType": "Integer"
    },
    "PrecisionDecimal": {
        "dbType": "BigDecimal",
        "type": "BigDecimal",
        "businessType": "PrecisionDecimal"
    },
    "Decimal": {
        "dbType": "Double",
        "type": "Double",
        "businessType": "Decimal"
    },
    "RichText": {
        "dbType": "Clob",
        "type": "Clob",
        "businessType": "RichText"
    },
    "Boolean": {
        "dbType": "Boolean",
        "type": "Boolean",
        "businessType": "Boolean"
    },
    "LongText": {
        "dbType": "Clob",
        "type": "Clob",
        "businessType": "LongText"
    }
};

const systemFields ={
    creator : "yes",
    createDate : "yes",
    externalReferenceCode :"yes",
    id :"yes",
    modifiedDate:"yes",
    status : "yes"
}
export function isSystemField(fieldName)
{
    return fieldName in systemFields;
}
export function convertDBColumnTypeToLiferayType(dbColumnType) {
    if (dbColumnType.toLowerCase() in typeMappings) {
        let liferayType = liferayTypes[typeMappings[dbColumnType]];
        liferayType["parsed"] = true;
        return liferayType;
    } else {
        let defaultType = liferayTypes["Text"];
        defaultType["parsed"] = false;
        return defaultType;
    }
}



