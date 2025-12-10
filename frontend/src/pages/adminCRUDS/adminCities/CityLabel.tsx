interface CityLabelProps {
    city: {
        idCity: string;
        nameCity: string;
        province: {
            nameProvince: string;
            active?: boolean;
        };
        active: boolean;
    };
    
}

export function CityLabel({ city }: CityLabelProps){
    const statusClass = city.active ? 'green' : 'red';
    return (
        <div className={`crud-label city-label ${statusClass}`}>
            <span className="crud-name city">{city.nameCity}</span>
            <span className="crud-name">{city.province.nameProvince}</span>
        </div>
    );
}