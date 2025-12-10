import "../CRUDSLabel.css"

interface UserLabelProps {
    user: {
        email: string;
        name: string;
        surname:string;
        active:boolean
    };
}

export function UserLabel({ user }: UserLabelProps){
    const statusClass = user.active ? 'green' : 'red';
    return (
        <div className={`crud-label user-label ${statusClass}`}>
            <span className="crud-email">{user.email}</span>
            <div className="user-name-group">
                <span className="crud-name">{user.name}</span>
                <span className="crud-name">{user.surname}</span>
            </div>
        </div>
    );
}