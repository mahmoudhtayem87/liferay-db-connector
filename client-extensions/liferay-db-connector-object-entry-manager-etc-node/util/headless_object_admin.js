import fetch from 'node-fetch';
import axios  from 'axios';

import {logger} from './logger.js';
import config from '../config.js';
import {URL} from "url";
import request from "request";

const domains = config['com.liferay.lxc.dxp.domains'];

const lxcDXPMainDomain = config['com.liferay.lxc.dxp.mainDomain'];
const lxcDXPServerProtocol = config['com.liferay.lxc.dxp.server.protocol'];


const oauth2JWKSURI = `${lxcDXPServerProtocol}://${lxcDXPMainDomain}`;
const objectDefinitionsEndPoint = 'o/object-admin/v1.0/object-definitions';
async function postDataToEndpoint(url, postData, bearerToken) {
    let prom = new Promise((resolve, reject) => {
        try {
            let config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: url,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': bearerToken
                },
                data: JSON.stringify(postData)
            };

            axios.request(config)
                .then((response) => {
                    resolve(response.data);
                })
                .catch((error) => {
                    console.log(error.message);
                    resolve(null);
                });

        } catch (error) {
            console.error('Error posting data:', error.message);
        }
    });
    return prom;

}
export async function postDefinition(schema, token) {

    logger.log("Creating Object Definition")
    const apiUrl = new URL(`${oauth2JWKSURI}/${objectDefinitionsEndPoint}`);
    let result = postDataToEndpoint(apiUrl.href, schema, token);
    return result;
}
export async function deleteProxyObject(externalReferenceCode,bearerToken)
{
    try
    {
        let objectDefinitionId = await getObjectDefinition(externalReferenceCode,bearerToken);
        logger.info(`Object ${externalReferenceCode} found!, object id is ${objectDefinitionId}`);
        let deleteResult = await deleteObjectDefinition(objectDefinitionId,bearerToken);
        logger.info(`Object ${externalReferenceCode} has been deleted!`);
        return true;
    }catch (exp)
    {
        logger.error(`Error while deleting Object ${externalReferenceCode}!`);
        return false;
    }

}
function getObjectDefinition(externalReferenceCode, bearerToken) {
    let prom = new Promise((resolve, reject) => {
        let url = `${oauth2JWKSURI}/${objectDefinitionsEndPoint}/by-external-reference-code/${externalReferenceCode}`;
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: url,
            headers: {
                'Accept': 'application/json',
                'Authorization': bearerToken
            }
        };
        axios.request(config)
            .then(async (response) => {
                let objectDefinitionId = response.data.id;
                resolve(objectDefinitionId);
            })
            .catch((error) => {
                console.log(error.message);
            });
    });
    return prom;
}
function deleteObjectDefinition(objectDefinitionId, bearerToken) {
    let prom = new Promise((resolve, reject) => {
        let url = `${oauth2JWKSURI}/${objectDefinitionsEndPoint}/${objectDefinitionId}`;
        let config = {
            method: 'delete',
            maxBodyLength: Infinity,
            url: url,
            headers: {
                'Accept': 'application/json',
                'Authorization': bearerToken
            }
        };
        axios.request(config)
            .then((response) => {
                resolve(response.data);
            })
            .catch((error) => {
                console.log(error);
            });
    });
    return prom;
}




