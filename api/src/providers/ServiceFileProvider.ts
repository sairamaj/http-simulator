import { ServiceConfigMap } from "../model/ServiceConfigMap";
import * as path from 'path';
import * as fs from 'fs';
import { Service } from "../model/Service";
import { ProcessInfo } from "../model/ProcessInfo";
import { ProcessedRequest } from "../model/ProcessedRequest";
import { MapDetail } from "../model/MapDetail";
var debug = require('debug')('servicefileprovider')

export class ServiceFileProvider {
    configMaps: ServiceConfigMap[];
    type: string

    constructor(public name: string, public fileProviderLocation: string) {
        this.configMaps = [];
        var mapFileName = this.getConfigMapFile();
        debug('loading ' + mapFileName)
        if (!fs.existsSync(mapFileName)) {
            debug('warn: map file name does not exists:' + mapFileName);
            return;
        }

        debug('reading ' + mapFileName)
        var serviceInfo = JSON.parse(fs.readFileSync(mapFileName, 'utf-8'));
        this.configMaps = serviceInfo.maps
        this.type = serviceInfo.type
        debug('configMaps' + JSON.stringify(this.configMaps))
    }

    public async getMapDetail(mapName: string): Promise<MapDetail> {
        return new Promise<MapDetail>((resolve, reject) => {
            var foundMap = this.configMaps.find(m => m.name == mapName);
            if (foundMap === undefined) {
                resolve(undefined)
            }

            var response = ''
            var responseFileName = this.getResponseFileName(foundMap.name, foundMap.type)
            if (fs.existsSync(responseFileName)) {
                response = fs.readFileSync(responseFileName, 'utf-8')
            }

            var request = ''
            var requestFileName = this.getRequestFileName(foundMap.name)
            if (fs.existsSync(requestFileName)) {
                request = fs.readFileSync(requestFileName, 'utf-8')
            }

            resolve(new MapDetail(foundMap.name, foundMap.type, request, response, foundMap.matches));
        });
    }

    public async addNewResponse(mapDetail: MapDetail): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if (this.configMaps === undefined) {
                this.configMaps = []
            }

            var foundConfig = this.configMaps.find(c => c.name == mapDetail.name)
            if (foundConfig === undefined) {
                this.configMaps.push(new ServiceConfigMap(mapDetail.name, foundConfig.type, foundConfig.sleep, mapDetail.matches))
            } else {
                foundConfig.matches = mapDetail.matches
            }

            // Update config
            let configMapFileName = this.getConfigMapFile();

            fs.writeFileSync(configMapFileName, JSON.stringify(
                { type: this.type, maps: this.configMaps }, null, '\t'))

            // write request
            let requestFileName = this.getRequestFileName(mapDetail.name);
            fs.writeFileSync(requestFileName, mapDetail.request)

            // write response
            let responseFileName = this.getResponseFileName(mapDetail.name, mapDetail.type);
            fs.writeFileSync(responseFileName, mapDetail.response)

            debug('done addNewResponse')
            resolve(true)
        });
    }

    public async getResponse(request: string): Promise<ProcessInfo> {
        debug('enter:getResponse');

        debug('getResponse: finding map.')
        var foundConfig = this.configMaps.find(c => {
            if (c.matches === undefined) {
                return false;
            }
            return c.matches.every(m => request.includes(m));
        })

        debug('getResponse:foundConfig:' + foundConfig);
        if (foundConfig === undefined) {
            debug('warn:getResponse map not found');
            return undefined;
        }

        var responseFileName = this.getResponseFileName(foundConfig.name, foundConfig.type);

        return new Promise<ProcessInfo>((resolve, reject) => {
            debug('getResponse: reading file:' + responseFileName);
            if (!fs.existsSync(responseFileName)) {
                resolve(undefined);
                return;
            }

            var encoding = 'utf-8';
            if (foundConfig.type !== undefined && foundConfig.type.length > 0) {
                encoding = foundConfig.type;
            }
            debug(`encoding used: ${encoding}`);
            if (encoding != 'utf-8') {
                return fs.readFile(responseFileName, (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        var processInfo = new ProcessInfo(request);
                        debug(`data length: ${data.length}`);
                        processInfo.responseBuffer = data;
                        processInfo.type = this.type;
                        processInfo.responseType = foundConfig.type;
                        processInfo.matches = foundConfig.matches;
                        processInfo.name = foundConfig.name;
                        processInfo.sleep = foundConfig.sleep;
                        resolve(processInfo);
                    }
                });
            }
            return fs.readFile(responseFileName, { encoding: encoding }, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    var processInfo = new ProcessInfo(request);
                    debug(`data length: ${data.length}`);
                    processInfo.response = data;
                    processInfo.type = this.type;
                    processInfo.responseType = foundConfig.type;
                    processInfo.matches = foundConfig.matches;
                    processInfo.name = foundConfig.name;
                    processInfo.sleep = foundConfig.sleep;
                    resolve(processInfo);
                }
            });
        });
    }

    public getConfigMap(): ServiceConfigMap[] {
        let configFile = this.getConfigMapFile();
        if (fs.existsSync(configFile)) {
            var serviceInfo = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
            return serviceInfo.maps
        }
    }

    public async logRequest(date: Date, status: number, processInfo: ProcessInfo): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            resolve(true);
        });
    }

    public async getProcessedRequests(): Promise<ProcessedRequest[]> {
        return new Promise<ProcessedRequest[]>((resolve) => {
            resolve([]);
        });
    }

    public async clearProcessedRequests(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            resolve(true);
        });
    }

    getDataDirectory(): string {
        return this.fileProviderLocation;
    }

    getServiceDirectory(): string {
        return this.getDataDirectory() + path.sep + this.name;
    }

    getServiceResponseDirectory(): string {
        return this.getDataDirectory() + path.sep + this.name + path.sep + 'responses';
    }

    getServiceRequestDirectory(): string {
        return this.getDataDirectory() + path.sep + this.name + path.sep + 'requests';
    }

    getResponseFileName(requestName: string, type: string): string {
        if (type == "binary") {
            return this.getServiceResponseDirectory() + path.sep + requestName + '.gif';
        }
        return this.getServiceResponseDirectory() + path.sep + requestName + '.xml';
    }

    getRequestFileName(requestName: string): string {
        return this.getServiceRequestDirectory() + path.sep + requestName + '.xml';
    }

    getConfigMapDirectory(serviceName: string): string {
        return this.getServiceDirectory() + path.sep + 'config';
    }

    getConfigMapFile(): string {
        return this.getConfigMapDirectory(this.name) + path.sep + 'map.json';
    }
}