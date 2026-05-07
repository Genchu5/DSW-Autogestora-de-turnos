import { useState } from "react";
import type { appointmentCreationModalProps } from "../../appointmentTypes.ts"
import "./appointmentCreationModal.css"
import { FaChevronLeft, FaTimes , FaPhone, FaUserTie } from 'react-icons/fa';
import { ToastContainer, toast } from "react-toastify";
export function diffInMinutes(time1: string, time2: string): number {
  const [h1, m1] = time1.split(":").map(Number);
  const [h2, m2] = time2.split(":").map(Number);

  const total1 = h1 * 60 + m1;
  const total2 = h2 * 60 + m2;

  return total1 - total2;
}

export function AppointmentCreationModal({isOpen, onClose, appointment, professional, office, onCreate}: appointmentCreationModalProps) {
    const [showButton, setShowButton] = useState(true);

    let auxDate;
    if (appointment){
        auxDate = new Date(appointment.date);
    }
    function handleKeyDown(event: React.KeyboardEvent) {
        if (event.key !== 'Enter') {
            return;
        } 
    }
    let fechaFormateada = "";
    let fechaAppointment = "";
    let diaFormateado = "";
    if (appointment && auxDate){
        const day = String(auxDate.getDate()).padStart(2, "0");       // "12"
        const month = String(auxDate.getMonth() + 1).padStart(2, "0"); // "11"
        const year = String(auxDate.getFullYear());          // "2025"

        fechaFormateada = `${day}/${month}/${year}`;
        fechaAppointment = `${year}-${month}-${day}`;
        diaFormateado = (auxDate.toLocaleDateString("es-ES", { weekday: "long" })).charAt(0).toUpperCase() + (auxDate.toLocaleDateString("es-ES", { weekday: "long" })).slice(1)
    }

    async function handleSubmit(){
        if (appointment){
            setShowButton(false);
            try {
                await onCreate({date: fechaAppointment,initialHour: appointment.initialHour,type: appointment.type,professionalEmail: professional.email,officeId: office.idOffice});
                toast.success("Turno solicitado con éxito", { onClose: () => onClose() });
            } catch {
                setShowButton(true);
            }
        }
    }

    function handleClose(){
        setShowButton(true);
        onClose();
    }

    if (!isOpen || !appointment) return null;
    return (
        <>
            <div className="appointment-modal-overlay" onClick={()=>handleClose()}>
                <ToastContainer className = {`toast-container`} draggable={false}/>
                <div className="appointment-modal-details-container" onClick={(e) => e.stopPropagation()}  onKeyDown={handleKeyDown}>
                    <div className="appointment-modal-details-wrapper">
                        <div className="appointment-modal-details-header">
                            <button className="appointment-modal-details-close-btn" onClick={()=>handleClose()}>
                            <FaTimes  size={25} />
                            </button>
                            <h1 className="appointment-modal-details-title">Detalles del turno</h1>
                        </div>

                        <div className="appointment-modal-details-content">

                            {/* Appointment Section */}
                            <div className="appointment-modal-professional-section">
                                <div className="appointment-modal-section-header">
                                    <h2 className="appointment-modal-section-title">Turno</h2>
                                    <FaChevronLeft className="appointment-modal-section-chevron" size={20} />
                                </div>

                                <div className="appointment-modal-professional-details-info">
                                    <div className="appointment-modal-location-info">
                                        <span className="appointment-modal-info-label">Día</span>
                                        <span className="appointment-modal-info-value"> - {diaFormateado} {fechaFormateada}</span>
                                    </div>
                                    <div className="appointment-modal-location-info">
                                        <span className="appointment-modal-info-label">Horario</span>
                                        <span className="appointment-modal-info-value"> - {appointment ? appointment.initialHour: "Sin fecha"} horas</span>
                                    </div>
                                    <div className="appointment-modal-location-info">
                                        <span className="appointment-modal-info-label">Duración estimada</span>
                                        <span className="appointment-modal-info-value"> - {diffInMinutes(appointment.finalHour, appointment.initialHour)} minutos</span>
                                    </div>
                                </div>
                            </div>

                            {/* Profesional Section */}
                            <div className="appointment-modal-professional-section">
                                <div className="appointment-modal-section-header">
                                    <h2 className="appointment-modal-section-title">Profesional</h2>
                                    <FaChevronLeft className="appointment-modal-section-chevron" size={20} />
                                </div>

                                <div className="appointment-modal-professional-details-info">
                                    <div className="appointment-modal-professional-details-card">
                                        <div className="appointment-modal-professional-details-avatar">
                                            <FaUserTie className="appointment-modal-avatar-details-icon" />
                                        </div>

                                        <div className="appointment-modal-professional-details">
                                            <div className="appointment-modal-professional-name-wrapper">
                                                <span className="appointment-modal-professional-name">{professional.name + ", " +professional.surname}</span>
                                                <FaPhone size={16} className="appointment-modal-professional-phone" />
                                            </div>
                                            <p className="appointment-modal-professional-specialty">{professional.speciality}</p>
                                        </div>
                                    </div>

                                    <div className="appointment-modal-location-info">
                                        <span className="appointment-modal-info-label">Lugar</span>
                                        <span className="appointment-modal-info-value"> - {office.description + ", " + office.city.nameCity}</span>
                                    </div>
                                </div>
                            </div>
                            {showButton ?
                            <button className="appointment-modal-reserve-btn" onClick={()=>handleSubmit()}>Solicitar turno</button>:
                            <div className="appointment-modal-spinner"></div>}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}