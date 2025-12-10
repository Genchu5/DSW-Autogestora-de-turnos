import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faLocationDot} from '@fortawesome/free-solid-svg-icons'
import type {RoomLabelProps} from "./typesRoom.tsx"

export function RoomLabel({ room, active }: RoomLabelProps){ /*se usan las mismas clases que en oficina porque tiene la misma estructura*/
    const statusClass = active ? 'green' : 'red';
    return (
        <div className={`crud-label office-label ${statusClass}`}>
            <div className="office-header">
                <span className="crud-name main-title">{room.description}</span>
            </div>
            <div className="office-details">
                <span className="crud-name time-range">{room.office.description}</span> 
                <span className="crud-name location-text">{room.office.city.nameCity}<FontAwesomeIcon className="icon-location"icon={faLocationDot}/></span> 
            </div>
        </div>
    );
}