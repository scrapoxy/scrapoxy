// import { Agents } from '@scrapoxy/backend-sdk';
import { Agents, InstallScriptBuilder } from '@scrapoxy/backend-sdk';
import type {
    AxiosInstance,
    AxiosResponse
} from 'axios';
import axios, { AxiosError } from 'axios';
import { type IScalewayCreateInstancesRequest, type IScalewayError, type IScalewayImage, type IScalewayInfo, type IScalewayInstance, type IScalewaySecurityRule, type IScalewaySecurityRuleRequest, type IScalewaySnapshot } from './scaleway.interface';


export class ScalewayError extends Error {
    constructor(
        public errorClass: string,
        message: string
    ) {
        super(message);
    }
}

export class ScalewayApi {
    private readonly instance: AxiosInstance;
    private readonly info: IScalewayInfo;

    constructor(
        secretAccessKey: string,
        region: string,
        projectId: string,
        agents: Agents
    ) {
        this.info = {
            secret_key: secretAccessKey,
            region: region,
            project_id: projectId
        }
        this.instance = axios.create({
            ...agents.axiosDefaults,
            baseURL: `https://api.scaleway.com/instance/v1/zones/${region}`,
            headers: {
                'X-Auth-Token': secretAccessKey,
                'Content-Type': 'application/json'
            }
        });

        this.instance.interceptors.response.use(
            (response) => response,
            (err: any) => {
                if (err instanceof AxiosError) {
                    const errAxios = err as AxiosError;
                    const response = errAxios.response as AxiosResponse;
                    const error = response?.data as IScalewayError;

                    if (error) {
                        let message: string;
                        message = `${error.message} ${response.request.path}\n${response.data})`;
                        console.log(response.data);
                        

                        throw new ScalewayError(
                            error.class,
                            message
                        );
                    }
                }

                throw err;
            }
        );
    }

    //////////// INSTANCES ////////////
    public async getInstance(instanceId: string): Promise<IScalewayInstance> {
        const instance  = await this.instance.get<{server:IScalewayInstance}>(
            `/servers/${instanceId}`,
        ).then(response => response.data.server)
        return instance;
    }

    public async listInstances(tags?: string): Promise<IScalewayInstance[]> { // TODO
        const params = new URLSearchParams()
        if (tags) {
            params.set("tags", tags)
        }
        const instances  = await this.instance.get(
            `/servers/?${params.toString()}`,
            
        ).then(response => response.data.servers)
        return instances;
    }

    public async createInstance(request: IScalewayCreateInstancesRequest): Promise<IScalewayInstance> {
        console.log(request.tags);
        console.log(typeof(request.tags));
        
        request.volumes = {
            "0": {
                size:10000000000,
                volume_type: "b_ssd" 
                }
            }
        if (!request.tags[ 0 ])
            request.tags = ['scrpx']
        const instance = await this.instance.post<{server:IScalewayInstance}>(
            `/servers`,
            request
        ).then(response => response.data.server)
        return instance;
    }

    public async deleteInstance(instanceId: string): Promise<void> {
        await this.instance.delete(
            `/servers/${instanceId}`
        )
    }

    public async startInstance(instanceId: string): Promise<void> {
        await this.instance.post(
            `/servers/${instanceId}/action`,
             {
                action: 'poweron'
             }
        )
    }

    public async stopInstance(instanceId: string): Promise<void> {
        await this.instance.post(
            `/servers/${instanceId}/action`,
             {
                action: 'poweroff'
             }
        )
    }

    public async terminateInstance(instanceId: string): Promise<void> {
        await this.instance.post(
            `/servers/${instanceId}/action`,
             {
                action: 'terminate'
             }
        )
    }

    public async rebootInstance(instanceId: string): Promise<void> {
        await this.instance.post(
            `/servers/${instanceId}/action`,
             {
                action: 'reboot'
             }
        )
    }

    public async attachIP(instanceId: string): Promise<void> {
        await this.instance.post(
            `/ips`,
            {
                server: instanceId,
                type: "routed_ipv4",
                project: this.info.project_id
            }
        )
    }

    public async deleteIP(ipId: string): Promise<void> {
        await this.instance.delete(
            `/ips/${ipId}`
        )
    }

    public async getVolumeSize(type: string): Promise<number> {
        return await this.instance.get(
            `/products/servers`
        ).then((res: {
            data: {
                servers: Record<string, {
                    display_name: string,
                    per_volumes_constraint: {
                        min_size: number
                    }
                }>
            }
        }) => {
            
        const volume = res.data.servers[type]
        if (!volume) throw new Error('Volume type invalid')
            console.log(volume);
        
            return volume.per_volumes_constraint.min_size  
    })}

    //////////// SNAPSHOTS ////////////
    public async createSnapshot(volumeId: string, snapshotName: string): Promise<IScalewaySnapshot> {
        const snapshot = await this.instance.post(
            `/snapshots`,
             {
                project: this.info.project_id,
                volume_id: volumeId,
                name: snapshotName
             }
        ).then(response => response.data.snapshot)
        return snapshot
    }

    public async listSnapshots(): Promise<IScalewaySnapshot[]> {
        const response = await this.instance.get(
            `/snapshots`
        ).then(response => response.data)
        return response
    }

    public async getSnapshot(snapshotId: string): Promise<IScalewaySnapshot> {
        const response = await this.instance.get(
            `/snapshots/${snapshotId}`
        ).then(response => response.data.snapshot)
        return response
    }

    public async deleteSnapshot(snapshotId: string): Promise<void> {
        await this.instance.delete(
            `/snapshots/${snapshotId}`
        )
    }

    //////////// IMAGES ////////////
    public async createImage(imageName: string, snapshotId: string, arch: string): Promise<IScalewayImage> {
        const imageId = await this.instance.post(
            `/images`,
             {
                name: imageName,
                root_volume: snapshotId,
                arch: arch,
                project: this.info.project_id
             }
        ).then(response => response.data.image)
        return imageId
    }

    public async getImage(imageId: string): Promise<IScalewayImage> {
        const response = await this.instance.get(
            `/images/${imageId}`
        ).then(response => response.data.image)
        return response
    }

    public async deleteImage(imageId: string): Promise<void> {
        await this.instance.delete(
            `/images/${imageId}`
        )
    }

    //////////// USER DATA ////////////
    public async setCloudInit(instanceId: string){
        this.instance.defaults.headers['Content-Type'] = 'text/plain'
        try {
            const script = await new InstallScriptBuilder({cert:'toto', key:'toto'}).build()
            await this.instance.patch(
                `/servers/${instanceId}/user_data/cloud-init`,
                script
            )
        } catch (error) {}
        this.instance.defaults.headers['Content-Type'] = "application/json"
    }

    public async setUserData(instanceId: string, userData: string){
        this.instance.defaults.headers['Content-Type'] = 'text/plain'
        try {
            await this.instance.patch(
                `/servers/${instanceId}/user_data/cloud-init`,
                userData
            )
        } catch (error) {}
        this.instance.defaults.headers['Content-Type'] = "application/json"
    }

    //////////// SECURITY GROUP ////////////
    public async createSecurityGroup(securityGroupName: string, description?: string): Promise<string> {
        const groupId = await this.instance.post(
            `/security_groups`,
             {
                project: this.info.project_id,
                name: securityGroupName,
                description: description
             }
        ).then(response => response.data.security_group.id)
        return groupId
    }

    public async deleteSecurityGroup(groupId: string): Promise<void> {
        await this.instance.delete(
            `/security_groups/${groupId}`
        )
    }

    public async getSecurityGroup(groupId: string): Promise<boolean> {
        try {
            await this.instance.get(
                `/security_groups/${groupId}`
            )
        } catch (ScalewayError) {
            return false;
        }
        return true
    }

    public async createSecurityRule(groupId: string, request: IScalewaySecurityRuleRequest): Promise<IScalewaySecurityRule> {
        const data = await this.instance.post(
            `/security_groups/${groupId}/rules`,
             {
                protocol: request.protocol,
                direction: request.direction,
                action: request.action,
                ip_range: request.ip_range,
                dest_port_from: request.dest_port_from,
                dest_port_to: request.dest_port_to,
                position: request.position,
                editable: request.editable
             }
        ).then(response => response.data)
        return data
    }

    public async deleteSecurityRule(groupId:string, ruleId: string): Promise<void> {
        await this.instance.delete(
            `/security_groups/${groupId}/rules/${ruleId}`
        )
    }

    public async listInstanceTypes(types?: string[]): Promise<string[]> {
        return await this.instance.get(
            `/products/servers`
        ).then(response => Object.keys(response.data.servers).filter((key: string) => types ?types.includes(key) : true))
    }

    public async listImages(): Promise<IScalewaySnapshot> {
        const response = await this.instance.get(
            `/images`
        ).then(response => response.data)
        
        return response
    }
}

// let agents = new Agents();
// if (!process.env.SCW_SECRET_KEY || !process.env.SCW_DEFAULT_ZONE || !process.env.SCW_PROJECT_ID) {
//     throw new Error("No Scaleway data")
// }
// let api = new ScalewayApi(process.env.SCW_SECRET_KEY, process.env.SCW_DEFAULT_ZONE, process.env.SCW_PROJECT_ID, agents);

// const FILTER_INSTANCE_TYPES = [
//     'COPARM1-2C-8G',
//     'DEV1-S',
//     'DEV1-M',
//     'PLAY2-NANO',
//     'PLAY2-MICRO'
// ];

// console.log(await api.listInstanceTypes(FILTER_INSTANCE_TYPES));

// try {
//     const size = await api.getVolumeSize("DEV1-L")
//     console.log(size);
    
//     // const inst = await api.listInstances('')
//     // console.log(inst);
    
//     let groupId = await api.createSecurityGroup("testSecurityGroup", "Cecie un est un security group")
//     await api.createSecurityRule(groupId, {
//         action: "drop",
//         direction: "inbound",
//         editable: true,
//         protocol: 'TCP',
//         ip_range: '0.0.0.0/0',
//         position: 1
//     })

//     // const response = await api.listInstanceTypes()
//     const instance = await api.createInstance({
//         name: "test_instance",
//         project: process.env.SCW_PROJECT_ID,
//         commercial_type: "DEV1-S",
//         image: "ubuntu_noble",
//         // dynamic_ip_required: true,
//         // enable_ipv6: true,
//         // security_group: groupId,
//         // volumes: {
//         // "0": {
//         //     size:10000000000,
//         //     volume_type: "b_ssd" 
//         //     }
//         // },
//         tags: ['scraproxy']
//     })
//     // console.log(await api.getSecurityGroup('toto'))
//     console.log(await api.getSecurityGroup(groupId))
//     console.log(instance.state);
    
//     await api.attachIP(instance.id)
//     await api.setCloudInit(instance.id)
//     console.log("Create snapshot");
//     let snapshot = await api.createSnapshot(instance.volumes["0"].id, "snip_snap")
    
//     while (true) {
//         snapshot = await api.getSnapshot(snapshot.id)
        
//         if (snapshot.state ===  EScalewaySnapshotState.AVAILABLE)
//             break ;
//     }
//     console.log('Create image');
//     console.log(instance.image.arch);
    
//     let image = await api.createImage('picture', snapshot.id, instance.image.arch)
//     console.log(image)

//     await api.deleteInstance(instance.id)

//     // let groupId = await api.createSecurityGroup("testSecurityGroup", "Cecie un est un security group")
//     // await api.createSecurityRule({
//     //     action: "drop",
//     //     direction: "inbound",
//     //     editable: true,
//     //     protocol: 'TCP',
//     //     ip_range: '0.0.0.0/0',
//     //     position: 1
//     // }, groupId)
// } catch (error) {
//     console.log(error);
    
// }

// // console.log(api.listSnapshots().then(res => console.log(res)));





// // await api.startInstance(instance.id)
// // async function tryAgain(state: string) {
// //     console.log(state)
// //     let ins = await api.getInstance(instance.id);
// //     if (ins.state !== state)
// //         setTimeout(() => tryAgain(state), 1000);
// //     else {
// //         await api.stopInstance(instance.id)
        
// //         console.log(instance);
// //         console.log(instance.id)
// //         // await api.removeInstance(instance.id)
// //     }
// //     }
// // await tryAgain("running")

// // async function tryAgain(state: string, method: { (instanceId: string): Promise<void>; (arg0: string): any; }) {
// //     console.log(state)
// //     let ins = await api.getInstance(instance.id);
// //     if (ins.state !== state)
// //         setTimeout(() => tryAgain(state, method), 1000);
// //     else {
// //         await method(instance.id)
// //         // await api.stopInstance(instance.id)
        
// //         console.log(instance);
// //         console.log(instance.id)
        
// //         // await api.removeInstance(instance.id)
// //     }
// //     }
// // await tryAgain("running", api.stopInstance)

// // api.removeInstance(instance.id)\\