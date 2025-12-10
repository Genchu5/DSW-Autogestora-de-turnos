import "../CRUDSLabel.css";
import "./OfficeLabel.css";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faLocationDot} from '@fortawesome/free-solid-svg-icons'
import type {OfficeLabelProps} from "./typesOffice.tsx"

export function OfficeLabel({ office,  active }: OfficeLabelProps){
  const statusClass = active ? 'green' : 'red';
  return (
    <div className={`crud-label office-label ${statusClass}`}>
      <div className="office-header">
        <span className="crud-name main-title">{office.description}</span>
      </div>
      <div className="office-details">
        <span className="crud-name time-range">De {office.openingTime}hs a {office.closingTime}hs</span>
        <span className="crud-name location-text">{office.city.nameCity}, {office.city.province.nameProvince}<FontAwesomeIcon className="icon-location"icon={faLocationDot}/></span>
      </div>
    </div>
  );
}