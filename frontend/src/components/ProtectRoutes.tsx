import react from 'react';
import { useLocation, Outlet, Navigate } from 'react-router-dom';

const ProtectRoutes = () => {
    const location = useLocation();
    const user = localStorage.getItem('user');

    return user ? (
        <Outlet />
    ) : (
        <Navigate to="/login" state={{ from: location }} />
    );
};

export default ProtectRoutes;