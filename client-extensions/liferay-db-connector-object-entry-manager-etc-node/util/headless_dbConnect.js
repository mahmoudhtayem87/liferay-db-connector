import fetch from 'node-fetch';
import axios from 'axios';

import {logger} from './logger.js';
import config from '../config.js';
import {URL} from "url";
import request from "request";
import * as url from "url";

const domains = config['com.liferay.lxc.dxp.domains'];
const lxcDXPMainDomain = config['com.liferay.lxc.dxp.mainDomain'];
const lxcDXPServerProtocol = config['com.liferay.lxc.dxp.server.protocol'];
const oauth2JWKSURI = `${lxcDXPServerProtocol}://${lxcDXPMainDomain}`;
const objectDefinitionsEndPoint = 'o/c/dbconnects/';


export function getDBConnectRecord(externalReferenceCode, bearerToken) {
    let prom = new Promise((resolve, reject) => {
        setTimeout(() => {
            //filter=proxyObjectExternalReferenceID%20eq%20%27123%27
            let url = `${oauth2JWKSURI}/${objectDefinitionsEndPoint}?filter=proxyObjectExternalReferenceID%20eq%20%27${externalReferenceCode}%27`;
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
                .then((response) => {
                    resolve(response.data.items[0]);
                })
                .catch((error) => {
                    console.log(error.message);
                });
        }, 1000)
    });
    return prom;
}

export function updateDBConnectRecord(externalReferenceCode, proxyObjectExternalReferenceCode, bearerToken,connectionStatus = true) {
    let url = `${oauth2JWKSURI}/${objectDefinitionsEndPoint}by-external-reference-code/${externalReferenceCode}`;
    let prom = new Promise((resolve, reject) => {
        try {
            let data = JSON.stringify({
                "proxyObjectExternalReferenceID": proxyObjectExternalReferenceCode,
                "connectionStatus": connectionStatus
            });
            let config = {
                method: 'patch',
                maxBodyLength: Infinity,
                url: url,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': bearerToken,
                },
                data : data
            };
            axios.request(config)
                .then((response) => {
                    resolve(response.data);
                })
                .catch((error) => {
                    console.log(error.message);
                });
        } catch (error) {
            console.error('Error posting data:', error.message);
        }
    });
    return prom;

}




