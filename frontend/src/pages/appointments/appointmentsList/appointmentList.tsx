import "./appointmentList.css";
import {NavZone} from "../../../components/navZone/NavZone";
import type{ Appointment, Office, Person, Diagnostic} from "../../types.ts"
import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { findPerson, getDecodedToken } from "../../commonServices.ts";
import { findAllActiveOffices } from "../../adminCRUDS/adminOffices/OfficeService.ts";
import {findProfessionalAppointments, findPatientAppointments, createProfessionalAppointment} from "../appointmentsService.ts"
import { AppointmentsGrid } from "./appointmentsGrid.tsx";
import { AppointmentsGridFilter } from "./appointmentsGridFilter.tsx";
import { FaPlus } from "react-icons/fa";
import { ProfessionalAppointmentModal } from "./professionalAppointmentModal/professionalAppointmentModal.tsx";


export function AppointmentsList(){

  // --- FUNCIONES HELPER 
  const isAppointmentAttended = (app: Appointment): boolean => {
    return app.diagnostics &&
      app.diagnostics.length > 0 &&
      app.diagnostics.every(d => d.state === "assisted");
    };

  const [person, setPerson] = useState<Person | undefined>(undefined);
  const [offices, setOffices] = useState<Office[] | []>([]);
  const [officeToFilter, setOfficeToFilter] = useState<Office|undefined>(undefined);
  const [acceptedFilter, setAcceptedFilter] = useState(false);
  const [attendedFilter, setAttendedFilter] = useState(false);
  const [unattendedFilter, setUnattendedFilter] = useState(false);
  const [pendingFilter, setPendingFilter] = useState(false); // Añadido el filtro pendiente
  const [appointments, setAppointments] = useState<Appointment[] | []>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[] | []>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [peopleMap, setPeopleMap] = useState<Map<string,string>>(new Map());
  const [personToFilter, setPersonToFilter] = useState<string | undefined>(undefined);
  const [pagesAppointment, setPagesAppointment] = useState<number>(0);
  const [showButtonMore, setShowButtonMore] = useState(false);

  const [openProfAppoModal, setOpenProfAppoModal] = useState(false);

  useEffect(() => {

    const decoded = getDecodedToken();
    if (!decoded) return;
        const email = decoded.email
        findPerson(email)               
        .then(data => {
        if (!data) {
        toast.error("No se encontró a la persona");
        return;
        }
        setPerson(data);
      })
      .catch(err => toast.error(`Error al cargar al profesional: ${err.message}`));
    }, []);

useEffect(() => {
    if (!person || openProfAppoModal) return;
    let ignore = false;

    setIsLoading(true);
    let promise;

    if (person.type === "professional") {
      promise = findProfessionalAppointments(pagesAppointment);
    } else {
      promise = findPatientAppointments(pagesAppointment);
    }

    promise.then(async (enrichedAppointments) => {
      if (ignore) return; //eliminar en produccion (se pone esto por el stricted mode que ejecuta las peticiones dos veces) 

      if (enrichedAppointments.length == 15){
        setShowButtonMore(true);
      }else{
        setShowButtonMore(false);
      }
      // Extraer todos los emails únicos de la lista
      const uniqueEmails = new Set<string>();
      enrichedAppointments.forEach(app => {
        uniqueEmails.add(app.professional.email);
        app.diagnostics?.forEach(d => { 
          uniqueEmails.add(d.patient);
        });
      });

      const personPromises = Array.from(uniqueEmails).map(email =>
        findPerson(email).catch(() => null)
      );

      const peopleData = await Promise.all(personPromises);

      const newPeopleMap = new Map<string, string>();
      peopleData.forEach(p => {
        if (p && p.email !== person.email) {
          newPeopleMap.set(p.email, `${p.name} ${p.surname}`);
        }
      });
      setPeopleMap(newPeopleMap);
      setAppointments(enrichedAppointments);
    })
    .catch(err => {
      if (ignore) return; //eliminar en produccion
      toast.error(`Error al obtener turnos: ${err.message}`);
    })
    .finally(() => {
      if (ignore) return; //eliminar en produccion
      setIsLoading(false);
    });

    return () => {
       ignore = true; //eliminar en produccion
    };

  }, [openProfAppoModal,person]);

  useEffect(() => {
    if(!person) return ;
    let ignore = false;

    setIsLoading(true);
    let promise;

    if (person.type === "professional") {
      promise = findProfessionalAppointments(pagesAppointment);
    } else {
      promise = findPatientAppointments(pagesAppointment);
    }

    promise.then(async (enrichedAppointments) => {
      if (ignore) return; //eliminar en produccion (se pone esto por el stricted mode que ejecuta las peticiones dos veces) 

      if (enrichedAppointments.length == 15){
        setShowButtonMore(true);
      }else{
        setShowButtonMore(false);
      }
      // Extraer todos los emails únicos de la lista
      const uniqueEmails = new Set<string>();
      enrichedAppointments.forEach(app => {
        uniqueEmails.add(app.professional.email);
        app.diagnostics?.forEach(d => { 
          uniqueEmails.add(d.patient);
        });
      });

      const personPromises = Array.from(uniqueEmails).map(email =>
        findPerson(email).catch(() => null)
      );

      const peopleData = await Promise.all(personPromises);

      const newPeopleMap = new Map<string, string>();
      peopleData.forEach(p => {
        if (p && p.email !== person.email) {
          newPeopleMap.set(p.email, `${p.name} ${p.surname}`);
        }
      });
      
      setPeopleMap(newPeopleMap);
      
      setAppointments((prev) => [...prev, ...enrichedAppointments]);
    })
    .catch(err => {
      if (ignore) return; //eliminar en produccion
      toast.error(`Error al obtener turnos: ${err.message}`);
    })
    .finally(() => {
      if (ignore) return; //eliminar en produccion
      setIsLoading(false);
    });
  },[pagesAppointment]);


  // Callback para que la CELDA notifique al PADRE de cambios en DIAGNÓSTICOS
  const handleDiagnosticsUpdate = (
    idAppointment: number, 
    updatedDiagnostics: Diagnostic[]
  ) => {
    setAppointments(currentAppointments =>
      currentAppointments.map(app =>
        app.numAppointment === idAppointment
          ? { ...app, diagnostics: updatedDiagnostics }
          : app
      )
    );
  };

  // Callback para que la CELDA notifique al PADRE de cambios de ESTADO (Aceptado, Cancelado)
    const handleAppointmentStateUpdate = (
    idAppointment: number,
    newState: string
  ) => {
    setAppointments(currentAppointments =>
      currentAppointments.map(app =>
        app.numAppointment === idAppointment
          ? { ...app, state: newState }
          : app
      )
    );
  };
  
  useEffect(() => {
      findAllActiveOffices()
      .then(data => {
          setOffices(data);
      })
      .catch(err => {
          toast.error("Error cargando salas:", err);
      });
  }, []);

    // --- useEffect DE FILTRADO (Ahora reacciona a todo) ---
  useEffect(() => {
    let filtered = appointments;

    // 1. Filtro de Consultorio
    if (officeToFilter) {
      filtered = filtered.filter(app => app.room.office.idOffice === officeToFilter.idOffice);
    }

    if(personToFilter){
      filtered = filtered.filter(app => app.professional.email === personToFilter || app.diagnostics.some(d => d.patient == personToFilter))
    }

    // 2. Filtros de Estado
    const anyStateFilterActive = acceptedFilter || attendedFilter || unattendedFilter || pendingFilter;

    if (anyStateFilterActive) {
      filtered = filtered.filter(app => {
        // Filtro "Pendientes"
        if (pendingFilter && app.state === "pending") {
          return true;
        }
        // Filtro "Aceptados"
        if (acceptedFilter && app.state === "accepted") {
          return true;
        }
        // Filtro "Atendidos" (lógica derivada)
        if (attendedFilter && isAppointmentAttended(app)) {
          return true;
        }
        // Filtro "No atendidos" (lógica derivada)
        if (unattendedFilter && !isAppointmentAttended(app)) {
          return true;
        }
        return false;
      });
    }

    setFilteredAppointments(filtered);

  }, [appointments, officeToFilter, acceptedFilter, attendedFilter, unattendedFilter, pendingFilter, personToFilter]);

  if (isLoading && person) {
    return (
      <div className="appointments-status-state">
        <p>Cargando los turnos...</p>
      </div>
    );
  }

  async function addAppointment(newAppointment:{date: string,initialHour: string,finalHour: string,room: string,type: string,value: number,patientEmail: string}){
    try{
      const createdAppointment = await createProfessionalAppointment(newAppointment)
      if ( createdAppointment ){
          //setAppointments([createdAppointment, ...appointments]);
          toast.success(`Turno creado con éxito`);
          setOpenProfAppoModal(false);
        }
    }catch (error:any){
      toast.error(`Error al crear el turno: ${error.message}`);
    }
  }
 
  if(person){
    return (
        <div className="appointment-person-container">
          <div className="appointment-container">
            <div className="upper-appointment-container">
              <div className="sub-upper-appointment-container">
                <NavZone title={`Turnos de ${person.name}, ${person.surname}`}/>
                {
                  person.type === "professional" ? 
                  <div className="create-professional-appointment-container" onClick={()=>setOpenProfAppoModal(true)}>
                    <p>Crear un turno</p>
                    <FaPlus className="create-professional-appointment-icon" size={24}/>
                  </div> 
                  : <></>
                }
              </div>
              <ToastContainer className = {`toast-container`} draggable={false}/>
              <AppointmentsGridFilter appointments={appointments} 
                offices={offices} 
                setOfficeToFilter={setOfficeToFilter} 
                acceptedFilter={acceptedFilter} 
                setAcceptedFilter={setAcceptedFilter}
                attendedFilter={attendedFilter}
                setAttendedFilter={setAttendedFilter}
                unattendedFilter={unattendedFilter}
                setUnattendedFilter={setUnattendedFilter}
                pendingFilter={pendingFilter}
                setPendingFilter={setPendingFilter}
                setPersonToFilter={setPersonToFilter}
                peopleMap = {peopleMap}
                userType={person.type}
                />
                
            </div>
            <div className="appointment-subcontainer">
              {isLoading ? (
                <div className="appointments-status-state">
                  <span>Cargando turnos...</span>
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="appointments-empty-state">
                  <span>Sin turnos para mostrar</span>
                  <small>No hay turnos que coincidan con los filtros aplicados.</small>
                </div>
              ) : (
                <AppointmentsGrid
                  appointments={filteredAppointments}
                  user={person}
                  onDiagnosticsUpdate={handleDiagnosticsUpdate}
                  onAppointmentStateUpdate={handleAppointmentStateUpdate}
                />
              )}
            </div>
            {showButtonMore ? 
              <button className="nextPageButton" onClick={()=>setPagesAppointment(pagesAppointment+1)}>Cargar mas turnos</button>
            : <></>}
            
          </div>    
          <ProfessionalAppointmentModal isOpen={openProfAppoModal} onClose={() => setOpenProfAppoModal(false)} onCreate={addAppointment} user={person}/>
        </div>
      );
  } 

  return null;
}

