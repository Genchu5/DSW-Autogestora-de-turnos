import { FaCalendarAlt, FaClipboardList } from "react-icons/fa";
import HomeCard from "../HomeCard";
import {NavZone} from "../../../components/navZone/NavZone";
import "./professionalHome.css";
import { useEffect, useState } from "react";
import { findPerson, getDecodedToken } from "../../commonServices";
import type { Person } from "../../types";
import { toast, ToastContainer } from "react-toastify";

export function ProfessionalHome() {
  const [professional, setProfessional] = useState<Person | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  
      const decoded = getDecodedToken();
      if (!decoded) return;
        const email = decoded.email
        findPerson(email)
        .then(data => {
          if (!data) {
          toast.error("No se encontró el profesional");
          return;
          }
          setProfessional(data);
        })
        .catch(err => toast.error(`Error al cargar al profesional: ${err.message}`))
        .finally(() => setLoading(false));
    }, []);

  if (loading) {
    return (
      <div className="status-state">
        <p>Cargando los datos...</p>
      </div>
    );
  }
  return (
    <div className="professional-home-container-whole">

      <div className="nav-zone-container">
        <NavZone title={professional 
          ? `Bienvenido ${professional.surname}, ${professional.name}` 
          : ""} 
        />
      </div>
        <div className="professional-cards-container">
          <div className="professional-card"><HomeCard icon={FaCalendarAlt} title="Horarios" link="/scheduleProfessional" /></div>
          <div className="professional-card"><HomeCard icon={FaClipboardList} title="Turnos" link="/appointmentsList" /></div>
        </div>
      <ToastContainer className = {`toast-container`} draggable={false}/>
    </div>
  );
}
