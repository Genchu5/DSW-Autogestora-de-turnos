import { useEffect, useState } from "react";
import type {Person} from "../../types.ts"
import './appointmentDetails.css';
import { FaChevronLeft, FaPhone, FaUserTie } from 'react-icons/fa';
import { useLocation} from 'react-router-dom';
import { toast } from "react-toastify";
import { findPerson, getDecodedToken } from "../../commonServices.ts";
import type { appointmentDetailsProps, partialAppointment } from "../appointmentTypes.ts";
import { AppointmentGridModule } from "./gridAppointment/appointmentGridModule.tsx";
import { AppointmentCreationModal } from "./appointmentModal/appointmentCreationModal.tsx";
import {createAppointment, getAvailableAppointmentsForPatient} from "../appointmentsService.ts"
import { useNavigate } from "react-router-dom";

export function AppointmentDetails() {

    const navigate = useNavigate();
    const [patient, setPatient] = useState<Person | undefined>(undefined);
    const [showSimple, setShowSimple] = useState(true);
    const [showTaller, setShowTaller] = useState(true);
    const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
    const [possibleAppointments, setPossibleAppointments] = useState<partialAppointment[]>([]);
    const [selectedAppointment, setSelectedAppointment] = useState<partialAppointment | undefined>();

    const location = useLocation();
    const state = location.state as appointmentDetailsProps | null;

    useEffect(() => {
        const decoded = getDecodedToken();
        if (!decoded) return;
        const email = decoded.email
        findPerson(email)
        .then(data => {
            if (!data) {
            toast.error("No se encontró el paciente");
            return;
            }
        setPatient(data);
        })
            .catch(err => toast.error(`Error al cargar el paciente: ${err.message}`));
    }, []);

    const office = state?.office;
    const professional = state?.professional;

    useEffect(() => {
    if (professional && office) {
        getAvailableAppointmentsForPatient(professional.email,office.idOffice)
        .then(data => {
            setPossibleAppointments(data);
            console.log(data);
        })
        .catch(err => {
            toast.error(`Error: ${err.message}`);
        });
    }
    }, [professional, office]);

    async function addAppointment(newAppointment:{date: string,initialHour: string,type: "simple" | "taller",professionalEmail: string,officeId: string}){     
        try{
            await createAppointment(newAppointment);
        }catch (error:any){
            toast.error(`Error al solicitar el turno: ${error.message}`);
            throw error;
        }
    }
    
    if (!office || !professional || !patient) {
        return <div>Faltan datos del paciente o profesional u oficina.</div>;
    }else {
    return (
        <>
            <div className="appointment-details-container">
                <div className="appointment-details-wrapper">
                    <div className="appointment-details-header">
                        <button className="appointment-details-back-btn" onClick={() => navigate("/Appointment")}>
                        <FaChevronLeft size={24} />
                        </button>
                        <h1 className="appointment-details-title">Detalles del turno</h1>
                    </div>

                    <div className="appointment-details-content">
                        <div className="appointment-details-grid">
                            {/* Paciente Section */}
                            <div className="appointment-patient-section">
                                <div className="appointment-section-header">
                                    <h2 className="appointment-section-title">Paciente</h2>
                                    <FaChevronLeft className="appointment-section-chevron" size={20} />
                                </div>

                                <div className="appointment-info-list">
                                    <div>
                                        <span className="appointment-info-label">Nombre</span>
                                        <span className="appointment-info-value"> - {patient.name}</span>
                                    </div>
                                    <div>
                                        <span className="appointment-info-label">Apellido</span>
                                        <span className="appointment-info-value"> - {patient.surname}</span>
                                    </div>
                                    <div>
                                        <span className="appointment-info-label">Email</span>
                                        <span className="appointment-info-value"> - {patient.email}</span>
                                    </div>
                                    <div>
                                        <span className="appointment-info-label">Telefono</span>
                                        <span className="appointment-info-value"> - {patient.phoneNumber}</span>
                                    </div>
                                    <div>
                                        <span className="appointment-info-label">DNI</span>
                                        <span className="appointment-info-value"> - {patient.docNumber}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Profesional Section */}
                            <div className="appointment-professional-section">
                                <div className="appointment-section-header">
                                <h2 className="appointment-section-title">Profesional</h2>
                                <FaChevronLeft className="appointment-section-chevron" size={20} />
                                </div>

                                <div className="appointment-professional-details-info">
                                    <div className="appointment-professional-details-card">
                                        <div className="appointment-professional-details-avatar">
                                            <FaUserTie className="appointment-avatar-details-icon" />
                                        </div>

                                        <div className="appointment-professional-details">
                                            <div className="appointment-professional-name-wrapper">
                                                <span className="appointment-professional-name">{professional.name + ", " +professional.surname}</span>
                                                <FaPhone size={16} className="appointment-professional-phone" />
                                            </div>
                                            <p className="appointment-professional-specialty">{professional.speciality}</p>
                                        </div>
                                    </div>

                                    <div className="appointment-location-info">
                                        <span className="appointment-info-label">Lugar</span>
                                        <span className="appointment-info-value"> - {office.description + ", " + office.city.nameCity}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="appointment-details-table-container">
                <div className="appointment-header-table-container">
                    <div>
                        <div className="appointment-instruction">Seleccione un horario para su turno:</div>
                    </div>
                    <div className="appointment-filter-container">
                        <div className="appointment-checkbox-simple">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={showSimple}
                                    onChange={() => setShowSimple(!showSimple)}
                                />
                                <span>Turno simple</span>
                            </label>
                        </div>
                        <div className="appointment-checkbox-taller">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={showTaller}
                                    onChange={() => setShowTaller(!showTaller)}
                                />
                                <div>Turno taller</div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="appointment-table-container">
                    <AppointmentGridModule appointments={possibleAppointments} showSimple={showSimple} showTaller={showTaller} setAppointmentModalOpen={setAppointmentModalOpen} setSelectedAppointment={setSelectedAppointment}/>
                </div>
                
            </div>
            <div>
                <AppointmentCreationModal isOpen={appointmentModalOpen} onClose={() => setAppointmentModalOpen(false)} appointment={selectedAppointment} professional={professional} office={office} onCreate={addAppointment}/>
            </div>
        </>
    );
}}