import { useState, useEffect } from 'react';
import { findAllActiveOffices } from "../../adminCRUDS/adminOffices/OfficeService.ts";
import { toast } from "react-toastify";
import type { Office, Person } from "../../types.ts"
import './appointmentInput.css';
import { findAllActiveProfessionals, findProfessionalsOfficeSpecialty, findOne } from "../../adminCRUDS/adminUsers/usersService.ts";
import { FaExclamationTriangle, FaAngleDown } from "react-icons/fa";
import { ProfessionalCard } from './professionalCard.tsx';

export function AppointmentInput() {

    const [officesList, setOfficesList] = useState<Office[] | []>([]);
    const [office, setOffice] = useState<Office>();
    const [filteredOffices, setFilteredOffices] = useState<Office[] | []>([]);
    const [officeSelector, setOfficeSelector] = useState(false);
    const [officeInputValue, setOfficeInputValue] = useState<string>('');

    const [specialtiesList, setSpecialtiesList] = useState<string[] | []>([]);
    const [specialty, setSpecialty] = useState<string>();
    const [filteredSpecialties, setFilteredSpecialties] = useState<string[] | []>([]);
    const [specialtySelector, setSpecialtySelector] = useState(false);
    const [specialtyInputValue, setSpecialtyInputValue] = useState<string>('');

    const [professionalsList, setProfessionalsList] = useState<Person[] | []>([]);
    const [professional, setProfessional] = useState<Person>();
    const [filteredProfessionals, setFilteredProfessionals] = useState<Person[] | []>([]);
    const [professionalsToSearch, setProfessionalsToSearch] = useState<Person[] | []>([]);
    const [professionalSelector, setProfessionalSelector] = useState(false);
    const [professionalInputValue, setProfessionalInputValue] = useState<string>('');

    const [showAppointments, setShowAppointments] = useState(false);
    const [errors, setErrors] = useState<{ office?: string; specialtyOrProfessional?: string }>({});
    const [isLoadingProfessionals, setIsLoadingProfessionals] = useState(false);

    // --- Validation ---
    function validateInputs() {
        const newErrors: typeof errors = {};

        if (!office) {
            newErrors.office = "El consultorio es obligatorio";
            setOfficeSelector(false);
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    // --- Load offices ---
    useEffect(() => {
        findAllActiveOffices()
            .then(data => {
                setOfficesList(data);
                setFilteredOffices(data);
            })
            .catch(err => {
                toast.error("Error cargando salas:", err);
            });
    }, []);

    // --- Load professionals & specialties ---
    useEffect(() => {
        findAllActiveProfessionals()
            .then(data => {
                setProfessionalsList(data);
                const specialties = [...new Set(data.map(p => p.speciality))];
                setSpecialtiesList(specialties);
                setFilteredSpecialties(specialties);
                setFilteredProfessionals(data);
            })
            .catch(err => {
                toast.error(`Error cargando profesionales: ${err.message}`);
            });
    }, []);

    // --- Find professionals to show in results ---
    async function findFilteredProfessionals() {
        if (!office) return;
        setIsLoadingProfessionals(true);
        try {
            if (professional) {
                // 1) Traer lista de profesionales del consultorio
                const officeProfs = await findProfessionalsOfficeSpecialty(String(office.idOffice), undefined);
                // 2) Verificar que el profesional elegido pertenezca a ese consultorio
                const belongs = officeProfs.some(p => p.email.toLowerCase() === professional.email.toLowerCase());
                if (belongs) {
                    // 3) findOne solo para traer los datos completos/actualizados del profesional
                    const single = await findOne(professional.email);
                    setProfessionalsToSearch(single ? [single] : []);
                } else {
                    setProfessionalsToSearch([]);
                    toast.warn("El profesional seleccionado no atiende en ese consultorio");
                }
            } else if (specialty) {
                // Consultorio + especialidad → lista filtrada por especialidad
                const data = await findProfessionalsOfficeSpecialty(String(office.idOffice), specialty);
                setProfessionalsToSearch(data);
            } else {
                // Solo consultorio → todos los profesionales del consultorio
                const data = await findProfessionalsOfficeSpecialty(String(office.idOffice), undefined);
                setProfessionalsToSearch(data);
            }
        } catch (err) {
            toast.error("Error cargando profesionales:", err as any);
        } finally {
        setIsLoadingProfessionals(false);
        }
        
    }

    const handleSearch = () => {
        if (!validateInputs()) {
            toast.dismiss();
            return;
        }
        setShowAppointments(true);
        findFilteredProfessionals();
    };

    // --- Filters ---
    function FilterOffices(text: string) {
        const lowertext = text.toLocaleLowerCase();
        setFilteredOffices(
            officesList.filter(off =>
                off.description.toLocaleLowerCase().includes(lowertext)
                || off.city.nameCity.toLocaleLowerCase().includes(lowertext)
                || off.city.province.nameProvince.toLocaleLowerCase().includes(lowertext)
            )
        );
    }

    function FilterProfessionals(text: string) {
        const lowertext = text.toLocaleLowerCase();
        setFilteredProfessionals(
            professionalsList.filter(prof =>
                prof.name.toLocaleLowerCase().includes(lowertext)
                || prof.surname.toLocaleLowerCase().includes(lowertext)
                || prof.speciality.toLocaleLowerCase().includes(lowertext)
            )
        );
    }

    function FilterSpecialties(text: string) {
        const lowertext = text.toLocaleLowerCase();
        setFilteredSpecialties(
            specialtiesList.filter(spe => spe.toLocaleLowerCase().includes(lowertext))
        );
    }

    // --- Select professional: clear specialty ---
    function selectProfessional(prof: Person) {
        setProfessional(prof);
        setProfessionalInputValue(`${prof.name} ${prof.surname}`);
        setProfessionalSelector(false);
        // Clear specialty
        setSpecialty(undefined);
        setSpecialtyInputValue('');
    }

    // --- Select specialty: clear professional ---
    function selectSpecialty(spe: string) {
        setSpecialty(spe);
        setSpecialtyInputValue(spe);
        setSpecialtySelector(false);
        // Clear professional
        setProfessional(undefined);
        setProfessionalInputValue('');
    }

    return (
        <>
            <div className={showAppointments ? 'appointments-input-container reduced' : 'appointments-input-container'}>
                <div className={showAppointments ? 'appointment-input-content reduced' : 'appointment-input-content'}>
                    <div className="appointment-input-title">Encontrá tu turno</div>
                    <div className="appointment-input-card">
                        <div className="appointment-input-form-grid">

                            {/* ── CONSULTORIO ── */}
                            <div className="appointment-input-form-field">
                                <label className="appointment-input-form-label">Consultorio</label>
                                <div className="appointment-input-form-select" onClick={() => setOfficeSelector(!officeSelector)}>
                                    <input
                                        className="appointment-input-filter-input"
                                        placeholder="Buscá por consultorio"
                                        value={officeInputValue}
                                        type="text"
                                        onChange={(e) => {
                                            setOfficeInputValue(e.target.value);
                                            FilterOffices(e.target.value);
                                            if (!officeSelector) setOfficeSelector(true);
                                        }}
                                        onFocus={() => { if (!officeSelector) setOfficeSelector(true); }}
                                        onClick={(e) => { e.stopPropagation(); setOfficeSelector(true); }}
                                    />
                                    <FaAngleDown className={officeSelector ? "appointment-input-icon rotated list-icon" : "appointment-input-icon list-icon"} />
                                </div>
                                {officeSelector && (
                                    <ul className={"appointment-input-filter-list" + (officeSelector ? " active" : " disabled")}>
                                        <li className="appointment-input-filter-list-item" onClick={() => {
                                            setOffice(undefined);
                                            setOfficeInputValue('');
                                            setOfficeSelector(false);
                                        }}>Borrar selección</li>
                                        {filteredOffices.length > 0 ? (
                                            filteredOffices.map((of) => (
                                                <li
                                                    className="appointment-input-filter-list-item"
                                                    key={of.idOffice}
                                                    onClick={() => {
                                                        setOffice(of);
                                                        setOfficeInputValue(`${of.description} - ${of.city.nameCity} - ${of.city.province.nameProvince}`);
                                                        setOfficeSelector(false);
                                                    }}
                                                >
                                                    {of.description} - {of.city.nameCity} - {of.city.province.nameProvince}
                                                </li>
                                            ))
                                        ) : (
                                            <li className="appointment-input-filter-list-item no-results">No se encontraron resultados</li>
                                        )}
                                    </ul>
                                )}
                                <div className="appointment-input-error-container">
                                    {errors.office &&
                                        <div className="appointment-input-error-text">
                                            <FaExclamationTriangle className="appointment-input-error-icon" />{errors.office}
                                        </div>
                                    }
                                </div>
                            </div>

                            {/* ── PROFESIONAL ── */}
                            <div className="appointment-input-form-field">
                                <label className="appointment-input-form-label">Profesional</label>
                                <div className="appointment-input-form-select" onClick={() => setProfessionalSelector(!professionalSelector)}>
                                    <input
                                        className="appointment-input-filter-input"
                                        placeholder="Buscá por profesional"
                                        value={professionalInputValue}
                                        type="text"
                                        onChange={(e) => {
                                            setProfessionalInputValue(e.target.value);
                                            FilterProfessionals(e.target.value);
                                            if (!professionalSelector) setProfessionalSelector(true);
                                            // Si escribe, limpia especialidad
                                            if (e.target.value === '') {
                                                setProfessional(undefined);
                                            }
                                        }}
                                        onFocus={() => {
                                            if (!professionalSelector) setProfessionalSelector(true);
                                            setSpecialtySelector(false);
                                        }}
                                        onClick={(e) => { e.stopPropagation(); setProfessionalSelector(true); }}
                                    />
                                    <FaAngleDown className={professionalSelector ? "appointment-input-icon rotated list-icon" : "appointment-input-icon list-icon"} />
                                </div>
                                {professionalSelector && (
                                    <ul className={"appointment-input-filter-list" + (professionalSelector ? " active" : " disabled")}>
                                        <li className="appointment-input-filter-list-item" onClick={() => {
                                            setProfessional(undefined);
                                            setProfessionalInputValue('');
                                            setProfessionalSelector(false);
                                        }}>Cualquier profesional</li>
                                        {filteredProfessionals.length > 0 ? (
                                            filteredProfessionals.map((prof) => (
                                                <li
                                                    className="appointment-input-filter-list-item"
                                                    key={prof.email}
                                                    onClick={() => selectProfessional(prof)}
                                                >
                                                    {prof.name} {prof.surname}
                                                </li>
                                            ))
                                        ) : (
                                            <li className="appointment-input-filter-list-item no-results">No se encontraron resultados</li>
                                        )}
                                    </ul>
                                )}
                                {/* Error compartido profesional/especialidad — se muestra bajo profesional */}
                                <div className="appointment-input-error-container">
                                    {errors.specialtyOrProfessional &&
                                        <div className="appointment-input-error-text">
                                            <FaExclamationTriangle className="appointment-input-error-icon" />{errors.specialtyOrProfessional}
                                        </div>
                                    }
                                </div>
                            </div>

                            {/* ── ESPECIALIDAD ── */}
                            <div className="appointment-input-form-field">
                                <label className="appointment-input-form-label">Especialidad</label>
                                <div className="appointment-input-form-select" onClick={() => setSpecialtySelector(!specialtySelector)}>
                                    <input
                                        className="appointment-input-filter-input"
                                        placeholder="Buscá por especialidad"
                                        value={specialtyInputValue}
                                        type="text"
                                        onChange={(e) => {
                                            setSpecialtyInputValue(e.target.value);
                                            FilterSpecialties(e.target.value);
                                            if (!specialtySelector) setSpecialtySelector(true);
                                            if (e.target.value === '') {
                                                setSpecialty(undefined);
                                            }
                                        }}
                                        onFocus={() => {
                                            if (!specialtySelector) setSpecialtySelector(true);
                                            setProfessionalSelector(false);
                                        }}
                                        onClick={(e) => { e.stopPropagation(); setSpecialtySelector(true); }}
                                    />
                                    <FaAngleDown className={specialtySelector ? "appointment-input-icon rotated list-icon" : "appointment-input-icon list-icon"} />
                                </div>
                                {specialtySelector && (
                                    <ul className={"appointment-input-filter-list" + (specialtySelector ? " active" : " disabled")}>
                                        <li className="appointment-input-filter-list-item" onClick={() => {
                                            setSpecialty(undefined);
                                            setSpecialtyInputValue('');
                                            setSpecialtySelector(false);
                                        }}>Cualquier especialidad</li>
                                        {filteredSpecialties.length > 0 ? (
                                            filteredSpecialties.map((spe) => (
                                                <li
                                                    className="appointment-input-filter-list-item"
                                                    key={spe}
                                                    onClick={() => selectSpecialty(spe)}
                                                >
                                                    {spe}
                                                </li>
                                            ))
                                        ) : (
                                            <li className="appointment-input-filter-list-item no-results">No se encontraron resultados</li>
                                        )}
                                    </ul>
                                )}
                            </div>

                        </div>

                        <div className="appointment-input-form-actions">
                            <div className="appointment-input-form-hint">
                                {showAppointments
                                    ? `${professionalsToSearch.length} resultado${professionalsToSearch.length !== 1 ? 's' : ''} encontrado${professionalsToSearch.length !== 1 ? 's' : ''}`
                                    : "Ingresá un consultorio para buscar turnos"}
                            </div>
                            <button onClick={handleSearch} className="appointment-input-search-button">
                                Buscar turnos
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className={showAppointments ? 'appointment-input-results-container' : 'appointment-input-results-container hidden'}>
                <div className="appointment-input-professionals-results-content">
                    {isLoadingProfessionals ? (
                        <div className="appointments-status-state">
                            <span>Cargando profesionales...</span>
                        </div>
                    ) : professionalsToSearch.length === 0 ? (
                        <div className="appointments-empty-state">
                            <span>No se encontraron resultados</span>
                            <small>Probá cambiando los filtros de búsqueda.</small>
                        </div>
                    ) : (
                        showAppointments && professionalsToSearch.map((prof) => (
                            <ProfessionalCard key={prof.email} professional={prof} office={office} display={showAppointments} />
                        ))
                    )}
                </div>
            </div>
        </>
    );
}