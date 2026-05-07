import api from "../../../axios"
import type { Person, Office } from "../../types";

export function getAllUsers(): Promise<Person[]>{
    return api.get('/people/NoAdmin')
    .then(response => response.data.data)
    .catch(err => {
        const backendMsg = err.response?.data?.message || err.message;
        throw new Error(backendMsg);
    }
    )
}

export function findAllProfessionals(): Promise<Person[]>{
    return api.get('/people/type/professional')
    .then(response => response.data.data)
    .catch(()=> {
        return [];
    });
}

export function findAllActiveProfessionals(): Promise<Person[]>{
    return api.get('/people/type/active/professional')
    .then(response => response.data.data)
    .catch((err: any) => {
        const backendMsg = err.response?.data?.message || err.message;
        throw new Error(backendMsg);
    });
}

export function findAllActiveClients(): Promise<Person[]>{
    return api.get('/people/type/active/client')
    .then(response => response.data.data)
    .catch((err: any) => {
        const backendMsg = err.response?.data?.message || err.message;
        throw new Error(backendMsg);
    });
}

export function findProfessionalsOfficeSpecialty(officeId:string,speciality?:string): Promise<Person[]>{
    return api.get(`/people/professionals/office/${officeId}${speciality ? "/" + speciality : ""}`)
    .then(response => response.data.data)
    .catch((err: any) => {
        const backendMsg = err.response?.data?.message || err.message;
        throw new Error(backendMsg);
    });
}

export function findOne(email:string): Promise<Person>{
    return api.get(`/people/${email}`)
    .then(response => response.data.data)
    .catch(()=> {
        return [];
    });
}

export function toggleState(email:string){
    return api.patch(`/people/${email}/toggleState`)
    .then(res => res.data)
    .catch(err => {
        const backendMsg = err.response?.data?.message || err.message;
        throw new Error(backendMsg)
    })
}

export function registerProfessional(data: Person): Promise<{token:string}>{
    return api.post('/people',{
        name: data.name,
        surname: data.surname,
        email: data.email,
        docType: data.docType,
        docNumber: data.docNumber,
        phoneNumber :data.phoneNumber,
        password: data.password,
        speciality: data.speciality,
        type: data.type
    })
    .then(res => res.data)
    .catch(err => {
      const backendMsg = err.response?.data?.message || err.message;
      throw new Error(backendMsg);
    });
}